#!/usr/bin/env python3
"""
Bruce Banner PR Merger - Reviews and merges PRs following dependency rules
"""
import json
import subprocess
import sys
import re
from datetime import datetime

def run_gh_command(args):
    """Run GitHub CLI command and return output"""
    # Use PowerShell to run gh on Windows
    cmd_str = 'gh ' + ' '.join(args)
    cmd = ['powershell', '-Command', cmd_str]
    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    if result.returncode != 0:
        print(f"Error running command: {cmd_str}", file=sys.stderr)
        print(f"Error: {result.stderr}", file=sys.stderr)
        return None
    return result.stdout.strip()

def get_open_prs():
    """Fetch all open PRs with details"""
    output = run_gh_command(['pr', 'list', '--state', 'open', '--json',
                             'number,title,headRefName,labels,statusCheckRollup,body,createdAt'])
    if output:
        return json.loads(output)
    return []

def extract_issue_number(pr):
    """Extract issue number from PR title or body"""
    # Try title first
    match = re.search(r'#(\d+)', pr['title'])
    if match:
        return int(match.group(1))

    # Try body
    if pr.get('body'):
        # Look for "Fixes #N" or "Closes #N"
        match = re.search(r'(?:Fixes|Closes|Resolves)\s+#(\d+)', pr['body'], re.IGNORECASE)
        if match:
            return int(match.group(1))

    return None

def get_issue_details(issue_number):
    """Get issue details including labels and state"""
    output = run_gh_command(['issue', 'view', str(issue_number), '--json', 'labels,state,title'])
    if output:
        return json.loads(output)
    return None

def get_priority_level(labels):
    """Determine priority level from labels"""
    label_names = [label['name'].lower() for label in labels]

    if 'critical' in label_names:
        return 0, 'CRITICAL'
    elif 'urgent' in label_names:
        return 1, 'URGENT'
    elif 'high' in label_names or 'high priority' in label_names:
        return 2, 'HIGH'
    elif 'medium' in label_names or 'medium priority' in label_names:
        return 3, 'MEDIUM'
    elif 'low' in label_names or 'low priority' in label_names:
        return 4, 'LOW'
    else:
        return 5, 'NONE'

def check_dependencies(issue):
    """Check if all dependency issues are closed"""
    if not issue or not issue.get('labels'):
        return True, []

    blocked_by = []
    label_names = [label['name'] for label in issue['labels']]

    # Find dependency labels (d1, d2, d3, etc.)
    dep_pattern = re.compile(r'd(\d+)')
    for label_name in label_names:
        match = dep_pattern.match(label_name)
        if match:
            dep_issue_num = int(match.group(1))
            dep_issue = get_issue_details(dep_issue_num)
            if dep_issue and dep_issue['state'] != 'CLOSED':
                blocked_by.append(dep_issue_num)

    return len(blocked_by) == 0, blocked_by

def check_ci_status(pr):
    """Check if all CI checks have passed"""
    if not pr.get('statusCheckRollup'):
        return True, "No CI checks"

    checks = pr['statusCheckRollup']
    failed = []
    pending = []

    for check in checks:
        status = check.get('status', '').upper()
        conclusion = check.get('conclusion', '').upper()

        if status == 'COMPLETED':
            if conclusion != 'SUCCESS':
                failed.append(check.get('name', 'unknown'))
        elif status in ['PENDING', 'IN_PROGRESS']:
            pending.append(check.get('name', 'unknown'))

    if failed:
        return False, f"Failed checks: {', '.join(failed)}"
    elif pending:
        return False, f"Pending checks: {', '.join(pending)}"

    return True, "All checks passed"

def notify_discord(event_type, agent_name, pr_number, message):
    """Send Discord notification"""
    try:
        subprocess.run(['python', 'core/discord_notifier.py', event_type, agent_name,
                       str(pr_number), message], capture_output=True)
    except Exception as e:
        print(f"Failed to send Discord notification: {e}", file=sys.stderr)

def comment_on_pr(pr_number, message):
    """Add comment to PR"""
    run_gh_command(['pr', 'comment', str(pr_number), '--body', message])

def merge_pr(pr_number):
    """Merge PR with squash and delete branch"""
    output = run_gh_command(['pr', 'merge', str(pr_number), '--squash', '--delete-branch'])
    return output is not None

def main():
    print("Bruce Banner PR Merger - Starting workflow...")
    print("=" * 70)

    # Step 1: Fetch open PRs
    print("\nStep 1: Fetching open PRs...")
    prs = get_open_prs()

    if not prs:
        print("No open PRs found.")
        return

    print(f"Found {len(prs)} open PR(s)")

    # Step 2: Sort PRs by priority and age
    print("\nStep 2: Analyzing PRs and sorting by priority...")

    pr_data = []
    for pr in prs:
        issue_num = extract_issue_number(pr)
        issue = get_issue_details(issue_num) if issue_num else None

        priority_level, priority_name = get_priority_level(issue['labels']) if issue else (5, 'NONE')

        pr_data.append({
            'pr': pr,
            'issue_num': issue_num,
            'issue': issue,
            'priority_level': priority_level,
            'priority_name': priority_name,
            'created_at': pr.get('createdAt', '')
        })

    # Sort by priority (ascending), then by creation date (oldest first)
    pr_data.sort(key=lambda x: (x['priority_level'], x['created_at']))

    # Step 3: Review each PR
    print("\nStep 3: Reviewing PRs in priority order...")
    print("=" * 70)

    merged = []
    blocked = []
    waiting_ci = []

    for data in pr_data:
        pr = data['pr']
        pr_num = pr['number']
        issue_num = data['issue_num']
        issue = data['issue']
        priority = data['priority_name']

        print(f"\nPR #{pr_num}: {pr['title']}")
        print(f"   Priority: {priority}")
        print(f"   Linked Issue: #{issue_num}" if issue_num else "   No linked issue found")

        # Check dependencies
        if issue:
            deps_clear, blocked_by = check_dependencies(issue)
            if not deps_clear:
                reason = f"Blocked by open dependencies: {', '.join([f'#{n}' for n in blocked_by])}"
                print(f"   [BLOCKED] {reason}")
                blocked.append({'pr': pr_num, 'reason': reason})

                # Notify and comment
                notify_discord('pr_blocked', 'Bruce Banner', pr_num, reason)
                comment_on_pr(pr_num, f"[BLOCKED] {reason}\n\nThis PR cannot be merged until all dependency issues are closed.")
                continue

        # Check CI status
        ci_passed, ci_message = check_ci_status(pr)
        if not ci_passed:
            print(f"   [WAITING] {ci_message}")
            waiting_ci.append({'pr': pr_num, 'reason': ci_message})
            comment_on_pr(pr_num, f"[WAITING] Waiting for CI to pass.\n\n{ci_message}")
            continue

        print(f"   [PASS] {ci_message}")

        # All checks passed - merge PR
        print(f"   [MERGING] PR #{pr_num}...")

        if merge_pr(pr_num):
            print(f"   [SUCCESS] Merged PR #{pr_num}, closes issue #{issue_num}")
            merged.append({'pr': pr_num, 'issue': issue_num})

            # Notify Discord
            notify_discord('pr_merged', 'Bruce Banner', pr_num, str(issue_num))
        else:
            print(f"   [FAILED] Failed to merge PR #{pr_num}")
            blocked.append({'pr': pr_num, 'reason': 'Merge failed'})

    # Step 4: Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)

    print(f"\n[MERGED] ({len(merged)}):")
    if merged:
        for item in merged:
            print(f"   - PR #{item['pr']} (closes issue #{item['issue']})")
    else:
        print("   None")

    print(f"\n[BLOCKED] ({len(blocked)}):")
    if blocked:
        for item in blocked:
            print(f"   - PR #{item['pr']}: {item['reason']}")
    else:
        print("   None")

    print(f"\n[WAITING ON CI] ({len(waiting_ci)}):")
    if waiting_ci:
        for item in waiting_ci:
            print(f"   - PR #{item['pr']}: {item['reason']}")
    else:
        print("   None")

    print("\nBruce Banner PR Merger - Complete")

if __name__ == '__main__':
    main()
