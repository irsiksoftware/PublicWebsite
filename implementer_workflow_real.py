#!/usr/bin/env python3
"""
IMPLEMENTER: Find and work on ONE issue following priority and dependency rules.
"""
import json
import subprocess
import sys
import os
from datetime import datetime

GH_PATH = r"C:\Program Files\GitHub CLI\gh.bat"

def run_gh_command(args):
    """Run gh CLI command and return output."""
    cmd = [GH_PATH] + args
    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', shell=False)
    if result.returncode != 0:
        print(f"Error running gh command: {result.stderr}", file=sys.stderr)
        print(f"Command was: {' '.join(cmd)}", file=sys.stderr)
        return None
    return result.stdout.strip()

def get_all_open_issues():
    """Fetch all open issues in JSON format."""
    output = run_gh_command(['issue', 'list', '--state', 'open', '--json',
                             'number,title,labels,createdAt', '--limit', '100'])
    if not output:
        return []
    try:
        return json.loads(output)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}", file=sys.stderr)
        return []

def has_label(issue, label_name):
    """Check if issue has a specific label."""
    return any(l['name'] == label_name for l in issue.get('labels', []))

def get_priority(issue):
    """Get priority value for sorting (lower = higher priority)."""
    labels = [l['name'].upper() for l in issue.get('labels', [])]
    if 'CRITICAL' in labels:
        return 1
    elif 'URGENT' in labels:
        return 2
    elif 'HIGH' in labels:
        return 3
    elif 'MEDIUM' in labels:
        return 4
    elif 'LOW' in labels:
        return 5
    return 6  # No priority label

def get_dependency_numbers(issue):
    """Extract dependency issue numbers from labels (d1, d2, d3, etc)."""
    deps = []
    for label in issue.get('labels', []):
        name = label['name']
        if name.startswith('d') and len(name) > 1 and name[1:].isdigit():
            deps.append(int(name[1:]))
    return deps

def is_issue_closed(issue_num):
    """Check if an issue is closed."""
    output = run_gh_command(['issue', 'view', str(issue_num), '--json', 'state'])
    if not output:
        return False
    try:
        data = json.loads(output)
        return data.get('state') == 'CLOSED'
    except json.JSONDecodeError:
        return False

def check_dependencies_closed(issue):
    """Check if all dependencies are closed."""
    deps = get_dependency_numbers(issue)
    if not deps:
        return True, []

    open_deps = []
    for dep in deps:
        if not is_issue_closed(dep):
            open_deps.append(dep)

    return len(open_deps) == 0, open_deps

def find_available_issue():
    """Find the first available issue following priority and dependency rules."""
    print("Fetching open issues...")
    issues = get_all_open_issues()

    if not issues:
        print("No open issues found.")
        return None

    # Filter out WIP issues
    available = [i for i in issues if not has_label(i, 'wip')]

    if not available:
        print("All issues are WIP.")
        return None

    # Sort by priority (lower first), then by creation date (older first)
    sorted_issues = sorted(available, key=lambda x: (get_priority(x), x.get('createdAt', '')))

    print(f"\nChecking {len(sorted_issues)} issues by priority...")

    # Find first issue with no open dependencies
    for issue in sorted_issues:
        num = issue['number']
        title = issue['title']
        priority_labels = [l['name'] for l in issue.get('labels', [])
                          if l['name'].upper() in ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']]
        priority = priority_labels[0] if priority_labels else 'NONE'

        # Double-check for WIP (safety check)
        if has_label(issue, 'wip'):
            print(f"Skipping #{num} - has WIP label (safety check)")
            continue

        # Check dependencies
        deps_closed, open_deps = check_dependencies_closed(issue)

        if not deps_closed:
            print(f"Skipping #{num} [{priority}] - blocked by {open_deps}")
            continue

        print(f"\n[OK] Found available issue: #{num} [{priority}]")
        print(f"  Title: {title}")
        return issue

    print("\nAll issues are either WIP or blocked by dependencies.")
    return None

if __name__ == '__main__':
    issue = find_available_issue()
    if issue:
        print(f"\nReturning issue #{issue['number']}")
        print(json.dumps(issue, indent=2))
        sys.exit(0)
    else:
        sys.exit(1)
