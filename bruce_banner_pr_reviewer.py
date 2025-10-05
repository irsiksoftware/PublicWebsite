#!/usr/bin/env python3
"""
Bruce Banner PR Reviewer
Automated PR review and merge system with dependency checking.
"""

import json
import subprocess
import sys
import re
from datetime import datetime
from typing import List, Dict, Optional, Tuple

# Priority levels in order
PRIORITY_ORDER = ['critical', 'urgent', 'high', 'medium', 'low']

def run_gh_command(cmd: List[str]) -> Tuple[str, int]:
    """Run a GitHub CLI command and return output and return code."""
    try:
        # Quote the first element if it contains spaces (the path to gh.bat)
        if ' ' in cmd[0]:
            cmd[0] = f'"{cmd[0]}"'
        cmd_str = ' '.join(cmd)
        result = subprocess.run(
            cmd_str,
            capture_output=True,
            text=True,
            shell=True
        )
        return result.stdout, result.returncode
    except Exception as e:
        print(f"Error running command {' '.join(cmd)}: {e}")
        return "", 1

def fetch_open_prs() -> List[Dict]:
    """Fetch all open PRs from GitHub."""
    print("Fetching open PRs...")
    cmd = ['C:\\Program Files\\GitHub CLI\\gh.bat', 'api', 'repos/irsiksoftware/TestForAI/pulls?state=open']
    output, rc = run_gh_command(cmd)
    if rc != 0:
        print(f"Failed to fetch PRs (rc={rc})")
        print(f"Output: {output}")
        return []

    if not output or not output.strip():
        print("Empty output from GitHub API")
        return []

    try:
        prs = json.loads(output)
        return prs
    except json.JSONDecodeError as e:
        print(f"Failed to parse PR data: {e}")
        print(f"Raw output: {output[:200]}")
        return []

def extract_issue_number(pr: Dict) -> Optional[int]:
    """Extract issue number from PR title or body."""
    title = pr.get('title', '')
    body = pr.get('body', '') or ''

    # Check title first (e.g., "Fixes #87: ..." or "Fix #87" or "#87")
    match = re.search(r'#(\d+)', title)
    if match:
        return int(match.group(1))

    # Check body for "Fixes #N" pattern
    match = re.search(r'(?:Fixes|Closes|Resolves)\s+#(\d+)', body, re.IGNORECASE)
    if match:
        return int(match.group(1))

    return None

def fetch_issue_labels(issue_num: int) -> List[str]:
    """Fetch labels for a given issue."""
    cmd = ['C:\\Program Files\\GitHub CLI\\gh.bat', 'api', f'repos/irsiksoftware/TestForAI/issues/{issue_num}']
    output, rc = run_gh_command(cmd)
    if rc != 0:
        return []

    try:
        issue = json.loads(output)
        labels = [label['name'] for label in issue.get('labels', [])]
        return labels
    except:
        return []

def get_priority(labels: List[str]) -> str:
    """Get priority from labels."""
    for label in labels:
        label_lower = label.lower()
        if 'critical' in label_lower:
            return 'critical'
        if 'urgent' in label_lower:
            return 'urgent'
        if 'high' in label_lower:
            return 'high'
        if 'medium' in label_lower:
            return 'medium'
        if 'low' in label_lower:
            return 'low'
    return 'medium'  # default

def get_dependency_labels(labels: List[str]) -> List[int]:
    """Extract dependency issue numbers from labels (e.g., d1, d2, d87)."""
    deps = []
    for label in labels:
        match = re.match(r'd(\d+)', label.lower())
        if match:
            deps.append(int(match.group(1)))
    return deps

def is_issue_closed(issue_num: int) -> bool:
    """Check if an issue is closed."""
    cmd = ['C:\\Program Files\\GitHub CLI\\gh.bat', 'api', f'repos/irsiksoftware/TestForAI/issues/{issue_num}']
    output, rc = run_gh_command(cmd)
    if rc != 0:
        return False

    try:
        issue = json.loads(output)
        return issue.get('state') == 'closed'
    except:
        return False

def check_dependencies(issue_num: int, labels: List[str]) -> Tuple[bool, List[int]]:
    """Check if all dependencies are closed. Returns (all_closed, open_deps)."""
    deps = get_dependency_labels(labels)
    if not deps:
        return True, []

    open_deps = []
    for dep in deps:
        if not is_issue_closed(dep):
            open_deps.append(dep)

    return len(open_deps) == 0, open_deps

def check_ci_status(pr: Dict) -> Tuple[bool, str]:
    """Check CI status for a PR. Returns (passing, message)."""
    pr_num = pr['number']

    # Check via status API
    cmd = ['"C:\\Program Files\\GitHub CLI\\gh.bat"', 'pr', 'checks', str(pr_num)]
    output, rc = run_gh_command(cmd)

    if rc != 0:
        return False, "Could not fetch CI status"

    # Parse output - gh pr checks shows status
    if 'fail' in output.lower() or 'error' in output.lower():
        return False, "CI checks failing"

    if 'pending' in output.lower() or 'running' in output.lower():
        return False, "CI checks still running"

    return True, "CI checks passing"

def comment_on_pr(pr_num: int, comment: str):
    """Add a comment to a PR."""
    cmd = ['"C:\\Program Files\\GitHub CLI\\gh.bat"', 'pr', 'comment', str(pr_num), '--body', f'"{comment}"']
    run_gh_command(cmd)

def notify_discord(event_type: str, agent: str, pr_num: int, *args):
    """Send notification to Discord."""
    cmd = ['python', 'core/discord_notifier.py', event_type, agent, str(pr_num)] + list(args)
    subprocess.run(cmd, capture_output=True)

def merge_pr(pr_num: int, issue_num: int) -> bool:
    """Merge a PR using squash merge."""
    print(f"  Merging PR #{pr_num}...")
    cmd = ['"C:\\Program Files\\GitHub CLI\\gh.bat"', 'pr', 'merge', str(pr_num), '--squash', '--delete-branch']
    output, rc = run_gh_command(cmd)

    if rc != 0:
        print(f"  Failed to merge: {output}")
        return False

    print(f"  [OK] Merged PR #{pr_num}, closes issue #{issue_num}")
    notify_discord('pr_merged', 'Bruce Banner', pr_num, str(issue_num))
    return True

def main():
    print("=" * 60)
    print("Bruce Banner PR Reviewer")
    print("=" * 60)

    # Fetch all open PRs
    prs = fetch_open_prs()

    if not prs:
        print("No open PRs found.")
        return

    print(f"Found {len(prs)} open PRs")

    # Process PRs and assign priority
    pr_data = []
    for pr in prs:
        if pr.get('draft'):
            print(f"Skipping draft PR #{pr['number']}: {pr['title']}")
            continue

        issue_num = extract_issue_number(pr)
        if not issue_num:
            print(f"Warning: Could not extract issue number for PR #{pr['number']}: {pr['title']}")
            continue

        labels = fetch_issue_labels(issue_num)
        priority = get_priority(labels)

        pr_data.append({
            'pr': pr,
            'issue_num': issue_num,
            'labels': labels,
            'priority': priority,
            'created_at': pr['created_at']
        })

    # Sort by priority, then by creation date (oldest first)
    pr_data.sort(key=lambda x: (PRIORITY_ORDER.index(x['priority']), x['created_at']))

    print(f"\nProcessing {len(pr_data)} PRs in priority order...")
    print()

    merged = []
    blocked = []
    waiting_ci = []

    for item in pr_data:
        pr = item['pr']
        pr_num = pr['number']
        issue_num = item['issue_num']
        labels = item['labels']
        priority = item['priority']

        print(f"PR #{pr_num} (Issue #{issue_num}) [{priority.upper()}]: {pr['title']}")

        # Check dependencies
        deps_ok, open_deps = check_dependencies(issue_num, labels)
        if not deps_ok:
            print(f"  [BLOCKED] Blocked by open dependencies: {', '.join(f'#{d}' for d in open_deps)}")
            blocked.append({
                'pr': pr_num,
                'reason': f"Dependencies: {', '.join(f'#{d}' for d in open_deps)}"
            })
            comment_on_pr(pr_num, f"Blocked by open dependencies: {', '.join(f'#{d}' for d in open_deps)}")
            notify_discord('pr_blocked', 'Bruce Banner', pr_num, f"Blocked by dependencies: {', '.join(f'#{d}' for d in open_deps)}")
            continue

        # Check CI status
        ci_ok, ci_msg = check_ci_status(pr)
        if not ci_ok:
            print(f"  [WAITING] {ci_msg}")
            waiting_ci.append(pr_num)
            if 'fail' in ci_msg.lower():
                comment_on_pr(pr_num, "Waiting for CI to pass")
            continue

        # All checks passed - merge!
        if merge_pr(pr_num, issue_num):
            merged.append(pr_num)

        print()

    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Merged: {merged if merged else 'None'}")
    print(f"Blocked: {[b['pr'] for b in blocked] if blocked else 'None'}")
    if blocked:
        for b in blocked:
            print(f"  PR #{b['pr']}: {b['reason']}")
    print(f"Waiting on CI: {waiting_ci if waiting_ci else 'None'}")
    print()

if __name__ == '__main__':
    main()
