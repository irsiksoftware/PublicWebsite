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
            return name
    return 'LOW'  # Default priority

def has_wip_label(labels):
    """Check if issue has WIP label"""
    return any(label['name'].lower() == 'wip' for label in labels)

def get_dependency_numbers(labels):
    """Extract dependency issue numbers from labels (d1, d2, etc)"""
    deps = []
    for label in labels:
        name = label['name'].lower()
        if name.startswith('d') and name[1:].isdigit():
            deps.append(int(name[1:]))
    return deps

def check_dependency_status(dep_number):
    """Check if a dependency issue is closed"""
    try:
        result = subprocess.run(
            [r'C:\Program Files\GitHub CLI\gh.bat', 'issue', 'view', str(dep_number), '--json', 'state'],
            capture_output=True,
            text=True,
            check=True
        )
        data = json.loads(result.stdout)
        return data['state'] == 'CLOSED'
    except:
        return False

def main():
    # Fetch all open issues using API
    result = subprocess.run(
        [r'C:\Program Files\GitHub CLI\gh.bat', 'api', 'repos/:owner/:repo/issues?state=open&per_page=100'],
        capture_output=True,
        shell=False
    )

    issues_data = json.loads(result.stdout.decode('utf-8', errors='ignore'))

    # Filter out PRs (they have pull_request field)
    issues = [i for i in issues_data if 'pull_request' not in i or not i['pull_request']]

    # Filter out WIP issues and parse
    available = []
    for issue in issues:
        if has_wip_label(issue['labels']):
            continue

        priority = get_priority(issue['labels'])
        deps = get_dependency_numbers(issue['labels'])
        created = datetime.fromisoformat(issue['created_at'].replace('Z', '+00:00'))

        available.append({
            'number': issue['number'],
            'title': issue['title'],
            'priority': priority,
            'priority_rank': PRIORITY_ORDER[priority],
            'created_at': created,
            'dependencies': deps
        })

    # Sort by priority (rank), then by creation date (oldest first)
    available.sort(key=lambda x: (x['priority_rank'], x['created_at']))

    # Find first claimable issue
    for issue in available:
        # Check dependencies
        if issue['dependencies']:
            blocked = False
            for dep in issue['dependencies']:
                if not check_dependency_status(dep):
                    print(f"Skipping #{issue['number']} - blocked by #{dep}", file=sys.stderr)
                    blocked = True
                    break
            if blocked:
                continue

        # Found claimable issue
        print(json.dumps(issue, default=str))
        return

    # No claimable issues
    print("No claimable issues found", file=sys.stderr)
    sys.exit(1)

if __name__ == '__main__':
    main()
