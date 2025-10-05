#!/usr/bin/env python3
"""
IMPLEMENTER WORKFLOW: Find and execute ONE issue following priority rules
"""
import json
import subprocess
import sys
import os

PRIORITY_ORDER = {
    'CRITICAL': 0,
    'URGENT': 1,
    'HIGH': 2,
    'MEDIUM': 3,
    'LOW': 4
}

def run_command(cmd, capture=True, use_powershell=False):
    """Run shell command"""
    try:
        if use_powershell:
            # Use PowerShell for Windows commands
            cmd = f'powershell -Command "{cmd}"'

        if capture:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8')
            return result.stdout.strip(), result.stderr.strip(), result.returncode
        else:
            result = subprocess.run(cmd, shell=True)
            return "", "", result.returncode
    except Exception as e:
        print(f"Error running command: {e}")
        return "", str(e), 1

def fetch_issues():
    """Fetch all open issues using gh CLI"""
    print("Fetching open issues...")
    cmd = 'gh issue list --state open --json number,title,labels,createdAt --limit 100'
    stdout, stderr, code = run_command(cmd, use_powershell=True)

    if code != 0:
        print(f"Error fetching issues: {stderr}")
        return []

    try:
        issues = json.loads(stdout)
        return issues
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        print(f"Output was: {stdout[:200]}")
        return []

def get_priority(labels):
    """Extract priority from labels"""
    for label in labels:
        name = label.get('name', '').upper()
        if name in PRIORITY_ORDER:
            return name
    return 'LOW'  # Default priority

def has_wip_label(labels):
    """Check if issue has WIP label"""
    for label in labels:
        if label.get('name', '').lower() == 'wip':
            return True
    return False

def get_dependency_labels(labels):
    """Extract dependency labels (d1, d2, etc)"""
    deps = []
    for label in labels:
        name = label.get('name', '').lower()
        if name.startswith('d') and name[1:].isdigit():
            deps.append(name)
    return deps

def check_issue_closed(issue_num):
    """Check if an issue is closed"""
    cmd = f'gh issue view {issue_num} --json state'
    stdout, stderr, code = run_command(cmd, use_powershell=True)

    if code != 0:
        print(f"  Warning: Could not check issue #{issue_num}")
        return False

    try:
        data = json.loads(stdout)
        return data.get('state', '').upper() == 'CLOSED'
    except:
        return False

def sort_issues(issues):
    """Sort issues by priority (CRITICAL > URGENT > HIGH > MEDIUM > LOW), then by creation date (oldest first)"""
    def sort_key(issue):
        labels = issue.get('labels', [])
        priority = get_priority(labels)
        priority_value = PRIORITY_ORDER.get(priority, 99)
        created_at = issue.get('createdAt', '')
        return (priority_value, created_at)

    return sorted(issues, key=sort_key)

def main():
    """Main workflow"""
    # Fetch all open issues
    issues = fetch_issues()
    if not issues:
        print("No issues found or error fetching issues")
        return

    print(f"Found {len(issues)} open issues")

    # Sort by priority
    sorted_issues = sort_issues(issues)

    print("\nSorted issues by priority:")
    for issue in sorted_issues[:10]:  # Show top 10
        labels = issue.get('labels', [])
        priority = get_priority(labels)
        wip = has_wip_label(labels)
        deps = get_dependency_labels(labels)
        wip_tag = " [WIP]" if wip else ""
        dep_tag = f" [deps: {','.join(deps)}]" if deps else ""
        print(f"  #{issue['number']} [{priority}]{wip_tag}{dep_tag} - {issue['title'][:60]}")

    # Find first claimable issue
    print("\nSearching for claimable issue...")
    for issue in sorted_issues:
        num = issue['number']
        title = issue['title']
        labels = issue.get('labels', [])
        priority = get_priority(labels)

        # Skip if has WIP label
        if has_wip_label(labels):
            print(f"  Skipping #{num} - has WIP label")
            continue

        # Check dependencies
        dep_labels = get_dependency_labels(labels)
        if dep_labels:
            print(f"  Checking dependencies for #{num}: {dep_labels}")
            blocked = False
            for dep_label in dep_labels:
                dep_num = dep_label[1:]  # Remove 'd' prefix
                if not check_issue_closed(dep_num):
                    print(f"  Skipping #{num} - blocked by #{dep_num}")
                    blocked = True
                    break
            if blocked:
                continue

        # Found claimable issue!
        print(f"\n✓ Found claimable issue: #{num} [{priority}] - {title}")

        # Output JSON for the calling script
        result = {
            'number': num,
            'title': title,
            'priority': priority,
            'labels': [l.get('name') for l in labels]
        }

        with open('claimable_issue_work.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)

        print(f"\nNext steps:")
        print(f"  1. Claim: gh issue edit {num} --add-label wip")
        print(f"  2. Branch: git checkout -b feature/issue-{num}")
        print(f"  3. Implement solution")
        print(f"  4. Create PR with: Fixes #{num}")

        sys.exit(0)

    print("\nNo claimable issues found - all are either WIP or blocked by dependencies")
    sys.exit(1)

if __name__ == '__main__':
    main()
