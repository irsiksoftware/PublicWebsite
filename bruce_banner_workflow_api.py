#!/usr/bin/env python3
"""
Bruce Banner PR Review and Merge Workflow - API Version
Uses gh api for reliable JSON output
"""

import subprocess
import json
import sys
import re
from datetime import datetime

PRIORITY_ORDER = {'critical': 5, 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1, None: 0}

def run_gh_api(endpoint):
    """Execute gh api command and return parsed JSON."""
    try:
        cmd = f'gh api {endpoint}'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
        if result.returncode != 0:
            print(f"Error: {result.stderr}")
            return None
        return json.loads(result.stdout) if result.stdout.strip() else None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def run_gh_command(cmd):
    """Execute gh command and return output."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
        return result.stdout.strip() if result.returncode == 0 else None
    except Exception as e:
        print(f"Exception: {e}")
        return None

def get_open_prs():
    """Fetch all open PRs via API."""
    print("Fetching open PRs via GitHub API...")
    prs = run_gh_api('repos/:owner/:repo/pulls?state=open')
    if prs:
        print(f"Found {len(prs)} open PRs")
    return prs or []

def extract_issue_number(pr):
    """Extract issue number from PR body or title."""
    title = pr.get('title', '')
    body = pr.get('body', '') or ''

    for text in [title, body]:
        for pattern in [r'(?:fixes|closes|resolves)\s+#(\d+)', r'#(\d+)']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return int(match.group(1))
    return None

def get_issue_details(issue_num):
    """Get issue details via API."""
    issue = run_gh_api(f'repos/:owner/:repo/issues/{issue_num}')
    return issue

def get_priority_from_labels(labels):
    """Extract priority level from labels."""
    for label in (labels or []):
        label_name = label.get('name', '').lower()
        if label_name in PRIORITY_ORDER:
            return label_name
    return None

def get_dependency_labels(labels):
    """Extract dependency labels (d1, d2, etc.)."""
    deps = []
    for label in (labels or []):
        match = re.match(r'd(\d+)', label.get('name', ''), re.IGNORECASE)
        if match:
            deps.append(int(match.group(1)))
    return sorted(deps)

def check_dependencies_closed(dependencies):
    """Check if all dependency issues are closed."""
    open_deps = []
    for dep_num in dependencies:
        issue = get_issue_details(dep_num)
        if not issue or issue.get('state', '').upper() != 'CLOSED':
            open_deps.append(dep_num)
    return open_deps

def check_ci_status(pr_num):
    """Check CI status via combined status API."""
    pr = run_gh_api(f'repos/:owner/:repo/pulls/{pr_num}')
    if not pr:
        return False

    # Check mergeable_state
    mergeable_state = pr.get('mergeable_state', '')
    if mergeable_state in ['clean', 'has_hooks', 'unstable']:
        return True
    elif mergeable_state == 'blocked':
        print("  CI checks failing or pending")
        return False

    # Fallback: check commit status
    sha = pr.get('head', {}).get('sha')
    if sha:
        status = run_gh_api(f'repos/:owner/:repo/commits/{sha}/status')
        if status and status.get('state') == 'success':
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
    except:
        pass

def comment_on_pr(pr_num, message):
    """Add comment to PR."""
    run_gh_command(f'gh pr comment {pr_num} --body "{message}"')

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
    """Sort PRs by priority (high to low) and creation date (old to new)."""
    def get_sort_key(pr):
        issue_num = extract_issue_number(pr)
        priority = None

        if issue_num:
            issue = get_issue_details(issue_num)
            if issue:
                priority = get_priority_from_labels(issue.get('labels', []))

        priority_value = PRIORITY_ORDER.get(priority, 0)
        created_at = pr.get('created_at', '')

        return (-priority_value, created_at)

    return sorted(prs, key=get_sort_key)

def main():
    """Main PR review and merge workflow."""
    print("=" * 60)
    print("BRUCE BANNER PR REVIEW & MERGE WORKFLOW")
    print("=" * 60)
    print()

    prs = get_open_prs()
    if not prs:
        print("No open PRs found.")
        return 0

    print("\nSorting PRs by priority...")
    sorted_prs = sort_prs_by_priority(prs)

    merged = []
    blocked = []
    waiting_ci = []

    print("\n" + "=" * 60)
    print("REVIEWING PRS IN PRIORITY ORDER")
    print("=" * 60)

    for pr in sorted_prs:
        pr_num = pr['number']
        pr_title = pr['title']

        print(f"\n--- PR #{pr_num}: {pr_title} ---")

        issue_num = extract_issue_number(pr)
        if not issue_num:
            print(f"  ⚠ Could not extract issue number")
            blocked.append((pr_num, "No linked issue"))
            continue

        print(f"  Linked to issue #{issue_num}")

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
                notify_discord('pr_blocked', 'Bruce Banner', pr_num, f'Blocked by dependencies: {dep_list}')
                comment_on_pr(pr_num, f'🚫 Blocked by open dependencies: {dep_list}')
                blocked.append((pr_num, f"Dependencies: {dep_list}"))
                continue
            else:
                print(f"  ✓ All dependencies closed")

        # Check CI
        if not check_ci_status(pr_num):
            print(f"  ⏳ Waiting for CI to pass")
            comment_on_pr(pr_num, '⏳ Waiting for CI to pass')
            waiting_ci.append(pr_num)
            continue

        print(f"  ✓ CI checks passed")

        # Merge
        if merge_pr(pr_num, issue_num):
            merged.append(pr_num)
        else:
            blocked.append((pr_num, "Merge failed"))

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
