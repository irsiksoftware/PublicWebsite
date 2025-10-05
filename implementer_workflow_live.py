#!/usr/bin/env python3
import subprocess
import json
import sys
import re
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
        name = label.get('name', '').upper()
        if name in PRIORITY_ORDER:
            return name
    return 'LOW'  # Default to LOW if no priority found

def has_wip_label(labels):
    """Check if issue has WIP label"""
    return any(label.get('name', '').lower() == 'wip' for label in labels)

def get_dependency_numbers(labels):
    """Extract dependency issue numbers from labels (d1, d2, etc)"""
    deps = []
    for label in labels:
        name = label.get('name', '').lower()
        if re.match(r'^d\d+$', name):
            dep_num = name[1:]  # Remove 'd' prefix
            deps.append(dep_num)
    return deps

def check_issue_closed(issue_num):
    """Check if an issue is closed"""
    try:
        result = subprocess.run(
            ['powershell', '-Command', f'gh issue view {issue_num} --json state'],
            capture_output=True,
            text=True,
            check=True
        )
        data = json.loads(result.stdout)
        return data.get('state', '').upper() == 'CLOSED'
    except:
        return False

def get_issue_created_date(issue_num):
    """Get issue creation date"""
    try:
        result = subprocess.run(
            ['powershell', '-Command', f'gh issue view {issue_num} --json createdAt'],
            capture_output=True,
            text=True,
            check=True
        )
        data = json.loads(result.stdout)
        return data.get('createdAt', '')
    except:
        return ''

def fetch_issues():
    """Fetch all open issues without WIP label"""
    try:
        result = subprocess.run(
            ['powershell', '-Command', 'gh issue list --label "!wip" --state open --json number,title,labels,state'],
            capture_output=True,
            text=True,
            check=True
        )
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Error fetching issues: {e}")
        return []

def main():
    # Fetch issues
    print("Fetching available issues...")
    issues = fetch_issues()

    if not issues:
        print("No issues found or error fetching issues")
        return

    # Filter out issues with WIP label (safety check)
    issues = [issue for issue in issues if not has_wip_label(issue.get('labels', []))]

    # Get creation dates and add to issues
    for issue in issues:
        issue['created_at'] = get_issue_created_date(issue['number'])
        issue['priority'] = get_priority(issue.get('labels', []))
        issue['priority_order'] = PRIORITY_ORDER.get(issue['priority'], 4)

    # Sort by priority, then by creation date (oldest first within priority tier)
    issues.sort(key=lambda x: (x['priority_order'], x.get('created_at', '')))

    print(f"\nFound {len(issues)} available issues (sorted by priority):")
    for issue in issues:
        print(f"  #{issue['number']} [{issue['priority']}] {issue['title']}")

    # Find first claimable issue
    for issue in issues:
        issue_num = issue['number']
        labels = issue.get('labels', [])

        # Check dependencies
        deps = get_dependency_numbers(labels)
        if deps:
            print(f"\nChecking dependencies for issue #{issue_num}...")
            blocked = False
            for dep in deps:
                if not check_issue_closed(dep):
                    print(f"  Skipping #{issue_num} - blocked by #{dep}")
                    blocked = True
                    break

            if blocked:
                continue

        # Found claimable issue!
        print(f"\n✓ Found claimable issue: #{issue_num}")
        print(json.dumps(issue, indent=2))

        # Save to file for the workflow
        with open('implementer_target.json', 'w') as f:
            json.dump(issue, f, indent=2)

        sys.exit(0)

    print("\nAll issues are blocked or have WIP label")
    sys.exit(1)

if __name__ == '__main__':
    main()
