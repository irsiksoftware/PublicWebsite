#!/usr/bin/env python3
"""Implementer workflow executor - finds and claims ONE issue following priority rules."""

import json
import subprocess
import sys
from datetime import datetime

# Priority tiers
PRIORITY_ORDER = {
    'CRITICAL': 0,
    'URGENT': 1,
    'HIGH': 2,
    'MEDIUM': 3,
    'LOW': 4
}

def run_gh_command(args):
    """Run GitHub CLI command."""
    cmd = [r'C:\Program Files\GitHub CLI\gh.bat'] + args
    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    if result.returncode != 0:
        print(f"Error running gh command: {result.stderr}", file=sys.stderr)
        return None
    return result.stdout.strip()

def get_open_issues():
    """Fetch all open issues."""
    output = run_gh_command(['issue', 'list', '--state', 'open', '--json',
                             'number,title,labels,state,createdAt', '--limit', '200'])
    if not output:
        return []
    return json.loads(output)

def has_wip_label(labels):
    """Check if issue has WIP label."""
    return any(label.get('name', '').lower() == 'wip' for label in labels)

def get_priority(labels):
    """Extract priority from labels."""
    for label in labels:
        name = label.get('name', '').upper()
        if name in PRIORITY_ORDER:
            return name
    return 'LOW'  # Default priority

def get_dependencies(labels):
    """Extract dependency issue numbers from labels."""
    deps = []
    for label in labels:
        name = label.get('name', '').lower()
        if name.startswith('d') and name[1:].isdigit():
            deps.append(int(name[1:]))
    return deps

def is_issue_closed(issue_num):
    """Check if an issue is closed."""
    output = run_gh_command(['issue', 'view', str(issue_num), '--json', 'state'])
    if not output:
        return False
    data = json.loads(output)
    return data.get('state', '').upper() == 'CLOSED'

def check_dependencies(deps):
    """Check if all dependencies are closed. Returns (all_closed, blocking_issue)."""
    for dep in deps:
        if not is_issue_closed(dep):
            return False, dep
    return True, None

def sort_issues(issues):
    """Sort issues by priority (CRITICAL > URGENT > HIGH > MEDIUM > LOW), oldest first within tier."""
    # Filter out WIP issues
    non_wip = [issue for issue in issues if not has_wip_label(issue.get('labels', []))]

    # Sort by priority tier first, then by creation date (oldest first)
    def sort_key(issue):
        priority = get_priority(issue.get('labels', []))
        priority_rank = PRIORITY_ORDER.get(priority, 999)
        created_at = issue.get('createdAt', '')
        return (priority_rank, created_at)

    return sorted(non_wip, key=sort_key)

def main():
    print("IMPLEMENTER: Finding available work...")

    # Fetch all open issues
    issues = get_open_issues()
    if not issues:
        print("No open issues found. Exiting.")
        return

    print(f"Found {len(issues)} open issues")

    # Sort by priority
    sorted_issues = sort_issues(issues)
    print(f"After filtering WIP: {len(sorted_issues)} issues available")

    # Find first claimable issue
    for issue in sorted_issues:
        num = issue['number']
        title = issue['title']
        labels = issue.get('labels', [])
        priority = get_priority(labels)

        # Safety check - skip if has WIP label
        if has_wip_label(labels):
            print(f"Skipping #{num} - has WIP label (safety check)")
            continue

        # Check dependencies
        deps = get_dependencies(labels)
        if deps:
            print(f"Checking dependencies for #{num}: {deps}")
            all_closed, blocking = check_dependencies(deps)
            if not all_closed:
                print(f"Skipping #{num} - blocked by #{blocking}")
                continue

        # Found claimable issue!
        print(f"\n✓ Found claimable issue: #{num} [{priority}] {title}")
        print(f"  Issue number: {num}")
        print(f"  Title: {title}")
        print(f"  Priority: {priority}")

        # Write to file for shell script to read
        with open('implementer_target.json', 'w', encoding='utf-8') as f:
            json.dump({
                'number': num,
                'title': title,
                'priority': priority,
                'found': True
            }, f, indent=2)

        return

    # No claimable issue found
    print("\nNo claimable issues found (all blocked or have WIP). Exiting.")
    with open('implementer_target.json', 'w', encoding='utf-8') as f:
        json.dump({'found': False}, f, indent=2)

if __name__ == '__main__':
    main()
