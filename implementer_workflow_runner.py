#!/usr/bin/env python3
"""
IMPLEMENTER Workflow Runner
Finds and claims ONE available issue following priority and dependency rules
"""
import json
import subprocess
import sys
from datetime import datetime

# Priority order mapping
PRIORITY_ORDER = {
    'CRITICAL': 0,
    'URGENT': 1,
    'HIGH': 2,
    'MEDIUM': 3,
    'LOW': 4
}

def run_gh_api(endpoint):
    """Run gh API command and return JSON output"""
    try:
        result = subprocess.run(
            [r'C:\Program Files\GitHub CLI\gh.bat', 'api', endpoint],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"ERROR: gh API failed: {e.stderr}", file=sys.stderr)
        return None

def fetch_issues():
    """Fetch all open issues from GitHub"""
    print("Fetching open issues...")
    output = run_gh_api('repos/irsiksoftware/TestForAI/issues?state=open^&per_page=100')

    if not output:
        return []

    try:
        data = json.loads(output)
    except Exception as e:
        print(f"ERROR parsing JSON: {e}", file=sys.stderr)
        return []

    # Filter out pull requests (they appear in issues API)
    return [issue for issue in data if 'pull_request' not in issue]

def has_wip_label(issue):
    """Check if issue has 'wip' label"""
    return any(label['name'].lower() == 'wip' for label in issue['labels'])

def get_priority(issue):
    """Extract priority from issue labels"""
    for label in issue['labels']:
        name = label['name'].upper()
        if name in PRIORITY_ORDER:
            return name
    return 'LOW'  # Default priority

def get_dependency_numbers(issue):
    """Extract dependency issue numbers from labels (d1, d2, etc.)"""
    deps = []
    for label in issue['labels']:
        name = label['name'].lower()
        if name.startswith('d') and name[1:].isdigit():
            deps.append(int(name[1:]))
    return deps

def check_issue_closed(issue_num):
    """Check if an issue is closed"""
    output = run_gh_api(f'repos/irsiksoftware/TestForAI/issues/{issue_num}')

    if not output:
        return False

    data = json.loads(output)
    return data.get('state') == 'closed'

def sort_issues(issues):
    """Sort issues by priority (oldest first within each tier)"""
    # Filter out WIP issues
    available = [i for i in issues if not has_wip_label(i)]

    # Sort by priority order, then by creation date (oldest first)
    sorted_issues = sorted(
        available,
        key=lambda i: (
            PRIORITY_ORDER.get(get_priority(i), 99),
            datetime.fromisoformat(i['created_at'].replace('Z', '+00:00'))
        )
    )

    return sorted_issues

def find_claimable_issue(issues):
    """Find first issue with no open dependencies"""
    for issue in issues:
        issue_num = issue['number']

        # Double-check no WIP label (safety check)
        if has_wip_label(issue):
            print(f"Skipping #{issue_num} - has WIP label (safety check)")
            continue

        # Check dependencies
        deps = get_dependency_numbers(issue)

        if deps:
            # Check if all dependencies are closed
            blocked = False
            for dep_num in deps:
                if not check_issue_closed(dep_num):
                    print(f"Skipping #{issue_num} - blocked by #{dep_num}")
                    blocked = True
                    break

            if blocked:
                continue

        # Found claimable issue!
        return issue

    return None

def main():
    """Main workflow"""
    # Fetch issues
    issues = fetch_issues()

    if not issues:
        print("No issues found or error fetching issues")
        sys.exit(1)

    # Sort by priority
    sorted_issues = sort_issues(issues)

    if not sorted_issues:
        print("All issues have WIP label - nothing to claim")
        sys.exit(0)

    print(f"\nFound {len(sorted_issues)} available issues (without WIP)")

    # Find claimable issue
    claimable = find_claimable_issue(sorted_issues)

    if not claimable:
        print("\nAll available issues are blocked by dependencies - exiting")
        sys.exit(0)

    # Output the claimable issue
    issue_num = claimable['number']
    issue_title = claimable['title']
    priority = get_priority(claimable)

    print(f"\n✓ FOUND CLAIMABLE ISSUE:")
    print(f"  #{issue_num}: {issue_title}")
    print(f"  Priority: {priority}")

    # Write to file for shell script to use
    with open('claimable_issue_work.json', 'w') as f:
        json.dump({
            'number': issue_num,
            'title': issue_title,
            'priority': priority
        }, f, indent=2)

    sys.exit(0)

if __name__ == '__main__':
    main()
