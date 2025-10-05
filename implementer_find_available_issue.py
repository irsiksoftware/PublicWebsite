#!/usr/bin/env python3
"""Find the next available issue to work on following priority rules."""

import subprocess
import json
import sys
from datetime import datetime

def run_gh_command(cmd):
    """Run a gh command and return JSON output."""
    result = subprocess.run(
        cmd,
        shell=True,
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"Error running command: {result.stderr}", file=sys.stderr)
        return None
    return result.stdout.strip()

def parse_labels(labels_list):
    """Parse labels to extract priority and other info."""
    priority_order = {'CRITICAL': 0, 'URGENT': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4}
    priority = 'LOW'  # default
    has_wip = False
    dependencies = []

    for label in labels_list:
        label_name = label.get('name', '').upper()
        if label_name in priority_order:
            priority = label_name
        elif label_name == 'WIP':
            has_wip = True
        elif label_name.startswith('D') and label_name[1:].isdigit():
            # Dependency label like d1, d2, etc
            dep_num = label_name[1:]
            dependencies.append(dep_num)

    return priority, has_wip, dependencies

def get_issue_state(issue_num):
    """Check if an issue is open or closed."""
    cmd = f'gh issue view {issue_num} --json state'
    output = run_gh_command(cmd)
    if output:
        try:
            data = json.loads(output)
            return data.get('state', 'OPEN')
        except:
            return 'UNKNOWN'
    return 'UNKNOWN'

def main():
    # Fetch all open issues
    cmd = 'gh issue list --state open --json number,title,labels,createdAt --limit 100'
    output = run_gh_command(cmd)

    if not output:
        print("Failed to fetch issues", file=sys.stderr)
        sys.exit(1)

    try:
        issues = json.loads(output)
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {e}", file=sys.stderr)
        print(f"Output: {output[:500]}", file=sys.stderr)
        sys.exit(1)

    # Parse and filter issues
    available_issues = []
    priority_order = {'CRITICAL': 0, 'URGENT': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4}

    for issue in issues:
        number = issue['number']
        title = issue['title']
        labels = issue.get('labels', [])
        created_at = issue.get('createdAt', '')

        priority, has_wip, dependencies = parse_labels(labels)

        # Skip WIP issues
        if has_wip:
            print(f"Skipping #{number} - has WIP label", file=sys.stderr)
            continue

        available_issues.append({
            'number': number,
            'title': title,
            'priority': priority,
            'priority_rank': priority_order[priority],
            'created_at': created_at,
            'dependencies': dependencies
        })

    # Sort by priority (rank), then by creation date (oldest first)
    available_issues.sort(key=lambda x: (x['priority_rank'], x['created_at']))

    # Find first issue with no open dependencies
    for issue in available_issues:
        number = issue['number']
        deps = issue['dependencies']

        if not deps:
            # No dependencies, this is available
            print(json.dumps(issue))
            sys.exit(0)

        # Check dependencies
        blocked = False
        for dep in deps:
            dep_state = get_issue_state(dep)
            if dep_state != 'CLOSED':
                print(f"Skipping #{number} - blocked by #{dep} ({dep_state})", file=sys.stderr)
                blocked = True
                break

        if not blocked:
            print(json.dumps(issue))
            sys.exit(0)

    print("No available issues found", file=sys.stderr)
    sys.exit(1)

if __name__ == '__main__':
    main()
