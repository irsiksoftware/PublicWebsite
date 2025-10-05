#!/usr/bin/env python3
"""PR Reviewer - Thor Odinson
Reviews and merges PRs following dependency rules and priority order.
"""
import subprocess
import json
import sys
import re

def run_gh_command(args):
    """Run gh CLI command and return parsed JSON output."""
    try:
        # Use gh.bat on Windows
        gh_cmd = r'C:\Program Files\GitHub CLI\gh.bat' if sys.platform == 'win32' else 'gh'
        result = subprocess.run(
            [gh_cmd] + args,
            capture_output=True,
            text=True,
            check=True,
            shell=True if sys.platform == 'win32' else False
        )
        return json.loads(result.stdout) if result.stdout.strip() else None
    except subprocess.CalledProcessError as e:
        print(f"Error running gh command: {e.stderr}")
        return None
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        print(f"Raw output: {result.stdout}")
        return None

def get_open_prs():
    """Fetch all open PRs."""
    return run_gh_command([
        'api',
        'repos/irsiksoftware/TestForAI/pulls?state=open'
    ])

def get_issue_details(issue_num):
    """Fetch issue details."""
    return run_gh_command([
        'api',
        f'repos/irsiksoftware/TestForAI/issues/{issue_num}'
    ])

def extract_issue_number(pr):
    """Extract issue number from PR title or body."""
    # Check title first
    title_match = re.search(r'#(\d+)', pr.get('title', ''))
    if title_match:
        return int(title_match.group(1))

    # Check body
    body = pr.get('body', '')
    fixes_match = re.search(r'(?:Fixes|Closes|Resolves)\s+#(\d+)', body, re.IGNORECASE)
    if fixes_match:
        return int(fixes_match.group(1))

    return None

def get_priority_level(labels):
    """Extract priority level from labels."""
    priority_map = {
        'p0-critical': ('CRITICAL', 0),
        'p1-urgent': ('URGENT', 1),
        'p2-high': ('HIGH', 2),
        'p3-medium': ('MEDIUM', 3),
        'p4-low': ('LOW', 4)
    }

    for label in labels:
        label_name = label.get('name', '').lower()
        if label_name in priority_map:
            return priority_map[label_name]

    return ('MEDIUM', 3)  # Default priority

def check_dependencies(issue):
    """Check if all dependencies are closed."""
    labels = issue.get('labels', [])
    dependency_nums = []

    for label in labels:
        label_name = label.get('name', '')
        if label_name.startswith('d') and label_name[1:].isdigit():
            dependency_nums.append(int(label_name[1:]))

    open_deps = []
    for dep_num in dependency_nums:
        dep_issue = get_issue_details(dep_num)
        if dep_issue and dep_issue.get('state') != 'closed':
            open_deps.append(dep_num)

    return open_deps

def check_ci_status(pr):
    """Check if all CI checks are passing."""
    # For now, check if the PR is mergeable
    # In a production system, we'd query the check-runs API
    mergeable = pr.get('mergeable')
    mergeable_state = pr.get('mergeable_state', '')

    if mergeable is None:
        # GitHub is still calculating mergeable status
        return False, "GitHub is calculating mergeable status"

    if not mergeable:
        return False, f"PR is not mergeable (state: {mergeable_state})"

    if mergeable_state == 'dirty':
        return False, "PR has merge conflicts"

    return True, "All checks passed"

def comment_on_pr(pr_num, message):
    """Add comment to PR."""
    try:
        gh_cmd = r'C:\Program Files\GitHub CLI\gh.bat' if sys.platform == 'win32' else 'gh'
        subprocess.run(
            [gh_cmd, 'pr', 'comment', str(pr_num), '--body', message],
            check=True,
            capture_output=True,
            shell=True if sys.platform == 'win32' else False
        )
        return True
    except subprocess.CalledProcessError:
        return False

def merge_pr(pr_num):
    """Merge PR using squash merge."""
    try:
        gh_cmd = r'C:\Program Files\GitHub CLI\gh.bat' if sys.platform == 'win32' else 'gh'
        subprocess.run(
            [gh_cmd, 'pr', 'merge', str(pr_num), '--squash', '--delete-branch'],
            check=True,
            capture_output=True,
            shell=True if sys.platform == 'win32' else False
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to merge PR #{pr_num}: {e.stderr}")
        return False

def notify_discord(action, username, pr_num, issue_num=None, message=None):
    """Send Discord notification."""
    try:
        args = ['python', 'core/discord_notifier.py', action, username, str(pr_num)]
        if issue_num:
            args.append(str(issue_num))
        if message:
            args.append(message)

        subprocess.run(args, check=False)  # Don't fail if notification fails
    except Exception as e:
        print(f"Discord notification failed: {e}")

def main():
    print("Thor's PR Reviewer - Reviewing open PRs...\n")

    # Fetch open PRs
    prs = get_open_prs()
    if not prs:
        print("No open PRs found or failed to fetch PRs.")
        return

    print(f"Found {len(prs)} open PR(s)\n")

    # Collect PR data with priorities
    pr_data = []
    for pr in prs:
        pr_num = pr['number']
        issue_num = extract_issue_number(pr)

        if not issue_num:
            print(f"WARNING: PR #{pr_num}: Cannot determine linked issue, skipping")
            continue

        issue = get_issue_details(issue_num)
        if not issue:
            print(f"WARNING: PR #{pr_num}: Cannot fetch issue #{issue_num}, skipping")
            continue

        priority_name, priority_val = get_priority_level(issue.get('labels', []))

        pr_data.append({
            'pr': pr,
            'pr_num': pr_num,
            'issue_num': issue_num,
            'issue': issue,
            'priority_name': priority_name,
            'priority_val': priority_val
        })

    # Sort by priority (lower value = higher priority), then by creation date (older first)
    pr_data.sort(key=lambda x: (x['priority_val'], x['pr']['created_at']))

    # Process each PR
    merged = []
    blocked = []
    waiting_ci = []

    for data in pr_data:
        pr = data['pr']
        pr_num = data['pr_num']
        issue_num = data['issue_num']
        issue = data['issue']
        priority = data['priority_name']

        print(f"\n{'='*60}")
        print(f"PR #{pr_num} [{priority}]: {pr['title']}")
        print(f"Linked to issue #{issue_num}")
        print(f"{'='*60}")

        # Check dependencies
        open_deps = check_dependencies(issue)
        if open_deps:
            deps_str = ', '.join([f"#{d}" for d in open_deps])
            msg = f"BLOCKED by open dependencies: {deps_str}"
            print(msg)

            comment_on_pr(pr_num, f"This PR is blocked by open dependencies: {deps_str}\n\nPlease wait for these issues to be resolved first.")
            notify_discord('pr_blocked', 'Thor Odinson', pr_num, message=f"Blocked by dependencies: {deps_str}")

            blocked.append((pr_num, f"Dependencies: {deps_str}"))
            continue

        # Check CI status
        ci_passed, ci_msg = check_ci_status(pr)
        if not ci_passed:
            print(f"WAITING for CI: {ci_msg}")
            comment_on_pr(pr_num, f"Waiting for CI checks to pass.\n\nCurrent status: {ci_msg}")
            waiting_ci.append((pr_num, ci_msg))
            continue

        # All checks passed - merge!
        print(f"All checks passed - merging PR #{pr_num}")

        if merge_pr(pr_num):
            print(f"Successfully merged PR #{pr_num}, closes issue #{issue_num}")
            notify_discord('pr_merged', 'Thor Odinson', pr_num, issue_num)
            merged.append(pr_num)
        else:
            print(f"Failed to merge PR #{pr_num}")
            blocked.append((pr_num, "Merge failed"))

    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Merged: {merged if merged else 'None'}")
    print(f"Blocked: {[f'#{num} ({reason})' for num, reason in blocked] if blocked else 'None'}")
    print(f"Waiting on CI: {[f'#{num} ({reason})' for num, reason in waiting_ci] if waiting_ci else 'None'}")
    print()

if __name__ == '__main__':
    main()
