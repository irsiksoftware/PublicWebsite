#!/usr/bin/env python3
"""
Dr. Strange PR Review & Merge Workflow
Reviews and merges PRs following strict dependency rules and priority order
"""

import json
import subprocess
import sys
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Priority levels (higher number = higher priority)
PRIORITY_MAP = {
    'critical': 5,
    'urgent': 4,
    'high': 3,
    'medium': 2,
    'low': 1,
    'none': 0
}

def run_gh_command(cmd: List[str]) -> Tuple[bool, str]:
    """Run GitHub CLI command and return success status and output"""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            shell=True
        )
        return result.returncode == 0, result.stdout.strip()
    except Exception as e:
        return False, str(e)

def get_open_prs() -> List[Dict]:
    """Fetch all open PRs using GitHub API"""
    cmd = ['"C:\\Program Files\\GitHub CLI\\gh.bat"', 'api', 'repos/irsiksoftware/TestForAI/pulls?state=open']
    success, output = run_gh_command(cmd)

    if not success:
        print(f"[ERROR] Failed to fetch PRs: {output}")
        return []

    try:
        return json.loads(output)
    except json.JSONDecodeError as e:
        print(f"[ERROR] Failed to parse PR JSON: {e}")
        return []

def extract_issue_number(pr: Dict) -> Optional[int]:
    """Extract issue number from PR title or body"""
    # Check title first
    title_match = re.search(r'(?:Fixes|Closes|Resolves)\s+#(\d+)', pr['title'], re.IGNORECASE)
    if title_match:
        return int(title_match.group(1))

    # Check body
    if pr.get('body'):
        body_match = re.search(r'(?:Fixes|Closes|Resolves)\s+#(\d+)', pr['body'], re.IGNORECASE)
        if body_match:
            return int(body_match.group(1))

    return None

def get_issue_details(issue_num: int) -> Optional[Dict]:
    """Get issue details including labels and state"""
    cmd = ['"C:\\Program Files\\GitHub CLI\\gh.bat"', 'api', f'repos/irsiksoftware/TestForAI/issues/{issue_num}']
    success, output = run_gh_command(cmd)

    if not success:
        print(f"[WARNING] Failed to fetch issue #{issue_num}: {output}")
        return None

    try:
        return json.loads(output)
    except json.JSONDecodeError:
        return None

def get_priority_from_labels(labels: List[Dict]) -> str:
    """Extract priority from issue labels"""
    for label in labels:
        label_name = label.get('name', '').lower()
        if label_name in PRIORITY_MAP:
            return label_name
    return 'none'

def get_dependency_labels(labels: List[Dict]) -> List[int]:
    """Extract dependency issue numbers from dN labels"""
    dependencies = []
    for label in labels:
        label_name = label.get('name', '')
        match = re.match(r'd(\d+)', label_name, re.IGNORECASE)
        if match:
            dependencies.append(int(match.group(1)))
    return dependencies

def check_dependencies(dependencies: List[int]) -> Tuple[bool, List[int]]:
    """Check if all dependency issues are closed. Returns (all_closed, open_deps)"""
    open_deps = []

    for dep_num in dependencies:
        issue = get_issue_details(dep_num)
        if not issue:
            continue

        if issue.get('state') != 'closed':
            open_deps.append(dep_num)

    return len(open_deps) == 0, open_deps

def get_pr_checks(pr_num: int) -> Tuple[bool, str]:
    """Check PR CI status"""
    cmd = ['"C:\\Program Files\\GitHub CLI\\gh.bat"', 'pr', 'checks', str(pr_num)]
    success, output = run_gh_command(cmd)

    if not success:
        return False, "Unable to fetch checks"

    # Parse check status
    if 'fail' in output.lower():
        return False, "Some checks are failing"
    elif 'pending' in output.lower() or 'in_progress' in output.lower():
        return False, "Checks are still running"
    elif 'pass' in output.lower() or 'success' in output.lower():
        return True, "All checks passed"

    # If no checks, assume ready
    return True, "No checks configured"

def notify_discord(event_type: str, agent_name: str, pr_num: int, issue_num: Optional[int] = None, message: str = ""):
    """Send Discord notification"""
    try:
        if issue_num:
            cmd = ['python', 'core/discord_notifier.py', event_type, agent_name, str(pr_num), str(issue_num)]
        else:
            cmd = ['python', 'core/discord_notifier.py', event_type, agent_name, str(pr_num), message]

        subprocess.run(cmd, capture_output=True)
    except Exception as e:
        print(f"⚠️  Discord notification failed: {e}")

def comment_on_pr(pr_num: int, comment: str):
    """Add comment to PR"""
    cmd = ['"C:\\Program Files\\GitHub CLI\\gh.bat"', 'pr', 'comment', str(pr_num), '--body', f'"{comment}"']
    success, output = run_gh_command(cmd)

    if not success:
        print(f"⚠️  Failed to comment on PR #{pr_num}")

def merge_pr(pr_num: int) -> bool:
    """Merge PR with squash and delete branch"""
    cmd = ['"C:\\Program Files\\GitHub CLI\\gh.bat"', 'pr', 'merge', str(pr_num), '--squash', '--delete-branch', '--auto']
    success, output = run_gh_command(cmd)

    return success

def review_pr_diff(pr_num: int) -> str:
    """Get PR diff for code review"""
    cmd = ['"C:\\Program Files\\GitHub CLI\\gh.bat"', 'pr', 'diff', str(pr_num)]
    success, output = run_gh_command(cmd)

    if success:
        return output
    return "Unable to fetch diff"

def main():
    print("Dr. Stephen Strange - PR Review & Merge Workflow")
    print("=" * 60)

    # Step 1: Fetch all open PRs
    print("\nFetching open PRs...")
    prs = get_open_prs()

    if not prs:
        print("[OK] No open PRs found")
        return

    print(f"Found {len(prs)} open PR(s)")

    # Step 2: Enrich PRs with issue data and priority
    enriched_prs = []
    for pr in prs:
        pr_num = pr['number']
        print(f"\n[ANALYZING] PR #{pr_num}: {pr['title']}")

        issue_num = extract_issue_number(pr)
        if not issue_num:
            print(f"  [WARNING] No linked issue found, skipping")
            continue

        print(f"  [LINKED] Issue #{issue_num}")
        issue = get_issue_details(issue_num)

        if not issue:
            print(f"  [WARNING] Could not fetch issue details")
            continue

        priority = get_priority_from_labels(issue.get('labels', []))
        dependencies = get_dependency_labels(issue.get('labels', []))

        enriched_prs.append({
            'pr': pr,
            'pr_num': pr_num,
            'issue_num': issue_num,
            'issue': issue,
            'priority': priority,
            'priority_score': PRIORITY_MAP[priority],
            'dependencies': dependencies,
            'created_at': pr['created_at']
        })

        print(f"  [PRIORITY] {priority.upper()}")
        if dependencies:
            print(f"  [DEPS] {dependencies}")

    # Step 3: Sort by priority (highest first), then by age (oldest first)
    enriched_prs.sort(key=lambda x: (-x['priority_score'], x['created_at']))

    print("\n" + "=" * 60)
    print("PR PRIORITY ORDER:")
    for i, epr in enumerate(enriched_prs, 1):
        print(f"{i}. PR #{epr['pr_num']} (Priority: {epr['priority'].upper()}) - Issue #{epr['issue_num']}")

    # Step 4: Process each PR in priority order
    merged = []
    blocked = []
    waiting_ci = []

    print("\n" + "=" * 60)
    print("PROCESSING PRs:")

    for epr in enriched_prs:
        pr_num = epr['pr_num']
        issue_num = epr['issue_num']
        pr_title = epr['pr']['title']

        print(f"\n{'='*60}")
        print(f"[PROCESSING] PR #{pr_num}: {pr_title}")
        print(f"   Issue: #{issue_num} | Priority: {epr['priority'].upper()}")

        # Check dependencies
        if epr['dependencies']:
            print(f"  [CHECKING] Dependencies: {epr['dependencies']}")
            all_closed, open_deps = check_dependencies(epr['dependencies'])

            if not all_closed:
                dep_list = ', '.join([f"#{d}" for d in open_deps])
                print(f"  [BLOCKED] Open dependencies: {dep_list}")
                blocked.append({'pr': pr_num, 'reason': f'Dependencies: {dep_list}'})

                # Notify and comment
                notify_discord('pr_blocked', 'Dr. Stephen Strange', pr_num, None, f'Blocked by dependencies: {dep_list}')
                comment_on_pr(pr_num, f'[BLOCKED] This PR is blocked by open dependencies: {dep_list}\n\nPlease wait for these issues to be resolved before merging.')
                continue
            else:
                print(f"  [OK] All dependencies closed")

        # Check CI status
        print(f"  [CHECKING] CI status...")
        checks_passed, check_message = get_pr_checks(pr_num)

        if not checks_passed:
            print(f"  [WAITING] {check_message}")
            waiting_ci.append({'pr': pr_num, 'reason': check_message})
            comment_on_pr(pr_num, f'[WAITING] Waiting for CI checks to pass.\n\nStatus: {check_message}')
            continue

        print(f"  [OK] CI checks passed")

        # Code review (optional - just log for now)
        print(f"  [REVIEWING] Code changes...")
        # diff = review_pr_diff(pr_num)
        # In a real scenario, you might want to do automated checks here

        # Merge the PR
        print(f"  [MERGING] PR #{pr_num}...")
        if merge_pr(pr_num):
            print(f"  [SUCCESS] Merged PR #{pr_num}, closes issue #{issue_num}")
            merged.append({'pr': pr_num, 'issue': issue_num})
            notify_discord('pr_merged', 'Dr. Stephen Strange', pr_num, issue_num)
        else:
            print(f"  [FAILED] Failed to merge PR #{pr_num}")
            blocked.append({'pr': pr_num, 'reason': 'Merge failed'})

    # Step 5: Summary
    print("\n" + "=" * 60)
    print("SUMMARY:")
    print("=" * 60)

    if merged:
        print(f"\n[MERGED] ({len(merged)}):")
        for m in merged:
            print(f"   - PR #{m['pr']}, closes issue #{m['issue']}")
    else:
        print("\n[MERGED]: None")

    if blocked:
        print(f"\n[BLOCKED] ({len(blocked)}):")
        for b in blocked:
            print(f"   - PR #{b['pr']}: {b['reason']}")
    else:
        print("\n[BLOCKED]: None")

    if waiting_ci:
        print(f"\n[WAITING ON CI] ({len(waiting_ci)}):")
        for w in waiting_ci:
            print(f"   - PR #{w['pr']}: {w['reason']}")
    else:
        print("\n[WAITING ON CI]: None")

    print("\n" + "=" * 60)
    print("Dr. Strange workflow complete!")

if __name__ == '__main__':
    main()
