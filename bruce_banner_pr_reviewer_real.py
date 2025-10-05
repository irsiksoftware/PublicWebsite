#!/usr/bin/env python3
"""
Bruce Banner PR Reviewer - Reviews and merges PRs following dependency rules
"""
import subprocess
import json
import re
import sys
from datetime import datetime

# Priority mapping
PRIORITY_ORDER = {
    'critical': 5,
    'urgent': 4,
    'high': 3,
    'medium': 2,
    'low': 1,
    'none': 0
}

def run_command(cmd, capture_output=True):
    """Run shell command and return output"""
    try:
        # Use PowerShell on Windows for gh commands
        if 'gh ' in cmd:
            full_cmd = ['powershell', '-Command', cmd]
        else:
            full_cmd = cmd

        if capture_output:
            result = subprocess.run(full_cmd, capture_output=True, text=True, encoding='utf-8')
            return result.stdout.strip(), result.returncode
        else:
            result = subprocess.run(full_cmd, encoding='utf-8')
            return "", result.returncode
    except Exception as e:
        print(f"Error running command: {e}")
        return "", 1

def fetch_open_prs():
    """Fetch all open PRs using gh CLI"""
    print("Fetching open PRs...")
    cmd = 'gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,createdAt,body --limit 100'
    output, code = run_command(cmd)

    if code != 0:
        print(f"Failed to fetch PRs: {output}")
        return []

    try:
        prs = json.loads(output)
        print(f"Found {len(prs)} open PRs")
        return prs
    except json.JSONDecodeError as e:
        print(f"Failed to parse PR JSON: {e}")
        print(f"Output: {output}")
        return []

def extract_issue_number(pr):
    """Extract issue number from PR title or body"""
    # Check title first
    title_match = re.search(r'#(\d+)', pr.get('title', ''))
    if title_match:
        return int(title_match.group(1))

    # Check body
    body = pr.get('body', '')
    fixes_match = re.search(r'(?:fixes|closes|resolves)\s+#(\d+)', body, re.IGNORECASE)
    if fixes_match:
        return int(fixes_match.group(1))

    # Try any #number in body
    body_match = re.search(r'#(\d+)', body)
    if body_match:
        return int(body_match.group(1))

    return None

def fetch_issue_details(issue_num):
    """Fetch issue details including labels and state"""
    cmd = f'gh issue view {issue_num} --json labels,state,title'
    output, code = run_command(cmd)

    if code != 0:
        print(f"Failed to fetch issue #{issue_num}")
        return None

    try:
        return json.loads(output)
    except json.JSONDecodeError:
        return None

def get_priority_from_issue(issue):
    """Get priority from issue labels"""
    if not issue:
        return 'none', 0

    labels = issue.get('labels', [])
    for label in labels:
        label_name = label.get('name', '').lower()
        if label_name in PRIORITY_ORDER:
            return label_name, PRIORITY_ORDER[label_name]

    return 'none', 0

def get_dependencies_from_issue(issue):
    """Extract dependency numbers from issue labels (d1, d2, etc)"""
    if not issue:
        return []

    dependencies = []
    labels = issue.get('labels', [])

    for label in labels:
        label_name = label.get('name', '')
        match = re.match(r'd(\d+)', label_name, re.IGNORECASE)
        if match:
            dependencies.append(int(match.group(1)))

    return dependencies

def check_dependencies_closed(dependencies):
    """Check if all dependency issues are closed"""
    open_deps = []

    for dep_num in dependencies:
        issue = fetch_issue_details(dep_num)
        if issue and issue.get('state', '').upper() != 'CLOSED':
            open_deps.append(dep_num)

    return open_deps

def check_ci_status(pr):
    """Check if all CI checks passed"""
    status_rollup = pr.get('statusCheckRollup', [])

    if not status_rollup:
        return True, "No CI checks"

    for check in status_rollup:
        status = check.get('state', '').upper()
        conclusion = check.get('conclusion', '').upper()

        if status == 'PENDING' or status == 'IN_PROGRESS':
            return False, f"CI pending: {check.get('name', 'unknown')}"

        if conclusion and conclusion != 'SUCCESS':
            return False, f"CI failed: {check.get('name', 'unknown')} - {conclusion}"

    return True, "All checks passed"

def notify_discord(event_type, agent_name, pr_num, message):
    """Send Discord notification"""
    cmd = f'python core/discord_notifier.py {event_type} "{agent_name}" {pr_num} "{message}"'
    run_command(cmd, capture_output=False)

def comment_on_pr(pr_num, message):
    """Add comment to PR"""
    # Escape quotes in message
    escaped_msg = message.replace('"', '\\"')
    cmd = f'gh pr comment {pr_num} --body "{escaped_msg}"'
    run_command(cmd)

def merge_pr(pr_num, issue_num):
    """Merge PR and notify"""
    print(f"Merging PR #{pr_num}...")
    cmd = f'gh pr merge {pr_num} --squash --delete-branch'
    output, code = run_command(cmd)

    if code == 0:
        print(f"✓ Merged PR #{pr_num}, closes issue #{issue_num}")
        notify_discord('pr_merged', 'Bruce Banner', pr_num, f"Closes issue #{issue_num}")
        return True
    else:
        print(f"✗ Failed to merge PR #{pr_num}: {output}")
        return False

def sort_prs_by_priority(prs):
    """Sort PRs by priority (highest first), then by age (oldest first)"""
    pr_data = []

    for pr in prs:
        issue_num = extract_issue_number(pr)
        issue = fetch_issue_details(issue_num) if issue_num else None
        priority_name, priority_val = get_priority_from_issue(issue)

        created_at = pr.get('createdAt', '')

        pr_data.append({
            'pr': pr,
            'issue_num': issue_num,
            'issue': issue,
            'priority_name': priority_name,
            'priority_val': priority_val,
            'created_at': created_at
        })

    # Sort by priority (desc), then by created_at (asc - oldest first)
    sorted_data = sorted(pr_data, key=lambda x: (-x['priority_val'], x['created_at']))

    return sorted_data

def main():
    """Main workflow"""
    print("=" * 60)
    print("Bruce Banner PR Reviewer - Starting")
    print("=" * 60)

    # Fetch open PRs
    prs = fetch_open_prs()
    if not prs:
        print("No open PRs found")
        return

    # Sort by priority
    print("\nSorting PRs by priority...")
    sorted_prs = sort_prs_by_priority(prs)

    # Summary trackers
    merged = []
    blocked = []
    waiting_ci = []

    # Process each PR
    for pr_data in sorted_prs:
        pr = pr_data['pr']
        pr_num = pr['number']
        issue_num = pr_data['issue_num']
        issue = pr_data['issue']
        priority = pr_data['priority_name'].upper()

        print("\n" + "=" * 60)
        print(f"PR #{pr_num}: {pr['title']}")
        print(f"Priority: {priority}")
        print(f"Issue: #{issue_num}" if issue_num else "No linked issue")
        print("=" * 60)

        # Check if we found the issue
        if not issue_num:
            print(f"⚠ Could not find linked issue for PR #{pr_num}, skipping")
            blocked.append((pr_num, "No linked issue"))
            continue

        if not issue:
            print(f"⚠ Could not fetch issue #{issue_num}, skipping")
            blocked.append((pr_num, f"Cannot fetch issue #{issue_num}"))
            continue

        # Check dependencies
        dependencies = get_dependencies_from_issue(issue)
        if dependencies:
            print(f"Checking dependencies: {dependencies}")
            open_deps = check_dependencies_closed(dependencies)

            if open_deps:
                dep_str = ', '.join([f"#{d}" for d in open_deps])
                print(f"✗ Blocked by open dependencies: {dep_str}")
                blocked.append((pr_num, f"Dependencies: {dep_str}"))

                # Notify and comment
                notify_discord('pr_blocked', 'Bruce Banner', pr_num, f"Blocked by dependencies: {dep_str}")
                comment_on_pr(pr_num, f"⚠️ This PR is blocked by open dependencies: {dep_str}")
                continue

        # Check CI status
        ci_passed, ci_message = check_ci_status(pr)
        if not ci_passed:
            print(f"⚠ CI not ready: {ci_message}")
            waiting_ci.append((pr_num, ci_message))
            comment_on_pr(pr_num, f"⏳ Waiting for CI to pass: {ci_message}")
            continue

        print(f"✓ {ci_message}")

        # All checks passed - merge!
        if merge_pr(pr_num, issue_num):
            merged.append(pr_num)

    # Print summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Merged: {merged if merged else 'None'}")
    print(f"Blocked: {[f'#{pr} ({reason})' for pr, reason in blocked] if blocked else 'None'}")
    print(f"Waiting on CI: {[f'#{pr} ({reason})' for pr, reason in waiting_ci] if waiting_ci else 'None'}")
    print("=" * 60)

if __name__ == '__main__':
    main()
