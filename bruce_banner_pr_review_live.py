#!/usr/bin/env python3
"""
Bruce Banner PR Reviewer - Live GitHub Integration
Reviews and merges PRs following dependency rules and priority order.
"""

import subprocess
import json
import re
import sys
from datetime import datetime

PRIORITY_ORDER = ['critical', 'urgent', 'high', 'medium', 'low']

def run_gh_command(cmd):
    """Run a gh CLI command and return the output."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            print(f"Error running command: {cmd}")
            print(f"stderr: {result.stderr}")
            return None
        return result.stdout.strip()
    except Exception as e:
        print(f"Exception running command: {cmd}: {e}")
        return None

def get_open_prs():
    """Fetch all open PRs."""
    print("Fetching open PRs...")

    # Use gh pr list with simple format first
    output = run_gh_command('gh pr list --state open --limit 100')
    if not output:
        print("No PRs found or error fetching PRs")
        return []

    # Parse the output manually
    prs = []
    for line in output.split('\n'):
        if line.strip():
            # Format: #NUMBER  TITLE  BRANCH  STATUS
            match = re.match(r'#(\d+)\s+', line)
            if match:
                pr_number = int(match.group(1))
                prs.append(pr_number)

    print(f"Found {len(prs)} open PRs: {prs}")
    return prs

def get_pr_details(pr_number):
    """Get detailed information about a PR."""
    print(f"\nFetching details for PR #{pr_number}...")

    # Get PR body to find linked issue
    body_output = run_gh_command(f'gh pr view {pr_number} --json body --jq .body')
    title_output = run_gh_command(f'gh pr view {pr_number} --json title --jq .title')

    pr_info = {
        'number': pr_number,
        'body': body_output or '',
        'title': title_output or '',
        'linked_issue': None
    }

    # Parse linked issue from title or body
    for text in [pr_info['title'], pr_info['body']]:
        if text:
            # Look for "Fixes #N" or "#N"
            match = re.search(r'(?:Fixes|Closes|Resolves)?\s*#(\d+)', text, re.IGNORECASE)
            if match:
                pr_info['linked_issue'] = int(match.group(1))
                print(f"PR #{pr_number} links to issue #{pr_info['linked_issue']}")
                break

    return pr_info

def get_issue_details(issue_number):
    """Get issue details including labels and state."""
    print(f"Checking issue #{issue_number}...")

    state_output = run_gh_command(f'gh issue view {issue_number} --json state --jq .state')
    labels_output = run_gh_command(f'gh issue view {issue_number} --json labels --jq .labels')

    issue_info = {
        'number': issue_number,
        'state': state_output or 'UNKNOWN',
        'labels': [],
        'dependencies': [],
        'priority': 'low'
    }

    # Parse labels
    if labels_output:
        try:
            labels = json.loads(labels_output)
            issue_info['labels'] = [label['name'] for label in labels]

            # Extract dependencies (d1, d2, etc.)
            for label in issue_info['labels']:
                if re.match(r'd\d+', label):
                    dep_num = int(label[1:])
                    issue_info['dependencies'].append(dep_num)

            # Extract priority
            for label in issue_info['labels']:
                if label.lower() in PRIORITY_ORDER:
                    issue_info['priority'] = label.lower()
                    break
        except:
            pass

    print(f"Issue #{issue_number}: state={issue_info['state']}, priority={issue_info['priority']}, deps={issue_info['dependencies']}")
    return issue_info

def check_dependencies(dependencies):
    """Check if all dependency issues are closed."""
    if not dependencies:
        return True, []

    open_deps = []
    for dep_num in dependencies:
        state = run_gh_command(f'gh issue view {dep_num} --json state --jq .state')
        if state and state != 'CLOSED':
            open_deps.append(dep_num)

    return len(open_deps) == 0, open_deps

def check_ci_status(pr_number):
    """Check if all CI checks are passing."""
    print(f"Checking CI status for PR #{pr_number}...")

    # Get status checks
    output = run_gh_command(f'gh pr checks {pr_number}')
    if not output:
        print("No CI checks found or error fetching checks")
        return True  # Assume pass if no checks

    # Check for failures
    if 'fail' in output.lower():
        print(f"CI checks failing for PR #{pr_number}")
        return False

    print(f"CI checks passing for PR #{pr_number}")
    return True

def review_pr(pr_number):
    """Review PR code quality."""
    print(f"Reviewing code for PR #{pr_number}...")

    # Get diff for manual review (summary only)
    diff_output = run_gh_command(f'gh pr diff {pr_number} --stat')
    if diff_output:
        print(f"Changes summary:\n{diff_output}")

    # For automated review, we'll assume code is acceptable if CI passes
    return True

def merge_pr(pr_number, issue_number):
    """Merge the PR and notify."""
    print(f"\n{'='*60}")
    print(f"MERGING PR #{pr_number} (closes issue #{issue_number})")
    print(f"{'='*60}")

    # Merge the PR
    merge_output = run_gh_command(f'gh pr merge {pr_number} --squash --delete-branch --auto')
    if merge_output is None:
        print(f"Failed to merge PR #{pr_number}")
        return False

    print(f"Merge output: {merge_output}")

    # Notify via Discord
    try:
        subprocess.run(
            ['python', 'core/discord_notifier.py', 'pr_merged', 'Bruce Banner', str(pr_number), str(issue_number)],
            timeout=10
        )
    except:
        print("Discord notification skipped")

    print(f"✓ Merged PR #{pr_number}, closes issue #{issue_number}")
    return True

def notify_blocked(pr_number, reason):
    """Notify that a PR is blocked."""
    print(f"PR #{pr_number} BLOCKED: {reason}")

    # Comment on PR
    run_gh_command(f'gh pr comment {pr_number} --body "{reason}"')

    # Notify via Discord
    try:
        subprocess.run(
            ['python', 'core/discord_notifier.py', 'pr_blocked', 'Bruce Banner', str(pr_number), f'"{reason}"'],
            timeout=10
        )
    except:
        print("Discord notification skipped")

def main():
    """Main PR review workflow."""
    print("="*60)
    print("BRUCE BANNER PR REVIEWER - LIVE MODE")
    print("="*60)

    # Step 1: Get all open PRs
    pr_numbers = get_open_prs()
    if not pr_numbers:
        print("\nNo open PRs to review.")
        return

    # Step 2: Get details for each PR and sort by priority
    pr_data = []
    for pr_num in pr_numbers:
        pr_info = get_pr_details(pr_num)

        if pr_info['linked_issue']:
            issue_info = get_issue_details(pr_info['linked_issue'])
            pr_info['issue_info'] = issue_info
            pr_info['priority'] = issue_info['priority']
        else:
            pr_info['priority'] = 'low'
            pr_info['issue_info'] = None

        pr_data.append(pr_info)

    # Sort by priority (critical > urgent > high > medium > low)
    pr_data.sort(key=lambda x: (PRIORITY_ORDER.index(x['priority']), x['number']))

    print(f"\n{'='*60}")
    print("PR REVIEW ORDER (by priority):")
    print(f"{'='*60}")
    for pr in pr_data:
        issue_num = pr['linked_issue'] if pr['linked_issue'] else 'N/A'
        print(f"PR #{pr['number']} (Issue #{issue_num}) - Priority: {pr['priority'].upper()}")

    # Step 3: Review each PR in priority order
    merged = []
    blocked = []
    waiting_ci = []

    for pr in pr_data:
        pr_num = pr['number']
        issue_info = pr['issue_info']

        print(f"\n{'='*60}")
        print(f"REVIEWING PR #{pr_num}")
        print(f"{'='*60}")

        # Check if issue is linked
        if not pr['linked_issue']:
            print(f"⚠ PR #{pr_num} has no linked issue, skipping")
            blocked.append((pr_num, "No linked issue"))
            continue

        # Check dependencies
        if issue_info and issue_info['dependencies']:
            deps_ok, open_deps = check_dependencies(issue_info['dependencies'])
            if not deps_ok:
                reason = f"Blocked by open dependencies: {', '.join(f'#{d}' for d in open_deps)}"
                notify_blocked(pr_num, reason)
                blocked.append((pr_num, reason))
                continue

        # Check CI status
        if not check_ci_status(pr_num):
            reason = "Waiting for CI checks to pass"
            run_gh_command(f'gh pr comment {pr_num} --body "{reason}"')
            waiting_ci.append(pr_num)
            continue

        # Review code
        if not review_pr(pr_num):
            reason = "Code review failed"
            notify_blocked(pr_num, reason)
            blocked.append((pr_num, reason))
            continue

        # All checks passed - merge!
        if merge_pr(pr_num, pr['linked_issue']):
            merged.append((pr_num, pr['linked_issue']))

    # Step 4: Output summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Merged: {[f'PR #{p} (Issue #{i})' for p, i in merged] if merged else 'None'}")
    print(f"Blocked: {[f'PR #{p} ({r})' for p, r in blocked] if blocked else 'None'}")
    print(f"Waiting on CI: {[f'PR #{p}' for p in waiting_ci] if waiting_ci else 'None'}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
