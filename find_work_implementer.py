#!/usr/bin/env python3
import subprocess
import json
import sys
from datetime import datetime

# Priority order
PRIORITY_ORDER = {
    'CRITICAL': 0,
    'URGENT': 1,
    'HIGH': 2,
    'MEDIUM': 3,
    'LOW': 4
}

def get_issues():
    """Fetch all open issues"""
    result = subprocess.run(
        [r'C:\Program Files\GitHub CLI\gh.bat', 'issue', 'list', '--state', 'open', '--json', 'number,title,labels,createdAt', '--limit', '100'],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"Error fetching issues: {result.stderr}")
        sys.exit(1)
    print(f"Raw output: {result.stdout[:500]}")  # Debug
    return json.loads(result.stdout)

def filter_wip_issues(issues):
    """Filter out issues with WIP label"""
    filtered = []
    for issue in issues:
        label_names = [label['name'].lower() for label in issue.get('labels', [])]
        if 'wip' not in label_names:
            filtered.append(issue)
    return filtered

def get_priority(issue):
    """Get priority level from issue labels"""
    label_names = [label['name'].upper() for label in issue.get('labels', [])]
    for priority in PRIORITY_ORDER.keys():
        if priority in label_names:
            return priority
    return 'LOW'  # Default to LOW if no priority found

def sort_issues(issues):
    """Sort issues by priority (CRITICAL > URGENT > HIGH > MEDIUM > LOW), then by oldest first"""
    def sort_key(issue):
        priority = get_priority(issue)
        priority_rank = PRIORITY_ORDER.get(priority, 999)
        created_at = datetime.fromisoformat(issue['createdAt'].replace('Z', '+00:00'))
        return (priority_rank, created_at)

    return sorted(issues, key=sort_key)

def get_dependency_labels(issue):
    """Extract dependency labels (d1, d2, etc.) from issue"""
    deps = []
    label_names = [label['name'].lower() for label in issue.get('labels', [])]
    for label in label_names:
        if label.startswith('d') and label[1:].isdigit():
            deps.append(int(label[1:]))
    return deps

def check_issue_state(issue_number):
    """Check if an issue is closed"""
    result = subprocess.run(
        [r'C:\Program Files\GitHub CLI\gh.bat', 'issue', 'view', str(issue_number), '--json', 'state'],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        return None
    data = json.loads(result.stdout)
    return data.get('state', '').upper()

def main():
    print("Fetching open issues...")
    all_issues = get_issues()

    print(f"Total issues: {len(all_issues)}")

    # Filter out WIP issues
    available_issues = filter_wip_issues(all_issues)
    print(f"Issues without WIP: {len(available_issues)}")

    if not available_issues:
        print("No available issues found (all have WIP label or are blocked)")
        sys.exit(0)

    # Sort by priority and age
    sorted_issues = sort_issues(available_issues)

    print("\nSorted available issues:")
    for issue in sorted_issues:
        priority = get_priority(issue)
        deps = get_dependency_labels(issue)
        dep_str = f" [deps: {deps}]" if deps else ""
        print(f"  #{issue['number']} [{priority}]{dep_str} - {issue['title']}")

    # Find first claimable issue
    for issue in sorted_issues:
        issue_num = issue['number']
        deps = get_dependency_labels(issue)

        if not deps:
            # No dependencies, this is claimable
            print(f"\nFound claimable issue: #{issue_num}")
            print(json.dumps(issue, indent=2))
            sys.exit(0)

        # Check if all dependencies are closed
        all_deps_closed = True
        for dep_num in deps:
            state = check_issue_state(dep_num)
            if state != 'CLOSED':
                print(f"Skipping #{issue_num} - blocked by #{dep_num} (state: {state})")
                all_deps_closed = False
                break

        if all_deps_closed:
            print(f"\nFound claimable issue: #{issue_num} (all dependencies closed)")
            print(json.dumps(issue, indent=2))
            sys.exit(0)

    print("\nNo claimable issues found (all are blocked or have WIP)")
    sys.exit(0)

if __name__ == '__main__':
    main()
