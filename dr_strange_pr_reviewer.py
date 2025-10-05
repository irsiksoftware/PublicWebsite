#!/usr/bin/env python3
"""Dr. Strange PR Reviewer - Reviews and merges ready PRs following dependency rules"""

import subprocess
import json
import re
import sys

def run_gh_command(cmd):
    """Run gh command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8')
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except Exception as e:
        print(f"Error running command: {e}")
        return "", str(e), 1

def get_open_prs():
    """Fetch all open PRs"""
    cmd = 'gh pr list --state open --json number,title,labels,body,createdAt,headRefName'
    stdout, stderr, code = run_gh_command(cmd)
    if code != 0:
        print(f"Error fetching PRs: {stderr}")
        return []

    try:
        prs = json.loads(stdout)
        return prs
    except json.JSONDecodeError as e:
        print(f"Error parsing PR JSON: {e}")
        print(f"Output: {stdout}")
        return []

def get_issue_details(issue_num):
    """Get issue details including labels and state"""
    cmd = f'gh issue view {issue_num} --json labels,state,number,title'
    stdout, stderr, code = run_gh_command(cmd)
    if code != 0:
        print(f"Error fetching issue #{issue_num}: {stderr}")
        return None

    try:
        return json.loads(stdout)
    except json.JSONDecodeError as e:
        print(f"Error parsing issue JSON: {e}")
        return None

def get_pr_checks(pr_num):
    """Get PR CI check status"""
    cmd = f'gh pr view {pr_num} --json statusCheckRollup'
    stdout, stderr, code = run_gh_command(cmd)
    if code != 0:
        return None

    try:
        data = json.loads(stdout)
        return data.get('statusCheckRollup', [])
    except json.JSONDecodeError:
        return None

def extract_issue_number(pr_body, pr_title):
    """Extract issue number from PR body or title"""
    text = f"{pr_title} {pr_body or ''}"
    # Look for "Fixes #123", "Closes #123", etc.
    matches = re.findall(r'(?:Fixes|Closes|Resolves)\s*#(\d+)', text, re.IGNORECASE)
    if matches:
        return int(matches[0])

    # Look for any #123 pattern
    matches = re.findall(r'#(\d+)', text)
    if matches:
        return int(matches[0])

    return None

def get_priority_value(labels):
    """Get numeric priority value from labels"""
    priority_map = {
        'priority:critical': 1,
        'priority:urgent': 2,
        'priority:high': 3,
        'priority:medium': 4,
        'priority:low': 5
    }

    for label in labels:
        label_name = label.get('name', '').lower()
        if label_name in priority_map:
            return priority_map[label_name]

    return 6  # Default priority if none specified

def get_dependency_numbers(labels):
    """Extract dependency issue numbers from labels (d1, d2, etc.)"""
    deps = []
    for label in labels:
        label_name = label.get('name', '')
        match = re.match(r'd(\d+)', label_name)
        if match:
            deps.append(int(match.group(1)))
    return deps

def check_dependencies_closed(dep_nums):
    """Check if all dependency issues are closed"""
    open_deps = []
    for dep_num in dep_nums:
        issue = get_issue_details(dep_num)
        if issue and issue.get('state') != 'CLOSED':
            open_deps.append(dep_num)
    return open_deps

def check_ci_status(pr_num):
    """Check if all CI checks are passing"""
    checks = get_pr_checks(pr_num)
    if not checks:
        return True, "No checks found"

    for check in checks:
        status = check.get('status')
        conclusion = check.get('conclusion')

        if status != 'COMPLETED':
            return False, f"Check '{check.get('name')}' is {status}"

        if conclusion not in ['SUCCESS', 'NEUTRAL', 'SKIPPED']:
            return False, f"Check '{check.get('name')}' failed: {conclusion}"

    return True, "All checks passed"

def notify_discord(event_type, agent_name, pr_num, message):
    """Send Discord notification"""
    cmd = f'python core/discord_notifier.py {event_type} "{agent_name}" {pr_num} "{message}"'
    run_gh_command(cmd)

def merge_pr(pr_num, issue_num):
    """Merge PR using squash and delete branch"""
    cmd = f'gh pr merge {pr_num} --squash --delete-branch'
    stdout, stderr, code = run_gh_command(cmd)

    if code != 0:
        print(f"[ERROR] Failed to merge PR #{pr_num}: {stderr}")
        return False

    print(f"[SUCCESS] Merged PR #{pr_num}, closes issue #{issue_num}")
    notify_discord('pr_merged', 'Dr. Stephen Strange', pr_num, f'Closes issue #{issue_num}')
    return True

def comment_on_pr(pr_num, comment):
    """Add comment to PR"""
    # Escape quotes in comment
    comment_escaped = comment.replace('"', '\\"')
    cmd = f'gh pr comment {pr_num} --body "{comment_escaped}"'
    run_gh_command(cmd)

def main():
    print("[Dr. Strange PR Reviewer] - Starting review process...")
    print()

    # Fetch all open PRs
    prs = get_open_prs()
    if not prs:
        print("No open PRs found or error fetching PRs")
        return

    print(f"Found {len(prs)} open PR(s)")
    print()

    # Process each PR
    pr_data = []
    for pr in prs:
        pr_num = pr['number']
        pr_title = pr['title']
        pr_body = pr.get('body', '')

        # Extract issue number
        issue_num = extract_issue_number(pr_body, pr_title)
        if not issue_num:
            print(f"[WARN] PR #{pr_num}: Could not find linked issue number")
            continue

        # Get issue details
        issue = get_issue_details(issue_num)
        if not issue:
            print(f"[WARN] PR #{pr_num}: Could not fetch issue #{issue_num}")
            continue

        # Get priority from issue labels
        priority = get_priority_value(issue.get('labels', []))

        pr_data.append({
            'pr_num': pr_num,
            'pr_title': pr_title,
            'pr_body': pr_body,
            'issue_num': issue_num,
            'issue': issue,
            'priority': priority,
            'created_at': pr.get('createdAt', '')
        })

    # Sort by priority, then by created date (oldest first)
    pr_data.sort(key=lambda x: (x['priority'], x['created_at']))

    # Review each PR in priority order
    merged = []
    blocked = []
    waiting_ci = []

    for data in pr_data:
        pr_num = data['pr_num']
        pr_title = data['pr_title']
        issue_num = data['issue_num']
        issue = data['issue']

        print(f"[REVIEW] PR #{pr_num}: {pr_title}")
        print(f"   Linked to issue #{issue_num}")

        # Check dependencies
        dep_nums = get_dependency_numbers(issue.get('labels', []))
        if dep_nums:
            print(f"   Dependencies: {dep_nums}")
            open_deps = check_dependencies_closed(dep_nums)

            if open_deps:
                print(f"   [BLOCKED] by open dependencies: {open_deps}")
                blocked.append(f"#{pr_num} (deps: {open_deps})")

                # Notify and comment
                deps_str = ', '.join([f'#{d}' for d in open_deps])
                notify_discord('pr_blocked', 'Dr. Stephen Strange', pr_num, f'Blocked by dependencies: {deps_str}')
                comment_on_pr(pr_num, f'[BLOCKED] This PR is blocked by open dependencies: {deps_str}')
                print()
                continue
            else:
                print(f"   [OK] All dependencies closed")

        # Check CI status
        ci_pass, ci_msg = check_ci_status(pr_num)
        if not ci_pass:
            print(f"   [WAITING] CI: {ci_msg}")
            waiting_ci.append(f"#{pr_num} ({ci_msg})")
            comment_on_pr(pr_num, f'[WAITING] Waiting for CI to pass: {ci_msg}')
            print()
            continue
        else:
            print(f"   [OK] {ci_msg}")

        # All checks passed - merge PR
        print(f"   [MERGE] Merging PR #{pr_num}...")
        if merge_pr(pr_num, issue_num):
            merged.append(f"#{pr_num}")

        print()

    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"[OK] Merged: {', '.join(merged) if merged else 'None'}")
    print(f"[BLOCKED] Blocked: {', '.join(blocked) if blocked else 'None'}")
    print(f"[WAITING] Waiting on CI: {', '.join(waiting_ci) if waiting_ci else 'None'}")
    print()

if __name__ == '__main__':
    main()
