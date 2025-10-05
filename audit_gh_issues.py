#!/usr/bin/env python3
"""
GitHub Issues Backlog Health Audit Script

This script audits GitHub issues for:
- Broken dependencies (d1, d2, etc. labels pointing to non-existent issues)
- Missing or multiple priority labels
- Missing type labels based on title keywords
"""

import subprocess
import json
import re
import sys

def run_gh_command(args):
    """Run a gh CLI command and return the output"""
    cmd = [r'C:\Program Files\GitHub CLI\gh.bat'] + args
    result = subprocess.run(cmd, capture_output=True, text=True, shell=True, encoding='utf-8', errors='replace')
    stdout = result.stdout.strip() if result.stdout else ""
    stderr = result.stderr.strip() if result.stderr else ""
    return stdout, stderr, result.returncode

def get_all_issues():
    """Fetch all open issues using gh API"""
    # First get raw JSON
    stdout, stderr, returncode = run_gh_command([
        'api', '--paginate', '--method', 'GET',
        'repos/:owner/:repo/issues',
        '-F', 'state=open',
        '-F', 'per_page=100'
    ])

    if returncode != 0:
        print(f"Error fetching issues: {stderr}")
        print(f"Stdout: {stdout[:200]}")
        print(f"Return code: {returncode}")
        return []

    if not stdout:
        print("No output from gh command")
        return []

    # Parse JSON
    try:
        all_issues = json.loads(stdout)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        print(f"Output was: {stdout[:500]}")
        return []

    # Transform to simpler format
    issues = []
    for issue in all_issues:
        # Skip pull requests
        if 'pull_request' in issue:
            continue

        issues.append({
            'number': issue['number'],
            'title': issue['title'],
            'labels': [label['name'] for label in issue['labels']]
        })

    return issues

def check_issue_exists(issue_number):
    """Check if an issue exists and return its state"""
    stdout, stderr, returncode = run_gh_command([
        'issue', 'view', str(issue_number), '--json', 'number,state'
    ])

    if returncode != 0 or 'could not resolve' in stderr.lower():
        return False, None

    try:
        data = json.loads(stdout)
        return True, data.get('state', 'unknown')
    except json.JSONDecodeError:
        return False, None

def extract_dependency_labels(labels):
    """Extract dependency labels (d1, d2, d75, etc.) from label list"""
    dep_pattern = re.compile(r'^d(\d+)$', re.IGNORECASE)
    deps = []
    for label in labels:
        match = dep_pattern.match(label)
        if match:
            deps.append(int(match.group(1)))
    return deps

def extract_priority_labels(labels):
    """Extract priority labels from label list"""
    priorities = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']
    return [label for label in labels if label in priorities]

def extract_type_labels(labels):
    """Extract type labels from label list"""
    types = ['testing', 'bug', 'feature']
    return [label for label in labels if label in types]

def determine_needed_type(title):
    """Determine what type label is needed based on title"""
    title_lower = title.lower()

    # Check for testing keywords
    if 'test' in title_lower or 'testing' in title_lower:
        return 'testing'

    # Check for bug keywords
    if any(word in title_lower for word in ['bug', 'fix', 'error']):
        return 'bug'

    # Check for feature keywords
    if any(word in title_lower for word in ['feature', 'add', 'create', 'implement', 'build', 'design']):
        return 'feature'

    return None

def audit_issues():
    """Main audit function"""
    print("Fetching open issues from GitHub...")
    issues = get_all_issues()

    if not issues:
        print("No issues found or error fetching issues")
        return

    print(f"Fetched {len(issues)} open issues\n")
    print("=" * 80)
    print("AUDITING ISSUES FOR BACKLOG HEALTH")
    print("=" * 80)

    # Tracking variables
    broken_deps = []
    missing_priority = []
    multiple_priority = []
    missing_type = []

    # Audit each issue
    for i, issue in enumerate(issues, 1):
        issue_num = issue['number']
        title = issue['title']
        labels = issue['labels']

        print(f"\n[{i}/{len(issues)}] Auditing Issue #{issue_num}...", end='\r')

        # Check dependencies
        dep_labels = extract_dependency_labels(labels)
        for dep_num in dep_labels:
            exists, state = check_issue_exists(dep_num)
            if not exists:
                broken_deps.append(f"Issue #{issue_num} depends on non-existent #{dep_num}")

        # Check priority labels
        priority_labels = extract_priority_labels(labels)
        if len(priority_labels) == 0:
            missing_priority.append({
                'number': issue_num,
                'title': title,
                'labels': labels
            })
        elif len(priority_labels) > 1:
            multiple_priority.append({
                'number': issue_num,
                'title': title,
                'priorities': priority_labels,
                'labels': labels
            })

        # Check type labels
        type_labels = extract_type_labels(labels)
        needed_type = determine_needed_type(title)
        if needed_type and needed_type not in type_labels:
            missing_type.append({
                'number': issue_num,
                'title': title,
                'needed_type': needed_type,
                'current_types': type_labels,
                'labels': labels
            })

    print("\n" * 2)

    # Print results
    print("=" * 80)
    print("AUDIT RESULTS")
    print("=" * 80)
    print(f"\nTotal issues audited: {len(issues)}")

    # Broken dependencies
    print(f"\n{'=' * 80}")
    print(f"BROKEN DEPENDENCIES ({len(broken_deps)} found)")
    print(f"{'=' * 80}")
    if broken_deps:
        for dep in broken_deps:
            print(f"  - {dep}")
    else:
        print("  None - All dependency links are valid!")

    # Missing priority labels
    print(f"\n{'=' * 80}")
    print(f"MISSING PRIORITY LABELS ({len(missing_priority)} found)")
    print(f"{'=' * 80}")
    if missing_priority:
        for issue in missing_priority:
            print(f"  - Issue #{issue['number']}: {issue['title']}")
            print(f"    Recommendation: Add MEDIUM label (default)")
    else:
        print("  None - All issues have priority labels!")

    # Multiple priority labels
    print(f"\n{'=' * 80}")
    print(f"MULTIPLE PRIORITY LABELS ({len(multiple_priority)} found)")
    print(f"{'=' * 80}")
    if multiple_priority:
        for issue in multiple_priority:
            print(f"  - Issue #{issue['number']}: {issue['title']}")
            print(f"    Has: {', '.join(issue['priorities'])}")
            print(f"    Recommendation: Keep highest priority, remove others")
    else:
        print("  None - All issues have exactly one priority label!")

    # Missing type labels
    print(f"\n{'=' * 80}")
    print(f"MISSING TYPE LABELS ({len(missing_type)} found)")
    print(f"{'=' * 80}")
    if missing_type:
        for issue in missing_type:
            print(f"  - Issue #{issue['number']}: {issue['title']}")
            print(f"    Needs: {issue['needed_type']} (based on title)")
            if issue['current_types']:
                print(f"    Currently has: {', '.join(issue['current_types'])}")
    else:
        print("  None - All issues have appropriate type labels!")

    print(f"\n{'=' * 80}")
    print("SUMMARY")
    print(f"{'=' * 80}")
    print(f"  Total issues: {len(issues)}")
    print(f"  Broken dependencies: {len(broken_deps)}")
    print(f"  Missing priority labels: {len(missing_priority)}")
    print(f"  Multiple priority labels: {len(multiple_priority)}")
    print(f"  Missing type labels: {len(missing_type)}")

    issues_with_problems = len(set([
        *[int(dep.split('#')[1].split()[0]) for dep in broken_deps],
        *[issue['number'] for issue in missing_priority],
        *[issue['number'] for issue in multiple_priority],
        *[issue['number'] for issue in missing_type]
    ]))

    print(f"  Issues with problems: {issues_with_problems}")
    print(f"  Issues healthy: {len(issues) - issues_with_problems}")
    print(f"\n{'=' * 80}")

if __name__ == '__main__':
    try:
        audit_issues()
    except KeyboardInterrupt:
        print("\n\nAudit interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nError during audit: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
