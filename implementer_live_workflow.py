#!/usr/bin/env python3
import subprocess
import json
import sys
from datetime import datetime

# Priority order mapping
PRIORITY_ORDER = {
    'CRITICAL': 1,
    'URGENT': 2,
    'HIGH': 3,
    'MEDIUM': 4,
    'LOW': 5
}

def run_gh_command(args):
    """Run gh CLI command"""
    gh_path = r'C:\Program Files\GitHub CLI\gh-real.exe'
    result = subprocess.run(
        [gh_path] + args,
        capture_output=True,
        text=True,
        encoding='utf-8'
    )
    if result.returncode != 0:
        print(f"Error: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    return result.stdout

def get_priority_from_labels(labels):
    """Extract priority from labels"""
    for label in labels:
        name = label['name'].upper()
        if name in PRIORITY_ORDER:
            return name
    return 'LOW'

def has_wip_label(labels):
    """Check if issue has WIP label"""
    return any(label['name'].lower() == 'wip' for label in labels)

def get_dependency_labels(labels):
    """Extract dependency labels (d1, d2, etc)"""
    deps = []
    for label in labels:
        name = label['name'].lower()
        if name.startswith('d') and name[1:].isdigit():
            deps.append(int(name[1:]))
    return deps

def is_issue_closed(issue_num):
    """Check if an issue is closed"""
    result = run_gh_command(['issue', 'view', str(issue_num), '--json', 'state'])
    data = json.loads(result)
    return data['state'] == 'CLOSED'

def main():
    # Fetch all open issues
    print("Fetching open issues...", file=sys.stderr)
    json_output = run_gh_command(['issue', 'list', '--state', 'open', '--json', 'number,title,labels,createdAt', '--limit', '100'])
    issues = json.loads(json_output)

    # Filter out WIP issues
    available_issues = [issue for issue in issues if not has_wip_label(issue['labels'])]

    print(f"Found {len(available_issues)} issues without WIP label", file=sys.stderr)

    # Sort by priority (oldest first within tier)
    def sort_key(issue):
        priority = get_priority_from_labels(issue['labels'])
        priority_num = PRIORITY_ORDER.get(priority, 5)
        created_at = issue['createdAt']
        return (priority_num, created_at)

    available_issues.sort(key=sort_key)

    # Find first claimable issue
    for issue in available_issues:
        issue_num = issue['number']
        title = issue['title']
        priority = get_priority_from_labels(issue['labels'])
        deps = get_dependency_labels(issue['labels'])

        print(f"\nChecking #{issue_num}: {title} [{priority}]", file=sys.stderr)

        # Check dependencies
        if deps:
            blocked = False
            for dep_num in deps:
                if not is_issue_closed(dep_num):
                    print(f"  Skipping #{issue_num} - blocked by #{dep_num}", file=sys.stderr)
                    blocked = True
                    break

            if blocked:
                continue

        # Found claimable issue!
        print(f"\nFound claimable issue: #{issue_num}", file=sys.stderr)
        print(json.dumps({
            'number': issue_num,
            'title': title,
            'priority': priority
        }))
        sys.exit(0)

    print("\nNo claimable issues found (all blocked or have WIP)", file=sys.stderr)
    sys.exit(1)

if __name__ == '__main__':
    main()
