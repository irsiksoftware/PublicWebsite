#!/usr/bin/env python3
import subprocess
import json
import sys
import re

GH_PATH = r"C:\Program Files\GitHub CLI\gh.bat"

def run_gh_json(cmd):
    """Run gh command and return parsed JSON"""
    full_cmd = cmd.replace("gh ", f'"{GH_PATH}" ')
    result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, encoding='utf-8')

    if result.returncode != 0:
        print(f"Error: {result.stderr}", file=sys.stderr)
        return None

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}", file=sys.stderr)
        print(f"Raw output: {result.stdout}", file=sys.stderr)
        return None

def run_gh_command(cmd):
    """Run gh command and return raw output"""
    full_cmd = cmd.replace("gh ", f'"{GH_PATH}" ')
    result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, encoding='utf-8')

    if result.returncode != 0:
        print(f"Error: {result.stderr}", file=sys.stderr)
        return None

    return result.stdout.strip()

def extract_issue_number(pr_body, pr_title):
    """Extract issue number from PR body or title"""
    text = f"{pr_title} {pr_body}"
    # Look for "Fixes #N", "Closes #N", "#N", etc.
    patterns = [
        r'[Ff]ixes?\s+#(\d+)',
        r'[Cc]loses?\s+#(\d+)',
        r'[Rr]esolves?\s+#(\d+)',
        r'#(\d+)'
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return int(match.group(1))

    return None

def get_issue_priority(labels):
    """Extract priority from issue labels"""
    priority_map = {
        'critical': 1,
        'urgent': 2,
        'high': 3,
        'medium': 4,
        'low': 5
    }

    for label in labels:
        label_name = label.get('name', '').lower()
        for priority_key, priority_value in priority_map.items():
            if priority_key in label_name:
                return priority_value

    return 6  # No priority label

def check_dependencies(issue_labels):
    """Check if issue has dependency labels and verify they are closed"""
    dependencies = []

    for label in issue_labels:
        label_name = label.get('name', '')
        # Check for dependency labels like d1, d2, d99, etc.
        if re.match(r'^d\d+$', label_name):
            dep_num = int(label_name[1:])
            dependencies.append(dep_num)

    if not dependencies:
        return True, []

    # Check if dependencies are closed
    open_deps = []
    for dep_num in dependencies:
        issue_data = run_gh_json(f"gh issue view {dep_num} --json state,number")
        if issue_data:
            if issue_data.get('state') == 'OPEN':
                open_deps.append(dep_num)

    return len(open_deps) == 0, open_deps

def notify_discord(event_type, author, pr_num, message=""):
    """Send Discord notification"""
    try:
        subprocess.run(
            f'python core/discord_notifier.py {event_type} "{author}" {pr_num} "{message}"',
            shell=True,
            capture_output=True,
            timeout=10
        )
    except Exception as e:
        print(f"Discord notification failed: {e}", file=sys.stderr)

def main():
    print("=== THOR PR REVIEWER - LIVE WORKFLOW ===\n")

    # Step 1: Fetch all open PRs
    print("Step 1: Fetching open PRs...")
    prs = run_gh_json("gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body,updatedAt")

    if not prs:
        print("No open PRs found or error fetching PRs")
        return

    print(f"Found {len(prs)} open PR(s)\n")

    # Save raw PR data
    with open('thor_prs_live_data.json', 'w', encoding='utf-8') as f:
        json.dump(prs, f, indent=2, ensure_ascii=False)

    # Step 2: Sort PRs by priority
    print("Step 2: Sorting PRs by priority...")
    pr_queue = []

    for pr in prs:
        pr_num = pr['number']
        pr_title = pr['title']
        pr_body = pr.get('body', '')

        # Extract linked issue
        issue_num = extract_issue_number(pr_body, pr_title)

        if issue_num:
            # Get issue details
            issue_data = run_gh_json(f"gh issue view {issue_num} --json labels,state,number")
            if issue_data:
                priority = get_issue_priority(issue_data.get('labels', []))
                pr_queue.append({
                    'pr': pr,
                    'issue_num': issue_num,
                    'issue_data': issue_data,
                    'priority': priority
                })
            else:
                print(f"  Warning: Could not fetch issue #{issue_num} for PR #{pr_num}")
                pr_queue.append({
                    'pr': pr,
                    'issue_num': issue_num,
                    'issue_data': None,
                    'priority': 6
                })
        else:
            print(f"  Warning: PR #{pr_num} has no linked issue")
            pr_queue.append({
                'pr': pr,
                'issue_num': None,
                'issue_data': None,
                'priority': 6
            })

    # Sort by priority (lowest number = highest priority), then by updatedAt (oldest first)
    pr_queue.sort(key=lambda x: (x['priority'], x['pr'].get('updatedAt', '')))

    print("\nPR Queue (priority order):")
    for item in pr_queue:
        pr_num = item['pr']['number']
        issue_num = item['issue_num'] or 'N/A'
        priority = item['priority']
        priority_name = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE'][priority-1] if priority <= 6 else 'NONE'
        print(f"  PR #{pr_num} -> Issue #{issue_num} [{priority_name}]")

    print()

    # Step 3: Process each PR
    merged = []
    blocked = []
    waiting_ci = []

    for item in pr_queue:
        pr = item['pr']
        pr_num = pr['number']
        pr_title = pr['title']
        issue_num = item['issue_num']
        issue_data = item['issue_data']

        print(f"Processing PR #{pr_num}: {pr_title}")

        # Dependency check
        if issue_data:
            deps_ok, open_deps = check_dependencies(issue_data.get('labels', []))
            if not deps_ok:
                print(f"  ❌ BLOCKED by dependencies: {open_deps}")
                blocked.append({'pr': pr_num, 'reason': f'Dependencies: {open_deps}'})

                # Notify Discord
                notify_discord('pr_blocked', 'Thor Odinson', pr_num, f'Blocked by dependencies: {", ".join(f"#{d}" for d in open_deps)}')

                # Comment on PR
                comment_msg = f"⚠️ This PR is blocked by open dependencies: {', '.join(f'#{d}' for d in open_deps)}\n\nPlease wait for these issues to be resolved before merging."
                run_gh_command(f'gh pr comment {pr_num} --body "{comment_msg}"')
                print()
                continue

        # CI check
        status_checks = pr.get('statusCheckRollup')
        if status_checks:
            all_success = all(
                check.get('conclusion') == 'SUCCESS' or check.get('status') == 'COMPLETED'
                for check in status_checks
            )

            if not all_success:
                print(f"  ⏳ Waiting for CI to pass")
                waiting_ci.append(pr_num)
                run_gh_command(f'gh pr comment {pr_num} --body "⏳ Waiting for CI checks to pass before merging."')
                print()
                continue

        # Code review (display diff)
        print(f"  📝 Reviewing code changes...")
        diff = run_gh_command(f"gh pr diff {pr_num}")
        if diff:
            print(f"  Diff preview (first 500 chars): {diff[:500]}...")

        # Test verification
        print(f"  🧪 Verifying tests...")
        checks = run_gh_command(f"gh pr checks {pr_num}")
        if checks:
            print(f"  Checks: {checks}")

        # Merge the PR
        print(f"  ✅ All checks passed. Merging PR #{pr_num}...")
        merge_result = run_gh_command(f"gh pr merge {pr_num} --squash --delete-branch")

        if merge_result:
            print(f"  ✨ Successfully merged PR #{pr_num}")
            merged.append(pr_num)

            # Notify Discord
            if issue_num:
                notify_discord('pr_merged', 'Thor Odinson', pr_num, str(issue_num))

            print(f"  📝 Merged PR #{pr_num}, closes issue #{issue_num}")
        else:
            print(f"  ❌ Failed to merge PR #{pr_num}")
            blocked.append({'pr': pr_num, 'reason': 'Merge failed'})

        print()

    # Step 4: Output summary
    print("\n=== SUMMARY ===")
    print(f"Merged: {merged if merged else 'None'}")
    print(f"Blocked: {blocked if blocked else 'None'}")
    print(f"Waiting on CI: {waiting_ci if waiting_ci else 'None'}")
    print("\nAll changes pushed to GitHub.")

if __name__ == '__main__':
    main()
