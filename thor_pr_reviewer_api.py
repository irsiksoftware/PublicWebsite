#!/usr/bin/env python3
import subprocess
import json
import re
import sys

def run_gh_command(cmd):
    """Run gh command and return output"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error running command: {cmd}")
        print(f"Error: {result.stderr}")
        return None
    return result.stdout.strip()

def get_open_prs():
    """Fetch all open PRs using gh api"""
    print("Fetching open PRs via GitHub API...")
    # Use gh api to get PRs - this should return JSON
    cmd = '"C:\\Program Files\\GitHub CLI\\gh.bat" api repos/irsiksoftware/TestForAI/pulls?state=open&per_page=100'
    output = run_gh_command(cmd)
    if not output:
        return []

    try:
        prs = json.loads(output)
        # Transform to match expected format
        transformed = []
        for pr in prs:
            transformed.append({
                'number': pr['number'],
                'title': pr['title'],
                'headRefName': pr['head']['ref'],
                'body': pr.get('body', ''),
                'labels': pr.get('labels', []),
                'statusCheckRollup': None  # We'll fetch this separately if needed
            })
        return transformed
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {e}")
        print(f"Output: {output}")
        return []

def get_pr_checks(pr_num):
    """Get PR check status"""
    cmd = f'"C:\\Program Files\\GitHub CLI\\gh.bat" api repos/irsiksoftware/TestForAI/pulls/{pr_num}/commits'
    output = run_gh_command(cmd)
    if not output:
        return []

    try:
        commits = json.loads(output)
        if commits:
            # Get the latest commit SHA
            latest_sha = commits[-1]['sha']
            # Get check runs for this commit
            check_cmd = f'"C:\\Program Files\\GitHub CLI\\gh.bat" api repos/irsiksoftware/TestForAI/commits/{latest_sha}/check-runs'
            check_output = run_gh_command(check_cmd)
            if check_output:
                check_data = json.loads(check_output)
                return check_data.get('check_runs', [])
    except json.JSONDecodeError:
        pass

    return []

def get_issue_details(issue_num):
    """Get issue details including labels and state"""
    print(f"  Fetching issue #{issue_num} details...")
    cmd = f'"C:\\Program Files\\GitHub CLI\\gh.bat" api repos/irsiksoftware/TestForAI/issues/{issue_num}'
    output = run_gh_command(cmd)
    if not output:
        return None

    try:
        issue = json.loads(output)
        return {
            'number': issue['number'],
            'state': issue['state'].upper(),
            'labels': issue.get('labels', [])
        }
    except json.JSONDecodeError:
        return None

def extract_issue_number(pr_body, pr_title):
    """Extract issue number from PR body or title"""
    # Look for "Fixes #N", "Closes #N", "#N" patterns
    patterns = [
        r'(?:Fixes|Closes|Fixed|Closed)\s+#(\d+)',
        r'#(\d+)',
    ]

    text = f"{pr_title} {pr_body}"
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return int(match.group(1))
    return None

def check_dependencies(issue):
    """Check if all dependency issues are closed"""
    labels = issue.get('labels', [])
    dependencies = []

    for label in labels:
        label_name = label.get('name', '')
        if label_name.startswith('d') and label_name[1:].isdigit():
            dep_num = int(label_name[1:])
            dependencies.append(dep_num)

    if not dependencies:
        return True, []

    print(f"  Found dependencies: {dependencies}")
    open_deps = []

    for dep_num in dependencies:
        dep_issue = get_issue_details(dep_num)
        if dep_issue and dep_issue.get('state') == 'OPEN':
            open_deps.append(dep_num)

    return len(open_deps) == 0, open_deps

def get_priority_from_labels(labels):
    """Determine priority from labels"""
    priority_map = {
        'critical': 0,
        'urgent': 1,
        'high': 2,
        'medium': 3,
        'low': 4,
    }

    for label in labels:
        label_name = label.get('name', '').lower()
        if label_name in priority_map:
            return priority_map[label_name]

    return 5  # Default priority if no label found

def check_ci_status(pr_num):
    """Check if all CI checks passed"""
    checks = get_pr_checks(pr_num)

    if not checks:
        return True, "No CI checks configured"

    for check in checks:
        status = check.get('status')
        conclusion = check.get('conclusion')

        if status in ['in_progress', 'queued']:
            return False, f"CI check '{check.get('name')}' is still running"

        if conclusion != 'success':
            return False, f"CI check '{check.get('name')}' failed with status: {conclusion}"

    return True, "All CI checks passed"

def notify_discord(event_type, agent_name, pr_num, message):
    """Send Discord notification"""
    try:
        cmd = f'python core/discord_notifier.py {event_type} "{agent_name}" {pr_num} "{message}"'
        subprocess.run(cmd, shell=True, check=True)
    except Exception as e:
        print(f"  Warning: Failed to send Discord notification: {e}")

def comment_on_pr(pr_num, message):
    """Add comment to PR"""
    # Escape quotes in message
    message = message.replace('"', '\\"')
    cmd = f'"C:\\Program Files\\GitHub CLI\\gh.bat" api repos/irsiksoftware/TestForAI/issues/{pr_num}/comments -f body="{message}"'
    run_gh_command(cmd)

def merge_pr(pr_num):
    """Merge PR with squash and delete branch"""
    print(f"  Merging PR #{pr_num}...")

    # Use API to merge with squash
    cmd = f'"C:\\Program Files\\GitHub CLI\\gh.bat" api repos/irsiksoftware/TestForAI/pulls/{pr_num}/merge -f merge_method=squash'
    output = run_gh_command(cmd)

    if output:
        try:
            result = json.loads(output)
            if result.get('merged'):
                print(f"  Successfully merged PR #{pr_num}")
                # Delete the branch - we need to get branch name first
                return True
        except json.JSONDecodeError:
            pass

    return False

def main():
    print("=== Thor PR Reviewer - Starting ===\n")

    # Fetch all open PRs
    prs = get_open_prs()

    if not prs:
        print("No open PRs found or failed to fetch PRs.")
        return

    print(f"Found {len(prs)} open PR(s)\n")

    # Process each PR with priority and issue info
    pr_with_priority = []

    for pr in prs:
        pr_num = pr['number']
        pr_title = pr['title']
        pr_body = pr.get('body', '')

        print(f"Analyzing PR #{pr_num}: {pr_title}")

        # Extract linked issue
        issue_num = extract_issue_number(pr_body, pr_title)
        if not issue_num:
            print(f"  Warning: Could not find linked issue number")
            pr_with_priority.append((pr, 5, issue_num, None))
            continue

        print(f"  Linked to issue #{issue_num}")

        # Get issue details
        issue = get_issue_details(issue_num)
        if not issue:
            print(f"  Warning: Could not fetch issue #{issue_num}")
            pr_with_priority.append((pr, 5, issue_num, None))
            continue

        # Get priority from issue labels
        labels = issue.get('labels', [])
        priority = get_priority_from_labels(labels)
        priority_name = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE'][priority]
        print(f"  Priority: {priority_name}")

        pr_with_priority.append((pr, priority, issue_num, issue))
        print()

    # Sort by priority (lower number = higher priority), then by PR number (older first)
    pr_with_priority.sort(key=lambda x: (x[1], x[0]['number']))

    print("\n=== Processing PRs in Priority Order ===\n")

    merged = []
    blocked = []
    waiting_ci = []

    for pr, priority, issue_num, issue in pr_with_priority:
        pr_num = pr['number']
        pr_title = pr['title']
        priority_name = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE'][priority]

        print(f"Processing PR #{pr_num} [{priority_name}]: {pr_title}")

        if not issue:
            print(f"  SKIPPED: No linked issue found")
            blocked.append((pr_num, "No linked issue"))
            print()
            continue

        # Check dependencies
        deps_ok, open_deps = check_dependencies(issue)
        if not deps_ok:
            dep_list = ', '.join([f"#{d}" for d in open_deps])
            print(f"  BLOCKED: Open dependencies: {dep_list}")

            # Notify and comment
            notify_discord('pr_blocked', 'Thor Odinson', pr_num, f'Blocked by dependencies: {dep_list}')
            comment_on_pr(pr_num, f'⚠️ This PR is blocked by open dependencies: {dep_list}. Please wait for these issues to be resolved first.')

            blocked.append((pr_num, f"Dependencies: {dep_list}"))
            print()
            continue

        # Check CI status
        ci_ok, ci_message = check_ci_status(pr_num)
        if not ci_ok:
            print(f"  WAITING: {ci_message}")
            comment_on_pr(pr_num, f'⏳ Waiting for CI to pass. Status: {ci_message}')
            waiting_ci.append((pr_num, ci_message))
            print()
            continue

        print(f"  ✓ All checks passed - CI: {ci_message}")
        print(f"  ✓ No blocking dependencies")

        # Merge the PR
        if merge_pr(pr_num):
            print(f"  ✅ MERGED PR #{pr_num} (closes issue #{issue_num})")
            notify_discord('pr_merged', 'Thor Odinson', pr_num, str(issue_num))
            merged.append(pr_num)
        else:
            print(f"  ❌ FAILED to merge PR #{pr_num}")
            blocked.append((pr_num, "Merge failed"))

        print()

    # Summary
    print("\n=== SUMMARY ===")
    print(f"Merged: {merged if merged else 'None'}")
    print(f"Blocked: {[f'#{num} ({reason})' for num, reason in blocked] if blocked else 'None'}")
    print(f"Waiting on CI: {[f'#{num} ({reason})' for num, reason in waiting_ci] if waiting_ci else 'None'}")
    print("\n=== Thor PR Reviewer - Complete ===")

if __name__ == "__main__":
    main()
