#!/usr/bin/env python3
import subprocess
import json
import sys
from datetime import datetime

# Priority mapping
PRIORITY_ORDER = {
    'CRITICAL': 0,
    'URGENT': 1,
    'HIGH': 2,
    'MEDIUM': 3,
    'LOW': 4
}

def get_priority(labels):
    """Extract priority from labels"""
    for label in labels:
        name = label['name'].upper()
        if name in PRIORITY_ORDER:
            return PRIORITY_ORDER[name]
    return 5  # No priority = lowest

def has_wip_label(labels):
    """Check if issue has WIP label"""
    return any(label['name'].lower() == 'wip' for label in labels)

def get_dependency_labels(labels):
    """Extract dependency labels (d1, d2, etc.)"""
    deps = []
    for label in labels:
        name = label['name'].lower()
        if name.startswith('d') and name[1:].isdigit():
            deps.append(int(name[1:]))
    return deps

def main():
    # Fetch all open issues
    gh_path = r'C:\Program Files\GitHub CLI\gh.bat'
    result = subprocess.run(
        [gh_path, 'issue', 'list', '--state', 'open', '--json', 'number,title,labels,createdAt', '--limit', '200'],
        capture_output=True,
        text=True,
        shell=True
    )

    if result.returncode != 0:
        print(f"Error fetching issues: {result.stderr}", file=sys.stderr)
        sys.exit(1)

    issues = json.loads(result.stdout)

    # Filter out WIP issues
    available_issues = [issue for issue in issues if not has_wip_label(issue['labels'])]

    # Sort by priority (lower number = higher priority), then by creation date (oldest first)
    available_issues.sort(key=lambda x: (
        get_priority(x['labels']),
        datetime.fromisoformat(x['createdAt'].replace('Z', '+00:00'))
    ))

    # Find first issue without open dependencies
    for issue in available_issues:
        issue_num = issue['number']
        labels = issue['labels']
        deps = get_dependency_labels(labels)

        if deps:
            # Check if dependencies are closed
            all_closed = True
            for dep in deps:
                dep_result = subprocess.run(
                    [gh_path, 'issue', 'view', str(dep), '--json', 'state'],
                    capture_output=True,
                    text=True,
                    shell=True
                )
                if dep_result.returncode == 0:
                    dep_data = json.loads(dep_result.stdout)
                    if dep_data['state'] != 'CLOSED':
                        print(f"Skipping #{issue_num} - blocked by #{dep}")
                        all_closed = False
                        break

            if not all_closed:
                continue

        # Found claimable issue
        print(json.dumps({
            'number': issue_num,
            'title': issue['title'],
            'labels': [l['name'] for l in labels]
        }))
        sys.exit(0)

    # No available issues
    print("No available issues found")
    sys.exit(1)

if __name__ == '__main__':
    main()
