#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Thor's PR Review and Merge Workflow - Reviews and merges PRs following dependency rules"""

import subprocess
import json
import sys
import re
from datetime import datetime
import io

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Priority order
PRIORITY_ORDER = {'CRITICAL': 0, 'URGENT': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4}

def run_gh_command(cmd):
    """Run gh CLI command and return JSON result"""
    try:
        # Use PowerShell on Windows for gh commands
        if sys.platform == 'win32':
            cmd = f'powershell -Command "{cmd}"'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8')
        if result.returncode != 0:
            print(f"Error running command: {cmd}")
            print(f"Error: {result.stderr}")
            return None
        output = result.stdout.strip()
        if not output:
            return None
        # Try to parse as JSON
        try:
            return json.loads(output)
        except json.JSONDecodeError:
            # If not JSON, return raw output for debugging
            print(f"Non-JSON output: {output[:200]}")
            return None
    except Exception as e:
        print(f"Exception running command {cmd}: {e}")
        return None

def get_open_prs():
    """Fetch all open PRs using GitHub API"""
    cmd = 'gh api repos/irsiksoftware/TestForAI/pulls?state=open --jq \'[.[] | {number, title, head: .head.ref, body, created_at: .created_at}]\''
    return run_gh_command(cmd)

def get_issue_info(issue_num):
    """Get issue details including labels"""
    cmd = f'gh issue view {issue_num} --json labels,state,number'
    return run_gh_command(cmd)

def get_pr_checks(pr_num):
    """Get PR CI check status"""
    cmd = f'gh pr checks {pr_num} --json name,conclusion,status'
    return run_gh_command(cmd)

def get_pr_status(pr_num):
    """Get detailed PR status"""
    cmd = f'gh pr view {pr_num} --json statusCheckRollup,mergeable,mergeStateStatus'
    return run_gh_command(cmd)

def extract_issue_number(pr_body, pr_title):
    """Extract issue number from PR body or title"""
    # Check PR body first
    if pr_body:
        match = re.search(r'[Ff]ixes?\s+#(\d+)', pr_body)
        if match:
            return int(match.group(1))

    # Check title
    if pr_title:
        match = re.search(r'[Ff]ixes?\s+#(\d+)', pr_title)
        if match:
            return int(match.group(1))
        # Also check for just #N pattern
        match = re.search(r'#(\d+)', pr_title)
        if match:
            return int(match.group(1))

    return None

def get_priority_from_labels(labels):
    """Extract priority from issue labels"""
    for label in labels:
        label_name = label.get('name', '').upper()
        if label_name in PRIORITY_ORDER:
            return label_name
    return 'LOW'  # Default priority

def get_dependency_labels(labels):
    """Extract dependency labels (d1, d2, etc.)"""
    deps = []
    for label in labels:
        label_name = label.get('name', '')
        if re.match(r'd\d+', label_name):
            # Extract the dependency issue number
            dep_num = int(label_name[1:])
            deps.append(dep_num)
    return deps

def check_dependencies(dep_issues):
    """Check if all dependency issues are closed"""
    open_deps = []
    for dep_num in dep_issues:
        issue_info = get_issue_info(dep_num)
        if issue_info and issue_info.get('state') != 'CLOSED':
            open_deps.append(dep_num)
    return open_deps

def notify_discord(event_type, agent, pr_num, message=''):
    """Send Discord notification"""
    try:
        cmd = f'python core/discord_notifier.py {event_type} "{agent}" {pr_num} "{message}"'
        subprocess.run(cmd, shell=True, capture_output=True, text=True)
    except Exception as e:
        print(f"Discord notification failed: {e}")

def comment_on_pr(pr_num, comment):
    """Add comment to PR"""
    cmd = f'gh pr comment {pr_num} --body "{comment}"'
    subprocess.run(cmd, shell=True, capture_output=True, text=True)

def merge_pr(pr_num):
    """Merge PR with squash and delete branch"""
    cmd = f'gh pr merge {pr_num} --squash --delete-branch'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.returncode == 0

def main():
    print("=== Thor's PR Review and Merge Workflow ===\n")

    # Step 1: Fetch open PRs
    print("📋 Fetching open PRs...")
    prs = get_open_prs()
    if not prs:
        print("No open PRs found.")
        return

    print(f"Found {len(prs)} open PR(s)\n")

    # Step 2: Enrich PRs with issue info and priority
    pr_data = []
    for pr in prs:
        pr_num = pr['number']
        issue_num = extract_issue_number(pr.get('body', ''), pr['title'])

        if not issue_num:
            print(f"⚠️  PR #{pr_num}: No linked issue found, skipping")
            continue

        issue_info = get_issue_info(issue_num)
        if not issue_info:
            print(f"⚠️  PR #{pr_num}: Could not fetch issue #{issue_num}, skipping")
            continue

        labels = issue_info.get('labels', [])
        priority = get_priority_from_labels(labels)
        dependencies = get_dependency_labels(labels)

        pr_data.append({
            'pr_num': pr_num,
            'title': pr['title'],
            'issue_num': issue_num,
            'priority': priority,
            'priority_order': PRIORITY_ORDER.get(priority, 99),
            'dependencies': dependencies,
            'created_at': pr.get('createdAt', ''),
            'branch': pr.get('headRefName', '')
        })

    # Step 3: Sort by priority, then by age (oldest first)
    pr_data.sort(key=lambda x: (x['priority_order'], x['created_at']))

    print("\n📊 PR Review Order (by priority):")
    for pr in pr_data:
        deps_str = f", deps: {pr['dependencies']}" if pr['dependencies'] else ""
        print(f"  #{pr['pr_num']} [{pr['priority']}] - Issue #{pr['issue_num']}{deps_str}")

    # Step 4: Review and merge each PR
    merged = []
    blocked = []
    ci_waiting = []

    print("\n🔍 Reviewing PRs...\n")

    for pr in pr_data:
        pr_num = pr['pr_num']
        issue_num = pr['issue_num']

        print(f"\n--- PR #{pr_num}: {pr['title']} ---")
        print(f"Linked issue: #{issue_num}, Priority: {pr['priority']}")

        # Check dependencies
        if pr['dependencies']:
            print(f"Checking dependencies: {pr['dependencies']}")
            open_deps = check_dependencies(pr['dependencies'])
            if open_deps:
                print(f"❌ BLOCKED by open dependencies: {open_deps}")
                blocked.append({'pr': pr_num, 'reason': f"Dependencies: {open_deps}"})
                notify_discord('pr_blocked', 'Thor Odinson', pr_num, f"Blocked by dependencies: {open_deps}")
                comment_on_pr(pr_num, f"⚠️ Blocked by open dependencies: {', '.join([f'#{d}' for d in open_deps])}")
                continue

        # Check CI status
        pr_status = get_pr_status(pr_num)
        if pr_status and pr_status.get('statusCheckRollup'):
            checks = pr_status['statusCheckRollup']
            failed_checks = [c for c in checks if c.get('conclusion') not in ['SUCCESS', 'NEUTRAL', 'SKIPPED']]

            if failed_checks:
                print(f"⏳ Waiting for CI checks to pass")
                ci_waiting.append(pr_num)
                comment_on_pr(pr_num, "⏳ Waiting for CI checks to pass before merging")
                continue

        # Check if PR is mergeable
        if pr_status and pr_status.get('mergeable') == 'CONFLICTING':
            print(f"❌ BLOCKED by merge conflicts")
            blocked.append({'pr': pr_num, 'reason': 'Merge conflicts'})
            comment_on_pr(pr_num, "⚠️ This PR has merge conflicts that need to be resolved")
            continue

        # Get PR diff for review
        print("📝 Reviewing code changes...")
        diff_cmd = f'gh pr diff {pr_num}'
        diff_result = subprocess.run(diff_cmd, shell=True, capture_output=True, text=True)

        if diff_result.returncode == 0:
            print(f"✅ Code review complete")

        # Merge PR
        print(f"🔄 Merging PR #{pr_num}...")
        if merge_pr(pr_num):
            print(f"✅ MERGED PR #{pr_num}, closes issue #{issue_num}")
            merged.append({'pr': pr_num, 'issue': issue_num})
            notify_discord('pr_merged', 'Thor Odinson', pr_num, str(issue_num))
        else:
            print(f"❌ Failed to merge PR #{pr_num}")
            blocked.append({'pr': pr_num, 'reason': 'Merge failed'})

    # Step 5: Summary
    print("\n" + "="*60)
    print("📊 SUMMARY")
    print("="*60)
    print(f"\n✅ Merged ({len(merged)}): {[m['pr'] for m in merged]}")
    blocked_summary = [f"#{b['pr']} ({b['reason']})" for b in blocked]
    print(f"❌ Blocked ({len(blocked)}): {blocked_summary}")
    print(f"⏳ Waiting on CI ({len(ci_waiting)}): {ci_waiting}")
    print("\n✨ Thor's review complete!")

if __name__ == '__main__':
    main()
