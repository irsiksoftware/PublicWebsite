#!/usr/bin/env python3
"""
Bruce Banner PR Review and Merge Workflow
Reviews and merges PRs following dependency rules and priority order.
"""

import subprocess
import json
import re
import sys
from datetime import datetime

def run_command(cmd):
    """Run a shell command and return output."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except Exception as e:
        return "", str(e), 1

def get_open_prs():
    """Fetch all open PRs using gh CLI."""
    print("[*] Fetching open PRs...")
    cmd = 'gh pr list --state open --json number,title,headRefName,labels,body,createdAt --limit 100'
    stdout, stderr, code = run_command(cmd)

    if code != 0:
        print(f"[!] Error fetching PRs: {stderr}")
        return []

    try:
        prs = json.loads(stdout)
        print(f"[+] Found {len(prs)} open PR(s)")
        return prs
    except json.JSONDecodeError as e:
        print(f"[!] Error parsing PR JSON: {e}")
        print(f"Output: {stdout}")
        return []

def get_pr_status_checks(pr_number):
    """Get status checks for a PR."""
    cmd = f'gh pr view {pr_number} --json statusCheckRollup'
    stdout, stderr, code = run_command(cmd)

    if code != 0:
        return None

    try:
        data = json.loads(stdout)
        return data.get('statusCheckRollup', [])
    except json.JSONDecodeError:
        return None

def get_issue_info(issue_number):
    """Get issue information including labels and state."""
    cmd = f'gh issue view {issue_number} --json labels,state,number'
    stdout, stderr, code = run_command(cmd)

    if code != 0:
        print(f"   [!] Could not fetch issue #{issue_number}: {stderr}")
        return None

    try:
        return json.loads(stdout)
    except json.JSONDecodeError:
        return None

def extract_issue_number(pr_body, pr_title):
    """Extract issue number from PR body or title."""
    text = f"{pr_title} {pr_body}"

    # Look for "Fixes #N", "Closes #N", etc.
    patterns = [
        r'(?:fixes|closes|resolves|fix|close|resolve)\s+#(\d+)',
        r'#(\d+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return int(match.group(1))

    return None

def get_priority_level(labels):
    """Determine priority level from labels."""
    priority_map = {
        'critical': 5,
        'urgent': 4,
        'high': 3,
        'medium': 2,
        'low': 1
    }

    for label in labels:
        label_name = label.get('name', '').lower()
        for priority, level in priority_map.items():
            if priority in label_name:
                return level, priority.upper()

    return 0, 'NONE'

def get_dependency_labels(labels):
    """Extract dependency labels (d1, d2, etc.) from issue labels."""
    dependencies = []
    for label in labels:
        label_name = label.get('name', '').lower()
        match = re.match(r'd(\d+)', label_name)
        if match:
            dep_num = int(match.group(1))
            dependencies.append(dep_num)
    return dependencies

def check_dependencies(dependency_numbers):
    """Check if all dependency issues are closed."""
    if not dependency_numbers:
        return True, []

    open_deps = []
    for dep_num in dependency_numbers:
        issue_info = get_issue_info(dep_num)
        if issue_info and issue_info.get('state') != 'CLOSED':
            open_deps.append(dep_num)

    return len(open_deps) == 0, open_deps

def check_ci_status(pr_number):
    """Check if all CI checks are passing."""
    checks = get_pr_status_checks(pr_number)

    if checks is None:
        return True, "No checks configured"

    if len(checks) == 0:
        return True, "No checks to run"

    failed_checks = []
    pending_checks = []

    for check in checks:
        conclusion = check.get('conclusion', '').upper()
        status = check.get('status', '').upper()
        name = check.get('name', 'Unknown')

        if status != 'COMPLETED':
            pending_checks.append(name)
        elif conclusion != 'SUCCESS':
            failed_checks.append(f"{name} ({conclusion})")

    if failed_checks:
        return False, f"Failed: {', '.join(failed_checks)}"
    if pending_checks:
        return False, f"Pending: {', '.join(pending_checks)}"

    return True, "All checks passed"

def notify_discord(event_type, agent_name, pr_number, message):
    """Send notification to Discord."""
    cmd = f'python core/discord_notifier.py {event_type} "{agent_name}" {pr_number} "{message}"'
    stdout, stderr, code = run_command(cmd)
    if code != 0:
        print(f"   [!] Discord notification failed: {stderr}")

def comment_on_pr(pr_number, message):
    """Add a comment to a PR."""
    # Escape quotes in message
    safe_message = message.replace('"', '\\"')
    cmd = f'gh pr comment {pr_number} --body "{safe_message}"'
    stdout, stderr, code = run_command(cmd)
    return code == 0

def merge_pr(pr_number):
    """Merge a PR using squash and delete branch."""
    cmd = f'gh pr merge {pr_number} --squash --delete-branch'
    stdout, stderr, code = run_command(cmd)
    return code == 0, stdout, stderr

def main():
    """Main workflow."""
    print("=" * 60)
    print("Bruce Banner PR Review & Merge Workflow")
    print("=" * 60)

    # Fetch open PRs
    prs = get_open_prs()

    if not prs:
        print("\n[+] No open PRs to process")
        return

    # Process each PR with issue info and priority
    pr_info_list = []

    for pr in prs:
        pr_number = pr['number']
        pr_title = pr['title']
        pr_body = pr.get('body', '')
        created_at = pr.get('createdAt', '')

        # Extract issue number
        issue_number = extract_issue_number(pr_body, pr_title)

        priority_level = 0
        priority_name = 'NONE'
        issue_labels = []

        if issue_number:
            # Get issue info for priority and dependencies
            issue_info = get_issue_info(issue_number)
            if issue_info:
                issue_labels = issue_info.get('labels', [])
                priority_level, priority_name = get_priority_level(issue_labels)

        pr_info_list.append({
            'pr': pr,
            'pr_number': pr_number,
            'pr_title': pr_title,
            'pr_body': pr_body,
            'issue_number': issue_number,
            'issue_labels': issue_labels,
            'priority_level': priority_level,
            'priority_name': priority_name,
            'created_at': created_at
        })

    # Sort by priority (highest first), then by creation date (oldest first)
    pr_info_list.sort(key=lambda x: (-x['priority_level'], x['created_at']))

    # Results tracking
    merged_prs = []
    blocked_prs = []
    ci_waiting_prs = []
    skipped_prs = []

    print(f"\n📋 Processing {len(pr_info_list)} PR(s) in priority order...\n")

    # Process each PR
    for idx, pr_info in enumerate(pr_info_list, 1):
        pr_number = pr_info['pr_number']
        pr_title = pr_info['pr_title']
        issue_number = pr_info['issue_number']
        priority_name = pr_info['priority_name']
        issue_labels = pr_info['issue_labels']

        print(f"{idx}. PR #{pr_number}: {pr_title}")
        print(f"   Priority: {priority_name}")

        if not issue_number:
            print(f"   ⚠️  No linked issue found - SKIPPING")
            skipped_prs.append((pr_number, "No linked issue"))
            continue

        print(f"   Linked to Issue #{issue_number}")

        # Check dependencies
        dependency_numbers = get_dependency_labels(issue_labels)
        if dependency_numbers:
            print(f"   🔗 Dependencies: {dependency_numbers}")
            deps_ok, open_deps = check_dependencies(dependency_numbers)

            if not deps_ok:
                print(f"   ❌ BLOCKED by open dependencies: {open_deps}")
                blocked_prs.append((pr_number, open_deps))

                # Notify and comment
                dep_list = ', '.join([f"#{d}" for d in open_deps])
                notify_discord('pr_blocked', 'Bruce Banner', pr_number, f'Blocked by dependencies: {dep_list}')
                comment_on_pr(pr_number, f'⚠️ This PR is blocked by open dependencies: {dep_list}')
                continue
            else:
                print(f"   ✅ All dependencies resolved")

        # Check CI status
        print(f"   🔍 Checking CI status...")
        ci_ok, ci_message = check_ci_status(pr_number)
        print(f"   {ci_message}")

        if not ci_ok:
            if "Pending" in ci_message:
                print(f"   ⏳ Waiting for CI to complete")
                ci_waiting_prs.append(pr_number)
                comment_on_pr(pr_number, f'⏳ Waiting for CI checks to complete: {ci_message}')
            else:
                print(f"   ❌ CI checks failing - SKIPPING")
                skipped_prs.append((pr_number, ci_message))
                comment_on_pr(pr_number, f'❌ CI checks are failing: {ci_message}')
            continue

        # Attempt to merge
        print(f"   🚀 Attempting to merge...")
        success, stdout, stderr = merge_pr(pr_number)

        if success:
            print(f"   ✅ Successfully merged PR #{pr_number}, closes issue #{issue_number}")
            merged_prs.append((pr_number, issue_number))
            notify_discord('pr_merged', 'Bruce Banner', pr_number, str(issue_number))
        else:
            print(f"   ❌ Failed to merge: {stderr}")
            skipped_prs.append((pr_number, f"Merge failed: {stderr}"))

        print()

    # Print summary
    print("=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)

    if merged_prs:
        print(f"\n✅ Merged PRs ({len(merged_prs)}):")
        for pr_num, issue_num in merged_prs:
            print(f"   - PR #{pr_num} (closes issue #{issue_num})")

    if blocked_prs:
        print(f"\n❌ Blocked by Dependencies ({len(blocked_prs)}):")
        for pr_num, deps in blocked_prs:
            dep_list = ', '.join([f"#{d}" for d in deps])
            print(f"   - PR #{pr_num}: waiting for {dep_list}")

    if ci_waiting_prs:
        print(f"\n⏳ Waiting on CI ({len(ci_waiting_prs)}):")
        for pr_num in ci_waiting_prs:
            print(f"   - PR #{pr_num}")

    if skipped_prs:
        print(f"\n⚠️  Skipped ({len(skipped_prs)}):")
        for pr_num, reason in skipped_prs:
            print(f"   - PR #{pr_num}: {reason}")

    print("\n" + "=" * 60)
    print("✅ Bruce Banner workflow complete")
    print("=" * 60)

if __name__ == "__main__":
    main()
