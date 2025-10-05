#!/usr/bin/env python3
import subprocess
import re
import sys

# Priority order
PRIORITY_ORDER = {
    'CRITICAL': 0,
    'URGENT': 1,
    'HIGH': 2,
    'MEDIUM': 3,
    'LOW': 4
}

def get_issues_text():
    """Fetch all open issues in text format"""
    result = subprocess.run(
        "powershell -Command \"gh issue list --state open --limit 100\"",
        capture_output=True,
        text=True,
        shell=True
    )
    return result.stdout

def parse_issue_line(line):
    """Parse a line like '#138 [OPEN] [LOW, feature, testing] Create...'"""
    match = re.match(r'#(\d+)\s+\[OPEN\]\s+\[(.*?)\]\s+(.*)', line)
    if not match:
        return None

    issue_num = int(match.group(1))
    labels_str = match.group(2)
    title = match.group(3)

    labels = [l.strip().upper() for l in labels_str.split(',')]

    return {
        'number': issue_num,
        'title': title,
        'labels': labels
    }

def get_priority(labels):
    """Get priority level from labels"""
    for priority in PRIORITY_ORDER.keys():
        if priority in labels:
            return priority
    return 'LOW'

def has_wip(labels):
    """Check if labels contain WIP"""
    return 'WIP' in labels

def get_dependency_labels(labels):
    """Extract dependency labels (D1, D2, etc.)"""
    deps = []
    for label in labels:
        if label.startswith('D') and label[1:].isdigit():
            deps.append(int(label[1:]))
    return deps

def check_issue_state(issue_number):
    """Check if an issue is closed"""
    result = subprocess.run(
        f"powershell -Command \"gh issue view {issue_number} --json state | ConvertFrom-Json | Select-Object -ExpandProperty state\"",
        capture_output=True,
        text=True,
        shell=True
    )
    return result.stdout.strip().upper()

def main():
    print("Fetching open issues...")
    issues_text = get_issues_text()

    lines = issues_text.strip().split('\n')
    all_issues = []

    for line in lines:
        issue = parse_issue_line(line)
        if issue:
            all_issues.append(issue)

    print(f"Total issues: {len(all_issues)}")

    # Filter out WIP issues
    available_issues = [i for i in all_issues if not has_wip(i['labels'])]
    print(f"Issues without WIP: {len(available_issues)}")

    if not available_issues:
        print("No available issues found (all have WIP label)")
        sys.exit(0)

    # Sort by priority
    sorted_issues = sorted(available_issues, key=lambda i: (PRIORITY_ORDER.get(get_priority(i['labels']), 999), i['number']))

    print("\nSorted available issues:")
    for issue in sorted_issues:
        priority = get_priority(issue['labels'])
        deps = get_dependency_labels(issue['labels'])
        dep_str = f" [deps: {deps}]" if deps else ""
        print(f"  #{issue['number']} [{priority}]{dep_str} - {issue['title']}")

    # Find first claimable issue
    for issue in sorted_issues:
        issue_num = issue['number']
        deps = get_dependency_labels(issue['labels'])

        if not deps:
            # No dependencies, this is claimable
            print(f"\nFound claimable issue: #{issue_num}")
            print(f"Title: {issue['title']}")
            print(f"Priority: {get_priority(issue['labels'])}")
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
            print(f"Title: {issue['title']}")
            print(f"Priority: {get_priority(issue['labels'])}")
            sys.exit(0)

    print("\nNo claimable issues found (all are blocked or have WIP)")
    sys.exit(0)

if __name__ == '__main__':
    main()
