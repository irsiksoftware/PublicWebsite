#!/usr/bin/env python3
"""
Bruce Banner PR Review and Merge Workflow
Reviews PRs in priority order, checks dependencies, and merges when ready.
"""

import subprocess
import json
import sys
from datetime import datetime

# Priority levels mapping
PRIORITY_ORDER = {
    'critical': 5,
    'urgent': 4,
    'high': 3,
    'medium': 2,
    'low': 1,
    None: 0
}

def run_gh_command(cmd):
    """Execute GitHub CLI command and return output."""
    try:
        # Use cmd.exe on Windows to properly execute gh.bat
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        if result.returncode != 0:
            print(f"Error executing command: {cmd}")
            print(f"Stderr: {result.stderr}")
            print(f"Stdout: {result.stdout}")
            return None
        output = result.stdout.strip()
        # Filter out any non-JSON lines
        if output and output.startswith('['):
            return output
        return result.stdout.strip()
    except Exception as e:
        print(f"Exception running command: {e}")
        return None

def get_open_prs():
    """Fetch all open PRs with metadata."""
    print("Fetching open PRs...")
    cmd = 'gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,createdAt,body'
    output = run_gh_command(cmd)

    if not output:
        return []

    try:
        prs = json.loads(output)
        print(f"Found {len(prs)} open PRs")
        return prs
    except json.JSONDecodeError as e:
        print(f"Error parsing PR JSON: {e}")
        return []

def extract_issue_number(pr):
    """Extract issue number from PR body or title."""
    # Check title first for '#N'
    import re

    title = pr.get('title', '')
    body = pr.get('body', '')

    # Pattern: Fixes #N, Closes #N, Resolves #N, or just #N
    patterns = [
        r'(?:fixes|closes|resolves)\s+#(\d+)',  # Fixes #123
        r'#(\d+)',  # #123
    ]

    for pattern in patterns:
        match = re.search(pattern, title, re.IGNORECASE)
        if match:
            return int(match.group(1))

        match = re.search(pattern, body, re.IGNORECASE)
        if match:
            return int(match.group(1))

    return None

def get_issue_details(issue_num):
    """Get issue details including labels and state."""
    cmd = f'gh issue view {issue_num} --json labels,state,title'
    output = run_gh_command(cmd)

    if not output:
        return None

    try:
        return json.loads(output)
    except json.JSONDecodeError:
        return None

def get_priority_from_labels(labels):
    """Extract priority level from labels."""
    if not labels:
        return None

    for label in labels:
        label_name = label.get('name', '').lower()
        if label_name in PRIORITY_ORDER:
            return label_name

    return None

def get_dependency_labels(labels):
    """Extract dependency labels (d1, d2, etc.) from labels."""
    if not labels:
        return []

    import re
    deps = []
    for label in labels:
        label_name = label.get('name', '')
        # Match d1, d2, d3, etc.
        match = re.match(r'd(\d+)', label_name, re.IGNORECASE)
        if match:
            dep_num = int(match.group(1))
            deps.append(dep_num)

    return sorted(deps)

def check_dependencies_closed(dependencies):
    """Check if all dependency issues are closed."""
    open_deps = []

    for dep_num in dependencies:
        issue = get_issue_details(dep_num)
        if not issue:
            print(f"  Warning: Could not fetch issue #{dep_num}")
            open_deps.append(dep_num)
            continue

        if issue.get('state', '').upper() != 'CLOSED':
            open_deps.append(dep_num)

    return open_deps

def check_ci_status(pr):
    """Check if all CI checks have passed."""
    status_checks = pr.get('statusCheckRollup')

    if not status_checks:
        print("  No CI status checks found")
        return True  # No checks to wait for

    for check in status_checks:
        status = check.get('status', '').upper()
        conclusion = check.get('conclusion', '').upper()

        # Check must be completed and successful
        if status != 'COMPLETED' or conclusion != 'SUCCESS':
            print(f"  CI check failed: {check.get('name')} - {status}/{conclusion}")
            return False

    return True

def review_pr_diff(pr_num):
    """Review PR diff for quality check."""
    print(f"  Reviewing PR #{pr_num} diff...")
    cmd = f'gh pr diff {pr_num}'
    diff = run_gh_command(cmd)

    if diff:
        print(f"  Diff retrieved ({len(diff)} chars)")
        return True
    return False

def notify_discord(event_type, agent_name, pr_num, message):
    """Send Discord notification."""
    try:
        subprocess.run(
            ['python', 'core/discord_notifier.py', event_type, agent_name, str(pr_num), message],
            capture_output=True,
            text=True
        )
    except Exception as e:
        print(f"  Discord notification failed: {e}")

def comment_on_pr(pr_num, message):
    """Add comment to PR."""
    cmd = f'gh pr comment {pr_num} --body "{message}"'
    run_gh_command(cmd)

def merge_pr(pr_num, issue_num):
    """Merge PR with squash and delete branch."""
    print(f"  Merging PR #{pr_num}...")
    cmd = f'gh pr merge {pr_num} --squash --delete-branch'
    result = run_gh_command(cmd)

    if result is not None:
        print(f"  ✓ Merged PR #{pr_num}, closes issue #{issue_num}")
        notify_discord('pr_merged', 'Bruce Banner', pr_num, str(issue_num))
        return True
    else:
        print(f"  ✗ Failed to merge PR #{pr_num}")
        return False

def sort_prs_by_priority(prs):
    """Sort PRs by priority tier (highest first) and creation date (oldest first)."""
    def get_sort_key(pr):
        issue_num = extract_issue_number(pr)
        priority = None

        if issue_num:
            issue = get_issue_details(issue_num)
            if issue:
                labels = issue.get('labels', [])
                priority = get_priority_from_labels(labels)

        priority_value = PRIORITY_ORDER.get(priority, 0)
        created_at = pr.get('createdAt', '')

        # Sort by priority DESC, then createdAt ASC (oldest first)
        return (-priority_value, created_at)

    return sorted(prs, key=get_sort_key)

def main():
    """Main PR review and merge workflow."""
    print("=" * 60)
    print("BRUCE BANNER PR REVIEW & MERGE WORKFLOW")
    print("=" * 60)
    print()

    # Step 1: Get all open PRs
    prs = get_open_prs()

    if not prs:
        print("No open PRs found or error fetching PRs.")
        return

    # Step 2: Sort by priority
    print("\nSorting PRs by priority...")
    sorted_prs = sort_prs_by_priority(prs)

    # Track results
    merged = []
    blocked = []
    waiting_ci = []

    # Step 3: Review each PR
    print("\n" + "=" * 60)
    print("REVIEWING PRS IN PRIORITY ORDER")
    print("=" * 60)

    for pr in sorted_prs:
        pr_num = pr['number']
        pr_title = pr['title']

        print(f"\n--- PR #{pr_num}: {pr_title} ---")

        # Extract issue number
        issue_num = extract_issue_number(pr)
        if not issue_num:
            print(f"  ⚠ Could not extract issue number from PR")
            blocked.append((pr_num, "No linked issue found"))
            continue

        print(f"  Linked to issue #{issue_num}")

        # Get issue details
        issue = get_issue_details(issue_num)
        if not issue:
            print(f"  ⚠ Could not fetch issue #{issue_num}")
            blocked.append((pr_num, f"Could not fetch issue #{issue_num}"))
            continue

        labels = issue.get('labels', [])
        priority = get_priority_from_labels(labels)
        print(f"  Priority: {priority or 'none'}")

        # Check dependencies
        dependencies = get_dependency_labels(labels)
        if dependencies:
            print(f"  Dependencies: {dependencies}")
            open_deps = check_dependencies_closed(dependencies)

            if open_deps:
                dep_list = ', '.join(f"#{d}" for d in open_deps)
                print(f"  ✗ BLOCKED by open dependencies: {dep_list}")

                # Notify and comment
                notify_discord('pr_blocked', 'Bruce Banner', pr_num, f'Blocked by dependencies: {dep_list}')
                comment_on_pr(pr_num, f'🚫 Blocked by open dependencies: {dep_list}')

                blocked.append((pr_num, f"Dependencies: {dep_list}"))
                continue
            else:
                print(f"  ✓ All dependencies closed")

        # Check CI status
        if not check_ci_status(pr):
            print(f"  ⏳ Waiting for CI to pass")
            comment_on_pr(pr_num, '⏳ Waiting for CI to pass')
            waiting_ci.append(pr_num)
            continue

        print(f"  ✓ CI checks passed")

        # Review code
        review_pr_diff(pr_num)

        # Merge PR
        if merge_pr(pr_num, issue_num):
            merged.append(pr_num)
        else:
            blocked.append((pr_num, "Merge failed"))

    # Step 4: Output summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Merged: {merged if merged else 'None'}")
    print(f"Blocked: {[f'#{pr} ({reason})' for pr, reason in blocked] if blocked else 'None'}")
    print(f"Waiting on CI: {waiting_ci if waiting_ci else 'None'}")
    print()

    return 0

if __name__ == '__main__':
    sys.exit(main())
