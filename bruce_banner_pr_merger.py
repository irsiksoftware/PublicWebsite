#!/usr/bin/env python3
"""
Bruce Banner PR Reviewer - Merge ready PRs following dependency rules
Priority Order: CRITICAL > URGENT > HIGH > MEDIUM > LOW
"""

import subprocess
import json
import re
import sys
from datetime import datetime

# Priority mapping
PRIORITY_MAP = {
    'critical': 1,
    'urgent': 2,
    'high': 3,
    'medium': 4,
    'low': 5
}

def run_gh_command(args):
    """Run a gh command and return the output"""
    try:
        gh_path = r'C:\Program Files\GitHub CLI\gh.bat'
        result = subprocess.run(
            [gh_path] + args,
            capture_output=True,
            text=True,
            timeout=60,
            shell=True
        )
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            print(f"ERROR running gh {' '.join(args)}: {result.stderr}")
            return None
    except Exception as e:
        print(f"ERROR: {e}")
        return None

def get_open_prs():
    """Fetch all open PRs"""
    print("=== PR REVIEWER STARTING ===")
    print("Fetching open PRs...")

    output = run_gh_command(['pr', 'list', '--state', 'open', '--limit', '50', '--json',
                             'number,title,body,labels,createdAt,headRefName'])
    if not output:
        return []

    try:
        prs = json.loads(output)
        print(f"Found {len(prs)} open PRs")
        return prs
    except json.JSONDecodeError as e:
        print(f"ERROR: Failed to parse PR list: {e}")
        return []

def get_issue_data(issue_num):
    """Get issue data including labels and state"""
    output = run_gh_command(['issue', 'view', str(issue_num), '--json', 'labels,state'])
    if not output:
        return None

    try:
        return json.loads(output)
    except json.JSONDecodeError:
        return None

def extract_issue_number(pr):
    """Extract linked issue number from PR body or title"""
    text = f"{pr.get('title', '')} {pr.get('body', '')}"
    # Look for "Fixes #123" or "#123"
    match = re.search(r'(?:Fixes|Closes|Resolves)?\s*#(\d+)', text, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None

def get_priority(issue_labels):
    """Get priority level from issue labels"""
    for label in issue_labels:
        label_name = label['name'].lower()
        if label_name in PRIORITY_MAP:
            return PRIORITY_MAP[label_name]
    return 6  # Default priority

def check_dependencies(issue_labels):
    """Check if all dependency issues are closed"""
    dep_labels = [l for l in issue_labels if re.match(r'^d\d+$', l['name'])]

    if not dep_labels:
        return True, []

    open_deps = []
    for dep_label in dep_labels:
        dep_issue_num = int(dep_label['name'][1:])  # Remove 'd' prefix
        dep_issue = get_issue_data(dep_issue_num)

        if dep_issue and dep_issue['state'] == 'OPEN':
            open_deps.append(dep_issue_num)

    return len(open_deps) == 0, open_deps

def check_ci_status(pr_number):
    """Check CI status for PR"""
    output = run_gh_command(['pr', 'checks', str(pr_number)])
    if not output:
        return True  # Assume OK if we can't check

    # If output contains "fail" or "pending", CI is not ready
    lower_output = output.lower()
    if 'fail' in lower_output or 'pending' in lower_output:
        return False
    return True

def notify_discord(event_type, agent, pr_num, message):
    """Send Discord notification"""
    try:
        subprocess.run(
            ['python', 'core/discord_notifier.py', event_type, agent, str(pr_num), message],
            timeout=10
        )
    except:
        pass

def comment_on_pr(pr_number, message):
    """Add a comment to PR"""
    run_gh_command(['pr', 'comment', str(pr_number), '--body', f'"{message}"'])

def merge_pr(pr_number):
    """Merge PR with squash and delete branch"""
    result = run_gh_command(['pr', 'merge', str(pr_number), '--squash', '--delete-branch'])
    return result is not None

def main():
    # Fetch open PRs
    prs = get_open_prs()
    if not prs:
        print("No open PRs to review")
        return

    # Enrich PRs with issue data and sort by priority
    enriched_prs = []
    for pr in prs:
        issue_num = extract_issue_number(pr)
        if not issue_num:
            print(f"⚠ PR #{pr['number']} has no linked issue, skipping")
            continue

        issue_data = get_issue_data(issue_num)
        if not issue_data:
            print(f"⚠ Could not fetch issue #{issue_num} for PR #{pr['number']}")
            continue

        pr['linkedIssue'] = issue_num
        pr['issueState'] = issue_data['state']
        pr['issueLabels'] = issue_data['labels']
        pr['priority'] = get_priority(issue_data['labels'])
        enriched_prs.append(pr)

    # Sort by priority (lower number = higher priority), then by creation date
    enriched_prs.sort(key=lambda x: (x['priority'], x['createdAt']))

    # Track results
    merged = []
    blocked = []
    waiting_ci = []

    print("\n=== REVIEWING PRs ===")

    # Review each PR
    for pr in enriched_prs:
        print(f"\n--- PR #{pr['number']}: {pr['title']} ---")
        print(f"  Linked Issue: #{pr['linkedIssue']}")

        # Check dependencies
        deps_ok, open_deps = check_dependencies(pr['issueLabels'])
        if not deps_ok:
            block_msg = f"Blocked by open dependencies: {', '.join(f'#{d}' for d in open_deps)}"
            print(f"  ❌ {block_msg}")
            blocked.append({'pr': pr['number'], 'reason': block_msg})

            notify_discord('pr_blocked', 'Bruce Banner', pr['number'], block_msg)
            comment_on_pr(pr['number'], block_msg)
            continue

        print("  ✓ All dependencies closed" if pr['issueLabels'] else "  ✓ No dependencies")

        # Check CI
        if not check_ci_status(pr['number']):
            print("  ⏳ CI checks not passing, skipping")
            waiting_ci.append(pr['number'])
            comment_on_pr(pr['number'], "Waiting for CI to pass")
            continue

        print("  ✓ All CI checks passed")

        # Merge
        print("  ✅ PR ready to merge!")
        print(f"  Merging PR #{pr['number']}...")

        if merge_pr(pr['number']):
            print(f"  ✓ Merged PR #{pr['number']}")
            merged.append(pr['number'])
            notify_discord('pr_merged', 'Bruce Banner', pr['number'], str(pr['linkedIssue']))
            print(f"  Merged PR #{pr['number']}, closes issue #{pr['linkedIssue']}")
        else:
            block_msg = "Merge failed"
            print(f"  ❌ {block_msg}")
            blocked.append({'pr': pr['number'], 'reason': block_msg})

    # Summary
    print("\n=== SUMMARY ===")
    print(f"Merged: [{', '.join(map(str, merged))}]")
    blocked_str = ', '.join([f"#{b['pr']}: {b['reason']}" for b in blocked])
    print(f"Blocked: [{blocked_str}]")
    print(f"Waiting on CI: [{', '.join(map(str, waiting_ci))}]")
    print("\n=== PR REVIEWER COMPLETE ===")

if __name__ == '__main__':
    main()
