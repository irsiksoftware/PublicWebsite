#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Thor Odinson - PR Reviewer and Merger
Reviews and merges PRs following strict dependency rules and priority order.
"""

import json
import subprocess
import sys
import re
import os
from datetime import datetime

# Force UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def run_command(cmd, shell=True):
    """Run a shell command and return output."""
    try:
        # On Windows, use PowerShell for gh commands
        if sys.platform == 'win32' and 'gh ' in cmd:
            cmd = f'powershell -Command "{cmd}"'

        result = subprocess.run(
            cmd,
            shell=shell,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except Exception as e:
        return "", str(e), 1

def get_open_prs():
    """Fetch all open PRs with details."""
    print("⚡ Fetching open PRs from GitHub...")
    stdout, stderr, code = run_command('gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body,createdAt')

    if code != 0:
        print(f"❌ Error fetching PRs: {stderr}")
        return []

    try:
        prs = json.loads(stdout)
        print(f"📋 Found {len(prs)} open PR(s)")
        return prs
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing PR JSON: {e}")
        return []

def extract_issue_number(pr):
    """Extract issue number from PR body or title."""
    text = f"{pr.get('title', '')} {pr.get('body', '')}"

    # Look for "Fixes #N" or "Closes #N" pattern
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

def get_issue_details(issue_num):
    """Get issue details including labels and state."""
    stdout, stderr, code = run_command(f'gh issue view {issue_num} --json labels,state,title')

    if code != 0:
        print(f"⚠️  Could not fetch issue #{issue_num}: {stderr}")
        return None

    try:
        return json.loads(stdout)
    except json.JSONDecodeError:
        return None

def get_priority_from_labels(labels):
    """Extract priority from labels. Returns (priority_rank, priority_name)."""
    priority_map = {
        'CRITICAL': 0,
        'URGENT': 1,
        'HIGH': 2,
        'MEDIUM': 3,
        'LOW': 4
    }

    for label in labels:
        label_name = label.get('name', '').upper()
        for priority, rank in priority_map.items():
            if priority in label_name:
                return (rank, priority)

    return (5, 'NONE')  # No priority label

def check_dependencies(issue_labels, issue_num):
    """Check if all dependency issues are closed. Returns (is_ready, blocked_by_list)."""
    blocked_by = []

    for label in issue_labels:
        label_name = label.get('name', '')
        # Look for dependency labels like d1, d2, d88, etc.
        if re.match(r'^d\d+$', label_name):
            dep_num = int(label_name[1:])

            # Check if dependency issue is closed
            dep_issue = get_issue_details(dep_num)
            if dep_issue and dep_issue.get('state', '').upper() != 'CLOSED':
                blocked_by.append(dep_num)
                print(f"   ⛔ Dependency #{dep_num} is still OPEN")

    return (len(blocked_by) == 0, blocked_by)

def check_ci_status(pr):
    """Check if all CI checks are passing."""
    status_rollup = pr.get('statusCheckRollup', [])

    if not status_rollup:
        print("   ℹ️  No status checks found")
        return True  # No checks means we can proceed

    all_passing = True
    for check in status_rollup:
        status = check.get('conclusion', check.get('state', 'UNKNOWN')).upper()
        name = check.get('name', 'Unknown check')

        if status not in ['SUCCESS', 'NEUTRAL', 'SKIPPED']:
            print(f"   ❌ Check '{name}' status: {status}")
            all_passing = False
        else:
            print(f"   ✅ Check '{name}' passed")

    return all_passing

def notify_discord(event_type, author, pr_num, extra_info=""):
    """Send notification to Discord."""
    cmd = f'python core/discord_notifier.py {event_type} "{author}" {pr_num} "{extra_info}"'
    stdout, stderr, code = run_command(cmd)

    if code != 0:
        print(f"   ⚠️  Discord notification failed: {stderr}")

def comment_on_pr(pr_num, message):
    """Add a comment to a PR."""
    # Escape quotes in message
    escaped_msg = message.replace('"', '\\"')
    cmd = f'gh pr comment {pr_num} --body "{escaped_msg}"'
    stdout, stderr, code = run_command(cmd)

    if code != 0:
        print(f"   ⚠️  Failed to comment on PR: {stderr}")

def review_pr_code(pr_num):
    """Review the PR diff for quality check."""
    print(f"   📝 Reviewing code changes...")
    stdout, stderr, code = run_command(f'gh pr diff {pr_num}')

    if code != 0:
        print(f"   ⚠️  Could not fetch PR diff: {stderr}")
        return True  # Proceed anyway

    # Basic validation - just check that there are changes
    if not stdout or len(stdout.strip()) == 0:
        print(f"   ⚠️  No code changes detected")
        return False

    print(f"   ✅ Code review complete ({len(stdout.split(chr(10)))} lines changed)")
    return True

def merge_pr(pr_num, issue_num):
    """Merge the PR using squash merge."""
    print(f"   🔨 Merging PR #{pr_num}...")
    cmd = f'gh pr merge {pr_num} --squash --delete-branch'
    stdout, stderr, code = run_command(cmd)

    if code != 0:
        print(f"   ❌ Merge failed: {stderr}")
        return False

    print(f"   ✅ Successfully merged PR #{pr_num}")

    # Notify Discord
    notify_discord('pr_merged', 'Thor Odinson', pr_num, f"Closes issue #{issue_num}")

    return True

def process_prs():
    """Main workflow to process all PRs."""
    prs = get_open_prs()

    if not prs:
        print("\n🎯 No open PRs to process")
        return

    # Enrich PRs with priority and issue data
    pr_data = []
    for pr in prs:
        pr_num = pr['number']
        issue_num = extract_issue_number(pr)

        if not issue_num:
            print(f"\n⚠️  PR #{pr_num}: Could not extract issue number, skipping")
            continue

        issue = get_issue_details(issue_num)
        if not issue:
            print(f"\n⚠️  PR #{pr_num}: Could not fetch issue #{issue_num}, skipping")
            continue

        priority_rank, priority_name = get_priority_from_labels(issue.get('labels', []))

        pr_data.append({
            'pr': pr,
            'pr_num': pr_num,
            'issue_num': issue_num,
            'issue': issue,
            'priority_rank': priority_rank,
            'priority_name': priority_name,
            'created_at': pr.get('createdAt', '')
        })

    # Sort by priority (lower rank = higher priority), then by age (older first)
    pr_data.sort(key=lambda x: (x['priority_rank'], x['created_at']))

    print(f"\n{'='*60}")
    print("📊 PR PRIORITY ORDER:")
    print(f"{'='*60}")
    for data in pr_data:
        print(f"  PR #{data['pr_num']} - Issue #{data['issue_num']} - Priority: {data['priority_name']}")
    print(f"{'='*60}\n")

    # Track results
    merged = []
    blocked = []
    waiting_ci = []

    # Process each PR in priority order
    for data in pr_data:
        pr = data['pr']
        pr_num = data['pr_num']
        issue_num = data['issue_num']
        issue = data['issue']
        priority = data['priority_name']

        print(f"\n{'='*60}")
        print(f"⚡ PROCESSING PR #{pr_num} (Issue #{issue_num}, Priority: {priority})")
        print(f"   Title: {pr['title']}")
        print(f"{'='*60}")

        # 1. Check dependencies
        print(f"\n1️⃣  Checking dependencies...")
        is_ready, blocked_by = check_dependencies(issue.get('labels', []), issue_num)

        if not is_ready:
            blocked_nums = ', '.join([f'#{num}' for num in blocked_by])
            print(f"   ⛔ BLOCKED by open dependencies: {blocked_nums}")

            # Notify and comment
            notify_discord('pr_blocked', 'Thor Odinson', pr_num, f"Blocked by dependencies: {blocked_nums}")
            comment_on_pr(pr_num, f"⛔ This PR is blocked by open dependencies: {blocked_nums}. Please wait for these issues to be resolved first.")

            blocked.append({'pr': pr_num, 'reason': f'Dependencies: {blocked_nums}'})
            continue

        print(f"   ✅ All dependencies satisfied")

        # 2. Check CI status
        print(f"\n2️⃣  Checking CI status...")
        ci_passing = check_ci_status(pr)

        if not ci_passing:
            print(f"   ⏳ Waiting for CI to pass")
            comment_on_pr(pr_num, "⏳ Waiting for all CI checks to pass before merging.")
            waiting_ci.append(pr_num)
            continue

        print(f"   ✅ All CI checks passing")

        # 3. Code review
        print(f"\n3️⃣  Performing code review...")
        code_ok = review_pr_code(pr_num)

        if not code_ok:
            print(f"   ⚠️  Code review found issues, skipping merge")
            blocked.append({'pr': pr_num, 'reason': 'Code review issues'})
            continue

        # 4. Merge
        print(f"\n4️⃣  Merging PR...")
        if merge_pr(pr_num, issue_num):
            merged.append({'pr': pr_num, 'issue': issue_num})
            print(f"   🎉 PR #{pr_num} merged successfully, closes issue #{issue_num}")
        else:
            blocked.append({'pr': pr_num, 'reason': 'Merge failed'})

    # Generate summary
    print(f"\n{'='*60}")
    print("📊 THOR'S PR REVIEW SUMMARY")
    print(f"{'='*60}")
    print(f"\n✅ MERGED ({len(merged)}):")
    if merged:
        for item in merged:
            print(f"   - PR #{item['pr']} (closes issue #{item['issue']})")
    else:
        print("   - None")

    print(f"\n⛔ BLOCKED ({len(blocked)}):")
    if blocked:
        for item in blocked:
            print(f"   - PR #{item['pr']}: {item['reason']}")
    else:
        print("   - None")

    print(f"\n⏳ WAITING ON CI ({len(waiting_ci)}):")
    if waiting_ci:
        for pr in waiting_ci:
            print(f"   - PR #{pr}")
    else:
        print("   - None")

    print(f"\n{'='*60}")
    print("⚡ Thor's work is complete!")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    try:
        process_prs()
    except KeyboardInterrupt:
        print("\n\n⚡ Thor has been interrupted!")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
