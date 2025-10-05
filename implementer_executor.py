#!/usr/bin/env python3
"""IMPLEMENTER: Find ONE claimable issue and output it."""

import json
import subprocess
import sys

PRIORITY_ORDER = {'CRITICAL': 0, 'URGENT': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4}

def run_cmd(args):
    """Run command and return output."""
    result = subprocess.run(args, capture_output=True, text=True, encoding='utf-8', shell=True)
    return result.stdout.strip() if result.returncode == 0 else None

def get_issues():
    """Fetch open issues via API."""
    # Read from pre-fetched file
    try:
        with open('api_issues_temp.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def has_wip(labels):
    """Check if WIP label present."""
    return any(l.get('name', '').lower() == 'wip' for l in labels)

def get_priority(labels):
    """Get priority from labels."""
    for l in labels:
        name = l.get('name', '').upper()
        if name in PRIORITY_ORDER:
            return name
    return 'LOW'

def get_deps(labels):
    """Extract dependency issue numbers (d1, d2, etc)."""
    deps = []
    for l in labels:
        name = l.get('name', '').lower()
        if name.startswith('d') and name[1:].isdigit():
            deps.append(int(name[1:]))
    return deps

def is_closed(issue_num):
    """Check if issue is closed."""
    output = run_cmd([f'"C:\\Program Files\\GitHub CLI\\gh.bat" api repos/irsiksoftware/TestForAI/issues/{issue_num}'])
    if not output:
        return False
    data = json.loads(output)
    return data.get('state', '').upper() == 'CLOSED'

def main():
    print("IMPLEMENTER: Finding available work...")

    # Fetch issues
    all_issues = get_issues()

    # Filter out PRs and WIP issues
    issues = [i for i in all_issues if 'pull_request' not in i and not has_wip(i.get('labels', []))]

    print(f"Found {len(issues)} open issues (excluding WIP and PRs)")

    # Sort by priority, then by created date (oldest first)
    def sort_key(issue):
        priority = get_priority(issue.get('labels', []))
        created = issue.get('created_at', '')
        return (PRIORITY_ORDER.get(priority, 999), created)

    sorted_issues = sorted(issues, key=sort_key)

    # Find first claimable issue
    for issue in sorted_issues:
        num = issue['number']
        title = issue['title']
        labels = issue.get('labels', [])
        priority = get_priority(labels)

        # Safety check
        if has_wip(labels):
            print(f"Skipping #{num} - has WIP (safety check)")
            continue

        # Check dependencies
        deps = get_deps(labels)
        if deps:
            print(f"Checking dependencies for #{num}: {deps}")
            blocked = False
            for dep in deps:
                if not is_closed(dep):
                    print(f"Skipping #{num} - blocked by #{dep}")
                    blocked = True
                    break
            if blocked:
                continue

        # Found claimable issue!
        print(f"\nFOUND: #{num} [{priority}] {title}")

        # Output to file
        with open('implementer_target.json', 'w', encoding='utf-8') as f:
            json.dump({'found': True, 'number': num, 'title': title, 'priority': priority}, f, indent=2)

        sys.exit(0)

    # No issue found
    print("\nNo claimable issues found. All blocked or have WIP. Exiting.")
    with open('implementer_target.json', 'w', encoding='utf-8') as f:
        json.dump({'found': False}, f, indent=2)
    sys.exit(1)

if __name__ == '__main__':
    main()
