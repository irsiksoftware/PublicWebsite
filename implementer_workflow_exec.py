#!/usr/bin/env python3
"""IMPLEMENTER: Find and work on ONE available issue following priority rules."""

import subprocess
import json
import re
import sys
from datetime import datetime

def run_command(cmd, capture=True):
    """Run a shell command and return output."""
    try:
        if capture:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return result.stdout.strip(), result.stderr.strip(), result.returncode
        else:
            result = subprocess.run(cmd, shell=True)
            return "", "", result.returncode
    except Exception as e:
        return "", str(e), 1

def fetch_issues():
    """Fetch all open issues excluding WIP via GitHub CLI."""
    print("Fetching available issues (excluding WIP)...")
    cmd = '"C:\\Program Files\\GitHub CLI\\gh.bat" issue list --label "!wip" --state open --limit 100'
    stdout, stderr, code = run_command(cmd)

    if code != 0:
        print(f"Error fetching issues: {stderr}")
        return []

    issues = []
    for line in stdout.split('\n'):
        if not line.strip():
            continue
        # Parse: #138 [OPEN] [LOW, feature, testing] Create comprehensive...
        match = re.match(r'#(\d+)\s+\[OPEN\]\s+\[(.*?)\]\s+(.*)', line)
        if match:
            number = int(match.group(1))
            labels_str = match.group(2)
            title = match.group(3)
            labels = [l.strip() for l in labels_str.split(',')]

            # Skip if has wip label (safety check)
            if 'wip' in labels:
                continue

            issues.append({
                'number': number,
                'title': title,
                'labels': labels
            })

    return issues

def get_priority_level(labels):
    """Determine priority level from labels."""
    priority_map = {
        'CRITICAL': 5,
        'URGENT': 4,
        'HIGH': 3,
        'MEDIUM': 2,
        'LOW': 1
    }

    for label in labels:
        label_upper = label.upper()
        if label_upper in priority_map:
            return priority_map[label_upper], label_upper

    return 0, 'NONE'

def sort_issues(issues):
    """Sort issues by priority (highest first), then by number (oldest first)."""
    def sort_key(issue):
        priority_val, _ = get_priority_level(issue['labels'])
        return (-priority_val, issue['number'])

    return sorted(issues, key=sort_key)

def check_dependencies(issue_num):
    """Check if issue has any open dependencies (d1, d2, etc labels)."""
    print(f"Checking dependencies for issue #{issue_num}...")

    # Get issue details
    cmd = f'"C:\\Program Files\\GitHub CLI\\gh.bat" issue view {issue_num} --json labels,body'
    stdout, stderr, code = run_command(cmd)

    if code != 0:
        print(f"Error getting issue details: {stderr}")
        return None

    # Parse JSON output
    try:
        issue_data = json.loads(stdout)
        labels = [l['name'] for l in issue_data.get('labels', [])]
        body = issue_data.get('body', '')

        # Find dependency labels (d1, d2, etc)
        dep_pattern = re.compile(r'^d(\d+)$')
        dep_labels = [l for l in labels if dep_pattern.match(l)]

        if not dep_labels:
            return []

        # Extract dependency issue numbers from body
        dep_issues = []
        for dep_label in dep_labels:
            # Look for "Depends on #N" or similar in body
            dep_match = re.search(r'[Dd]epend.*?#(\d+)', body)
            if dep_match:
                dep_num = int(dep_match.group(1))
                dep_issues.append(dep_num)

        # If we found dependency labels but no issue numbers, extract from label
        if dep_labels and not dep_issues:
            # Try to find issue references in the body
            issue_refs = re.findall(r'#(\d+)', body)
            dep_issues = [int(ref) for ref in issue_refs]

        return dep_issues

    except json.JSONDecodeError:
        print(f"Failed to parse JSON for issue #{issue_num}")
        return None

def is_issue_closed(issue_num):
    """Check if an issue is closed."""
    cmd = f'"C:\\Program Files\\GitHub CLI\\gh.bat" issue view {issue_num} --json state'
    stdout, stderr, code = run_command(cmd)

    if code != 0:
        return False

    try:
        data = json.loads(stdout)
        return data.get('state') == 'CLOSED'
    except:
        return False

def main():
    print("=== IMPLEMENTER WORKFLOW ===\n")

    # Step 1: Fetch available issues
    issues = fetch_issues()
    if not issues:
        print("No available issues found (all may have WIP label).")
        return

    print(f"Found {len(issues)} available issues\n")

    # Step 2: Sort by priority
    sorted_issues = sort_issues(issues)

    print("Issues sorted by priority:")
    for issue in sorted_issues[:10]:
        priority_val, priority_name = get_priority_level(issue['labels'])
        print(f"  #{issue['number']} [{priority_name}] {issue['title'][:60]}")
    print()

    # Step 3: Find first claimable issue
    for issue in sorted_issues:
        issue_num = issue['number']
        priority_val, priority_name = get_priority_level(issue['labels'])

        print(f"\n--- Checking issue #{issue_num} [{priority_name}] ---")
        print(f"Title: {issue['title']}")

        # Check dependencies
        dep_issues = check_dependencies(issue_num)

        if dep_issues is None:
            print(f"Error checking dependencies, skipping...")
            continue

        if dep_issues:
            print(f"Found dependencies: {dep_issues}")
            # Check if any are open
            open_deps = []
            for dep_num in dep_issues:
                if not is_issue_closed(dep_num):
                    open_deps.append(dep_num)

            if open_deps:
                print(f"Skipping #{issue_num} - blocked by open dependencies: {open_deps}")
                continue
            else:
                print(f"All dependencies are closed, proceeding...")

        # Found claimable issue!
        print(f"\n✓ FOUND CLAIMABLE ISSUE: #{issue_num}")
        print(f"Title: {issue['title']}")
        print(f"Priority: {priority_name}")
        print(f"\nReady to claim and implement.")
        print(f"\nNext steps:")
        print(f"1. Claim: gh issue edit {issue_num} --add-label wip")
        print(f"2. Notify Discord: python core/discord_notifier.py issue_claimed 'James Howlett' {issue_num} '{issue['title']}'")
        print(f"3. Create branch: git checkout -b feature/issue-{issue_num}")
        print(f"4. Implement solution")
        print(f"5. Commit and push")
        print(f"6. Create PR")
        print(f"7. Remove WIP label")
        print(f"8. Cleanup and exit")

        # Store the selected issue for next phase
        with open('implementer_selected_issue.json', 'w') as f:
            json.dump(issue, f, indent=2)

        return

    print("\nAll issues are blocked by dependencies or have WIP label.")
    print("No work available.")

if __name__ == '__main__':
    main()
