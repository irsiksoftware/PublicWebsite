#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bruce Banner PR Reviewer - Review and merge ready PRs following dependency rules
"""
import subprocess
import json
import re
import sys
import os
from datetime import datetime

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def run_gh_command(cmd):
    """Run GitHub CLI command and return output"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error running command: {cmd}")
        print(f"Error: {result.stderr}")
        return None
    return result.stdout.strip()

def get_open_prs():
    """Fetch all open PRs"""
    cmd = 'gh api repos/irsiksoftware/TestForAI/pulls?state=open'
    output = run_gh_command(cmd)
    if output:
        return json.loads(output)
    return []

def get_issue_details(issue_num):
    """Get issue details including labels"""
    cmd = f'gh api repos/irsiksoftware/TestForAI/issues/{issue_num}'
    output = run_gh_command(cmd)
    if output:
        return json.loads(output)
    return None

def get_pr_checks(pr_num):
    """Get PR CI checks status"""
    # Get status check rollup
    cmd = f'gh pr view {pr_num} --json statusCheckRollup'
    output = run_gh_command(cmd)
    if output:
        try:
            data = json.loads(output)
            checks = data.get('statusCheckRollup', [])

            # If no checks, assume it's OK
            if not checks:
                return {'state': 'success'}

            # Check if all checks are successful
            all_success = all(
                check.get('conclusion') == 'SUCCESS' or check.get('status') == 'COMPLETED'
                for check in checks
            )

            if all_success:
                return {'state': 'success'}
            else:
                # Find failing checks
                failing = [c for c in checks if c.get('conclusion') != 'SUCCESS']
                return {'state': 'pending' if not failing else 'failure', 'checks': failing}
        except:
            return None
    return None

def extract_issue_number(pr_body, pr_title):
    """Extract issue number from PR body or title"""
    # Look for "Fixes #N" or "Closes #N" or just "#N"
    text = f"{pr_title} {pr_body or ''}"
    matches = re.findall(r'(?:Fixes|Closes|fixes|closes)?\s*#(\d+)', text)
    if matches:
        return int(matches[0])
    return None

def get_priority(labels):
    """Get priority from labels"""
    priority_map = {
        'priority: critical': 5,
        'priority: urgent': 4,
        'priority: high': 3,
        'priority: medium': 2,
        'priority: low': 1
    }
    for label in labels:
        label_name = label.get('name', '').lower()
        if label_name in priority_map:
            return priority_map[label_name]
    return 0

def get_dependencies(labels):
    """Extract dependency labels (d1, d2, etc.)"""
    deps = []
    for label in labels:
        label_name = label.get('name', '')
        if re.match(r'^d\d+$', label_name):
            deps.append(int(label_name[1:]))
    return deps

def check_dependencies(deps):
    """Check if all dependency issues are closed"""
    for dep_num in deps:
        issue = get_issue_details(dep_num)
        if issue and issue.get('state') == 'open':
            return False, dep_num
    return True, None

def notify_discord(event_type, agent_name, pr_num, issue_num=None, message=None):
    """Send Discord notification"""
    cmd = f'python core/discord_notifier.py {event_type} "{agent_name}" {pr_num}'
    if issue_num:
        cmd += f' {issue_num}'
    if message:
        cmd += f' "{message}"'
    run_gh_command(cmd)

def merge_pr(pr_num, issue_num):
    """Merge PR using squash merge"""
    cmd = f'gh pr merge {pr_num} --squash --delete-branch'
    result = run_gh_command(cmd)
    if result is not None:
        print(f"✓ Merged PR #{pr_num}, closes issue #{issue_num}")
        notify_discord('pr_merged', 'Bruce Banner', pr_num, issue_num)
        return True
    return False

def main():
    print("Bruce Banner PR Reviewer - Starting review process...")
    print("=" * 60)

    # Get all open PRs
    prs = get_open_prs()
    if not prs:
        print("No open PRs found.")
        return

    print(f"Found {len(prs)} open PR(s)")

    # Process each PR
    pr_data = []
    for pr in prs:
        pr_num = pr['number']
        pr_title = pr['title']
        pr_body = pr.get('body', '')
        pr_created = pr['created_at']

        # Extract issue number
        issue_num = extract_issue_number(pr_body, pr_title)
        if not issue_num:
            print(f"\nPR #{pr_num}: No linked issue found, skipping...")
            continue

        # Get issue details
        issue = get_issue_details(issue_num)
        if not issue:
            print(f"\nPR #{pr_num}: Could not fetch issue #{issue_num}, skipping...")
            continue

        labels = issue.get('labels', [])
        priority = get_priority(labels)
        deps = get_dependencies(labels)

        pr_data.append({
            'pr_num': pr_num,
            'issue_num': issue_num,
            'title': pr_title,
            'priority': priority,
            'deps': deps,
            'created': pr_created,
            'pr_obj': pr
        })

    # Sort by priority (highest first), then by created date (oldest first)
    pr_data.sort(key=lambda x: (-x['priority'], x['created']))

    # Results tracking
    merged = []
    blocked = []
    ci_waiting = []

    # Process PRs in priority order
    for pr_info in pr_data:
        pr_num = pr_info['pr_num']
        issue_num = pr_info['issue_num']
        deps = pr_info['deps']
        title = pr_info['title']

        print(f"\n{'=' * 60}")
        print(f"Processing PR #{pr_num}: {title}")
        print(f"  Linked to issue #{issue_num}")
        print(f"  Priority: {pr_info['priority']}")

        # Check dependencies
        if deps:
            print(f"  Dependencies: {deps}")
            deps_ok, blocked_by = check_dependencies(deps)
            if not deps_ok:
                msg = f"Blocked by open dependencies: #{blocked_by}"
                print(f"  ✗ {msg}")
                notify_discord('pr_blocked', 'Bruce Banner', pr_num, message=msg)
                run_gh_command(f'gh pr comment {pr_num} --body "{msg}"')
                blocked.append((pr_num, msg))
                continue
            else:
                print(f"  ✓ All dependencies are closed")

        # Check CI status
        print(f"  Checking CI status...")
        checks = get_pr_checks(pr_num)
        if checks and checks.get('state') != 'success':
            msg = f"CI status: {checks.get('state', 'unknown')}"
            print(f"  ✗ {msg}, skipping...")
            ci_waiting.append(pr_num)
            continue
        else:
            print(f"  ✓ CI checks passed")

        # Review and merge
        print(f"  Merging PR #{pr_num}...")
        if merge_pr(pr_num, issue_num):
            merged.append(pr_num)

    # Summary
    print(f"\n{'=' * 60}")
    print("SUMMARY")
    print(f"{'=' * 60}")
    print(f"Merged: {merged if merged else 'None'}")
    print(f"Blocked: {[f'#{pr} ({reason})' for pr, reason in blocked] if blocked else 'None'}")
    print(f"Waiting on CI: {ci_waiting if ci_waiting else 'None'}")
    print(f"{'=' * 60}")

if __name__ == '__main__':
    main()
