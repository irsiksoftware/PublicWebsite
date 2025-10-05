#!/usr/bin/env python3
"""Parse gh issue list text output and find next available issue."""

import subprocess
import re
import sys

def run_gh_command(cmd):
    """Run a gh command and return output."""
    result = subprocess.run(
        cmd,
        shell=True,
        capture_output=True,
        text=True
    )
    return result.stdout.strip(), result.stderr.strip(), result.returncode

def parse_issue_line(line):
    """Parse a single issue line like '#138 [OPEN] [LOW, feature, testing] Create...'"""
    match = re.match(r'#(\d+)\s+\[OPEN\]\s+\[(.*?)\]\s+(.*)', line)
    if not match:
        return None

    number = int(match.group(1))
    labels_str = match.group(2)
    title = match.group(3)

    labels = [l.strip() for l in labels_str.split(',')]

    # Extract priority and check for WIP
    priority_order = {'CRITICAL': 0, 'URGENT': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4}
    priority = 'LOW'
    has_wip = False
    dependencies = []

    for label in labels:
        label_upper = label.upper()
        if label_upper in priority_order:
            priority = label_upper
        elif label_upper == 'WIP':
            has_wip = True
        elif label_upper.startswith('D') and len(label_upper) > 1 and label_upper[1:].isdigit():
            dependencies.append(label_upper[1:])

    return {
        'number': number,
        'title': title,
        'priority': priority,
        'priority_rank': priority_order[priority],
        'has_wip': has_wip,
        'dependencies': dependencies
    }

def check_issue_state(issue_num):
    """Check if an issue is closed."""
    cmd = f'gh issue view {issue_num} --json state'
    stdout, stderr, code = run_gh_command(cmd)

    if code != 0:
        return 'UNKNOWN'

    # Parse JSON manually
    if '"state"' in stdout:
        if '"CLOSED"' in stdout:
            return 'CLOSED'
        elif '"OPEN"' in stdout:
            return 'OPEN'

    return 'UNKNOWN'

def main():
    # Get issues using text format
    cmd = 'gh issue list --state open --limit 100'
    stdout, stderr, code = run_gh_command(cmd)

    if code != 0:
        print(f"Error fetching issues: {stderr}", file=sys.stderr)
        sys.exit(1)

    lines = stdout.split('\n')
    issues = []

    for line in lines:
        line = line.strip()
        if not line or not line.startswith('#'):
            continue

        issue = parse_issue_line(line)
        if issue:
            issues.append(issue)

    # Filter out WIP issues
    available = [i for i in issues if not i['has_wip']]

    print(f"Found {len(available)} issues without WIP label", file=sys.stderr)

    # Sort by priority (rank ascending), then by number (oldest first - lower number = older)
    available.sort(key=lambda x: (x['priority_rank'], x['number']))

    # Find first issue with no open dependencies
    for issue in available:
        number = issue['number']
        deps = issue['dependencies']

        if not deps:
            # No dependencies
            print(f"AVAILABLE: #{number}")
            print(f"TITLE: {issue['title']}", file=sys.stderr)
            print(f"PRIORITY: {issue['priority']}", file=sys.stderr)
            sys.exit(0)

        # Check dependencies
        blocked = False
        for dep in deps:
            dep_state = check_issue_state(dep)
            if dep_state != 'CLOSED':
                print(f"Skipping #{number} - blocked by #{dep} ({dep_state})", file=sys.stderr)
                blocked = True
                break

        if not blocked:
            print(f"AVAILABLE: #{number}")
            print(f"TITLE: {issue['title']}", file=sys.stderr)
            print(f"PRIORITY: {issue['priority']}", file=sys.stderr)
            sys.exit(0)

    print("No available issues found", file=sys.stderr)
    sys.exit(1)

if __name__ == '__main__':
    main()
