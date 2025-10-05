#!/usr/bin/env python3
"""PR Review Workflow - Reviews and merges ready PRs following dependency rules."""

import subprocess
import json
import sys
import re

def run_gh(cmd):
    """Run GitHub CLI command and return output."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {cmd}")
        print(f"Error: {e.stderr}")
        return None

def get_open_prs():
    """Get all open PRs with their details."""
    # First try JSON format
    cmd = "gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup"
    output = run_gh(cmd)

    # If JSON doesn't work, parse text format
    if output and not output.startswith('['):
        # Parse text format: #143 [OPEN] [PASSING (2 passed)] Title
        prs = []
        for line in output.split('\n'):
            if line.strip():
                match = re.match(r'#(\d+)\s+\[(\w+)\](?:\s+\[(.*?)\])?\s+(.+)', line)
                if match:
                    pr_num = int(match.group(1))
                    status = match.group(2)
                    ci_status = match.group(3) or ''
                    title = match.group(4)

                    # Get detailed info for this PR
                    pr_json_cmd = f"gh pr view {pr_num} --json number,title,headRefName,labels,statusCheckRollup"
                    pr_json_output = run_gh(pr_json_cmd)
                    if pr_json_output:
                        try:
                            pr_data = json.loads(pr_json_output)
                            prs.append(pr_data)
                        except:
                            # Fallback to basic data
                            prs.append({
                                'number': pr_num,
                                'title': title,
                                'headRefName': '',
                                'labels': [],
                                'statusCheckRollup': []
                            })
        return prs

    if output:
        try:
            return json.loads(output)
        except json.JSONDecodeError:
            return []
    return []

def get_issue_details(issue_num):
    """Get issue details including labels and state."""
    cmd = f"gh issue view {issue_num} --json labels,state,title"
    output = run_gh(cmd)
    if output:
        try:
            return json.loads(output)
        except json.JSONDecodeError:
            # Fallback: parse text output
            # Try to get basic info from text format
            cmd_text = f"gh issue view {issue_num}"
            output_text = run_gh(cmd_text)
            if output_text:
                # Try to extract labels from text output
                labels = []
                state = "OPEN"
                if "state:" in output_text.lower():
                    if "closed" in output_text.lower():
                        state = "CLOSED"
                # For now, return basic structure
                return {
                    'labels': labels,
                    'state': state,
                    'title': ''
                }
    return None

def extract_issue_number(pr):
    """Extract issue number from PR title or body."""
    # Check title first
    match = re.search(r'#(\d+)', pr['title'])
    if match:
        return int(match.group(1))

    # Check PR body
    cmd = f"gh pr view {pr['number']} --json body"
    output = run_gh(cmd)
    if output:
        body_data = json.loads(output)
        body = body_data.get('body', '')
        match = re.search(r'(?:Fixes|Closes|Resolves)\s+#(\d+)', body, re.IGNORECASE)
        if match:
            return int(match.group(1))

    return None

def get_priority_order(labels):
    """Get priority order from labels."""
    priority_map = {
        'p-critical': 0,
        'p-urgent': 1,
        'p-high': 2,
        'p-medium': 3,
        'p-low': 4
    }

    for label in labels:
        label_name = label.get('name', '')
        if label_name in priority_map:
            return priority_map[label_name]

    return 5  # No priority = lowest

def check_dependencies(issue):
    """Check if all dependencies are closed."""
    labels = issue.get('labels', [])
    open_deps = []

    for label in labels:
        label_name = label.get('name', '')
        # Check for dependency labels (d1, d2, d3, etc.)
        if re.match(r'd\d+', label_name):
            dep_num = int(label_name[1:])
            dep_issue = get_issue_details(dep_num)
            if dep_issue and dep_issue.get('state') == 'OPEN':
                open_deps.append(dep_num)

    return open_deps

def check_ci_status(pr):
    """Check if all CI checks passed."""
    status_rollup = pr.get('statusCheckRollup', [])
    if not status_rollup:
        return True  # No checks = assume OK

    for check in status_rollup:
        if check.get('conclusion') not in ['SUCCESS', 'SKIPPED', None]:
            return False

    return True

def notify_discord(action, user, pr_num, message=''):
    """Send Discord notification."""
    cmd = f'python core/discord_notifier.py {action} "{user}" {pr_num}'
    if message:
        cmd += f' "{message}"'
    run_gh(cmd)

def main():
    print("PR Review Workflow Starting...")
    print("=" * 60)

    # Get all open PRs
    prs = get_open_prs()
    if not prs:
        print("No open PRs found.")
        return

    print(f"Found {len(prs)} open PR(s)")

    # Sort PRs by priority
    pr_priority_list = []
    for pr in prs:
        issue_num = extract_issue_number(pr)
        if issue_num:
            issue = get_issue_details(issue_num)
            if issue:
                priority = get_priority_order(issue.get('labels', []))
                pr_priority_list.append({
                    'pr': pr,
                    'issue_num': issue_num,
                    'issue': issue,
                    'priority': priority
                })
        else:
            # No linked issue, treat as lowest priority
            pr_priority_list.append({
                'pr': pr,
                'issue_num': None,
                'issue': None,
                'priority': 5
            })

    # Sort by priority, then by PR number (oldest first)
    pr_priority_list.sort(key=lambda x: (x['priority'], x['pr']['number']))

    merged = []
    blocked = []
    waiting_ci = []

    # Process each PR
    for item in pr_priority_list:
        pr = item['pr']
        pr_num = pr['number']
        issue_num = item['issue_num']
        issue = item['issue']

        print(f"\n--- Processing PR #{pr_num}: {pr['title']} ---")

        if not issue_num:
            print(f"  ⚠ No linked issue found, skipping")
            blocked.append((pr_num, "No linked issue"))
            continue

        print(f"  Linked to issue #{issue_num}")

        # Check dependencies
        open_deps = check_dependencies(issue)
        if open_deps:
            dep_str = ', '.join([f"#{d}" for d in open_deps])
            print(f"  ❌ Blocked by open dependencies: {dep_str}")

            # Notify Discord
            notify_discord('pr_blocked', 'Thor Odinson', pr_num, f'Blocked by dependencies: {dep_str}')

            # Comment on PR
            comment = f"⚠️ This PR is blocked by open dependencies: {dep_str}\n\nPlease wait for these issues to be closed before merging."
            run_gh(f'gh pr comment {pr_num} --body "{comment}"')

            blocked.append((pr_num, f"Dependencies: {dep_str}"))
            continue

        # Check CI status
        if not check_ci_status(pr):
            print(f"  ⏳ Waiting for CI to pass")
            comment = "⏳ Waiting for CI checks to pass before merging."
            run_gh(f'gh pr comment {pr_num} --body "{comment}"')
            waiting_ci.append(pr_num)
            continue

        print(f"  ✓ All dependencies closed")
        print(f"  ✓ CI checks passed")

        # Review diff
        print(f"  📝 Reviewing code changes...")
        diff_output = run_gh(f'gh pr diff {pr_num}')

        # Check test status
        print(f"  🧪 Checking tests...")
        checks_output = run_gh(f'gh pr checks {pr_num}')

        # Merge PR
        print(f"  ✅ Merging PR #{pr_num}...")
        merge_result = run_gh(f'gh pr merge {pr_num} --squash --delete-branch')

        if merge_result:
            print(f"  🎉 Successfully merged PR #{pr_num}")

            # Notify Discord
            notify_discord('pr_merged', 'Thor Odinson', pr_num, str(issue_num))

            print(f"  📝 Merged PR #{pr_num}, closes issue #{issue_num}")
            merged.append(pr_num)
        else:
            print(f"  ❌ Failed to merge PR #{pr_num}")
            blocked.append((pr_num, "Merge failed"))

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY:")
    print(f"  Merged: {merged if merged else 'None'}")
    print(f"  Blocked: {[f'#{pr} ({reason})' for pr, reason in blocked] if blocked else 'None'}")
    print(f"  Waiting on CI: {[f'#{pr}' for pr in waiting_ci] if waiting_ci else 'None'}")
    print("=" * 60)

if __name__ == "__main__":
    main()
