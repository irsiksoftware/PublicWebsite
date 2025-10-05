#!/usr/bin/env python3
"""Find the next available issue for the implementer workflow."""

import subprocess
import json
import sys
from datetime import datetime

def has_wip_label(labels):
    """Check if issue has WIP label."""
    label_names = [label['name'].lower() for label in labels]
    return 'wip' in label_names

def get_issues():
    """Fetch all open issues without WIP label."""
    try:
        gh_path = r'C:\Program Files\GitHub CLI\gh-real.exe'
        result = subprocess.run(
            [gh_path, 'issue', 'list', '--state', 'open',
             '--json', 'number,title,labels,createdAt', '--limit', '1000'],
            capture_output=True,
            text=True,
            check=True
        )
        all_issues = json.loads(result.stdout)
        # Filter out WIP issues
        return [issue for issue in all_issues if not has_wip_label(issue['labels'])]
    except Exception as e:
        print(f"Error fetching issues: {e}", file=sys.stderr)
        return []

def get_priority_value(labels):
    """Get priority value for sorting (lower is higher priority)."""
    label_names = [label['name'].lower() for label in labels]

    if 'critical' in label_names:
        return 1
    elif 'urgent' in label_names:
        return 2
    elif 'high' in label_names:
        return 3
    elif 'medium' in label_names:
        return 4
    elif 'low' in label_names:
        return 5
    else:
        return 6  # No priority label

def get_dependency_numbers(labels):
    """Extract dependency issue numbers from labels (d1, d2, etc.)."""
    dependencies = []
    for label in labels:
        name = label['name'].lower()
        if name.startswith('d') and name[1:].isdigit():
            dependencies.append(int(name[1:]))
    return dependencies

def check_dependency_status(dep_number):
    """Check if a dependency issue is closed."""
    try:
        gh_path = r'C:\Program Files\GitHub CLI\gh-real.exe'
        result = subprocess.run(
            [gh_path, 'issue', 'view', str(dep_number), '--json', 'state'],
            capture_output=True,
            text=True,
            check=True
        )
        data = json.loads(result.stdout)
        return data['state'] == 'CLOSED'
    except Exception as e:
        print(f"Error checking dependency #{dep_number}: {e}", file=sys.stderr)
        return False

def sort_issues(issues):
    """Sort issues by priority (CRITICAL > URGENT > HIGH > MEDIUM > LOW), then by age (oldest first)."""
    return sorted(issues, key=lambda x: (get_priority_value(x['labels']), datetime.fromisoformat(x['createdAt'].replace('Z', '+00:00'))))

def find_claimable_issue():
    """Find the first claimable issue following priority and dependency rules."""
    issues = get_issues()
    if not issues:
        print("No issues found", file=sys.stderr)
        return None

    sorted_issues = sort_issues(issues)

    for issue in sorted_issues:
        number = issue['number']
        title = issue['title']
        labels = issue['labels']

        # Safety check: skip if has WIP label
        if has_wip_label(labels):
            print(f"Skipping #{number} - has WIP label (safety check)", file=sys.stderr)
            continue

        # Check dependencies
        dependencies = get_dependency_numbers(labels)
        if dependencies:
            blocked = False
            for dep in dependencies:
                if not check_dependency_status(dep):
                    print(f"Skipping #{number} - blocked by #{dep}", file=sys.stderr)
                    blocked = True
                    break
            if blocked:
                continue

        # Found claimable issue!
        return {
            'number': number,
            'title': title,
            'labels': labels
        }

    print("All issues are either WIP or blocked by dependencies", file=sys.stderr)
    return None

if __name__ == '__main__':
    issue = find_claimable_issue()
    if issue:
        print(json.dumps(issue, indent=2))
        sys.exit(0)
    else:
        sys.exit(1)
