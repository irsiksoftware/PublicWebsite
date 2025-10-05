#!/usr/bin/env python3
"""Backlog Health Audit and Fix Script - Maria Hill Protocol"""

import subprocess
import json
import re

GH_CLI = "C:/Program Files/GitHub CLI/gh-real.exe"

# Priority labels in order from highest to lowest
PRIORITY_LABELS = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']

# Type keywords mapping
TYPE_KEYWORDS = {
    'testing': ['test', 'testing'],
    'bug': ['bug', 'fix', 'error'],
    'feature': ['feature', 'add', 'create', 'implement', 'build', 'design']
}

def run_command(cmd):
    """Run command and return output"""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            shell=True
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except Exception as e:
        return "", str(e), 1

def load_issues_from_file():
    """Load issues from the API JSON file"""
    with open('issues_final.json', 'r', encoding='utf-8') as f:
        issues = json.load(f)
    # Filter out PRs
    issues = [i for i in issues if 'pull_request' not in i]
    return issues

def check_issue_exists(issue_num):
    """Check if an issue exists"""
    cmd = f'"{GH_CLI}" api repos/:owner/:repo/issues/{issue_num}'
    stdout, stderr, code = run_command(cmd)

    if 'Not Found' in stderr or code != 0:
        return False
    return True

def extract_dependency_labels(labels):
    """Extract dependency labels (d1, d2, d3, etc)"""
    deps = []
    for label in labels:
        label_name = label.get('name', '')
        if re.match(r'^d\d+$', label_name):
            deps.append(label_name)
    return deps

def get_priority_labels(labels):
    """Get all priority labels from issue"""
    priorities = []
    for label in labels:
        label_name = label.get('name', '')
        if label_name in PRIORITY_LABELS:
            priorities.append(label_name)
    return priorities

def get_type_labels(labels):
    """Get all type labels from issue"""
    types = []
    for label in labels:
        label_name = label.get('name', '')
        if label_name in TYPE_KEYWORDS.keys():
            types.append(label_name)
    return types

def detect_missing_type_label(title, current_types):
    """Detect if title suggests a missing type label"""
    title_lower = title.lower()
    for type_label, keywords in TYPE_KEYWORDS.items():
        if type_label not in current_types:
            for keyword in keywords:
                if keyword in title_lower:
                    return type_label
    return None

def add_label(issue_num, label):
    """Add label to issue"""
    cmd = f'"{GH_CLI}" issue edit {issue_num} --add-label {label}'
    stdout, stderr, code = run_command(cmd)
    if code == 0:
        print(f"  [+] Added '{label}' to #{issue_num}")
        return True
    else:
        print(f"  [X] Failed to add '{label}' to #{issue_num}: {stderr}")
        return False

def remove_label(issue_num, label):
    """Remove label from issue"""
    cmd = f'"{GH_CLI}" issue edit {issue_num} --remove-label {label}'
    stdout, stderr, code = run_command(cmd)
    if code == 0:
        print(f"  [-] Removed '{label}' from #{issue_num}")
        return True
    else:
        print(f"  [X] Failed to remove '{label}' from #{issue_num}: {stderr}")
        return False

def audit_and_fix():
    """Main audit and fix function"""
    print("=" * 80)
    print("BACKLOG HEALTH AUDIT & FIX - MARIA HILL PROTOCOL")
    print("=" * 80)

    issues = load_issues_from_file()
    print(f"\nTotal open issues: {len(issues)}\n")

    print("=" * 80)
    print("PHASE 1: AUDITING")
    print("=" * 80 + "\n")

    # Track problems
    broken_deps = []
    missing_priority = []
    multiple_priority = []
    missing_type = []

    for issue in issues:
        num = issue['number']
        title = issue['title']
        labels = issue.get('labels', [])

        # Extract dependency labels
        dep_labels = extract_dependency_labels(labels)

        # Check each dependency
        for dep_label in dep_labels:
            dep_num = int(dep_label[1:])  # Remove 'd' prefix
            exists = check_issue_exists(dep_num)
            if not exists:
                broken_deps.append({
                    'issue': num,
                    'title': title,
                    'missing_dep': dep_num,
                    'dep_label': dep_label
                })
                print(f"[X] Issue #{num} depends on non-existent #{dep_num}")

        # Check priority labels
        priorities = get_priority_labels(labels)
        if len(priorities) == 0:
            missing_priority.append({
                'issue': num,
                'title': title
            })
            print(f"[!] Issue #{num} has NO priority label")
        elif len(priorities) > 1:
            multiple_priority.append({
                'issue': num,
                'title': title,
                'priorities': priorities
            })
            print(f"[!] Issue #{num} has MULTIPLE priorities: {priorities}")

        # Check type labels
        types = get_type_labels(labels)
        suggested_type = detect_missing_type_label(title, types)
        if suggested_type:
            missing_type.append({
                'issue': num,
                'title': title,
                'suggested_type': suggested_type
            })
            print(f"[i] Issue #{num} may need '{suggested_type}' label")

    # Audit Summary
    print("\n" + "=" * 80)
    print("AUDIT SUMMARY")
    print("=" * 80)
    print(f"Broken dependencies: {len(broken_deps)}")
    print(f"Missing priority labels: {len(missing_priority)}")
    print(f"Multiple priority labels: {len(multiple_priority)}")
    print(f"Suggested type labels: {len(missing_type)}")

    # PHASE 2: FIX
    print("\n" + "=" * 80)
    print("PHASE 2: FIXING")
    print("=" * 80 + "\n")

    fixes_applied = {
        'broken_deps_fixed': 0,
        'priority_added': 0,
        'priority_cleaned': 0,
        'type_added': 0
    }

    # Fix broken dependencies
    if broken_deps:
        print(f"Fixing {len(broken_deps)} broken dependencies...\n")
        for item in broken_deps:
            issue_num = item['issue']
            dep_num = item['missing_dep']
            dep_label = item['dep_label']

            print(f"Issue #{issue_num}: depends on non-existent #{dep_num}")
            # Apply decision logic: if dep > 100, likely deleted, remove label
            if dep_num > 100:
                print(f"  Dependency #{dep_num} > 100, likely deleted/invalid - removing label")
                if remove_label(issue_num, dep_label):
                    fixes_applied['broken_deps_fixed'] += 1
            else:
                print(f"  Dependency #{dep_num} < 100, may be needed - MANUAL REVIEW REQUIRED")
                print(f"    (Skipping automatic fix for safety)")

    # Fix missing priority labels
    if missing_priority:
        print(f"\nAdding MEDIUM priority to {len(missing_priority)} issues...\n")
        for item in missing_priority:
            issue_num = item['issue']
            print(f"Issue #{issue_num}: Adding default MEDIUM priority")
            if add_label(issue_num, 'MEDIUM'):
                fixes_applied['priority_added'] += 1

    # Fix multiple priority labels
    if multiple_priority:
        print(f"\nCleaning up {len(multiple_priority)} issues with multiple priorities...\n")
        for item in multiple_priority:
            issue_num = item['issue']
            priorities = item['priorities']
            # Keep highest priority
            highest = None
            for p in PRIORITY_LABELS:
                if p in priorities:
                    highest = p
                    break

            print(f"Issue #{issue_num}: Keeping {highest}, removing others")
            for p in priorities:
                if p != highest:
                    if remove_label(issue_num, p):
                        fixes_applied['priority_cleaned'] += 1

    # Fix missing type labels
    if missing_type:
        print(f"\nAdding suggested type labels to {len(missing_type)} issues...\n")
        for item in missing_type:
            issue_num = item['issue']
            suggested = item['suggested_type']
            print(f"Issue #{issue_num}: Adding '{suggested}' label")
            if add_label(issue_num, suggested):
                fixes_applied['type_added'] += 1

    # Final Summary
    print("\n" + "=" * 80)
    print("FIX SUMMARY")
    print("=" * 80)
    print(f"Broken dependencies fixed: {fixes_applied['broken_deps_fixed']}")
    print(f"Priority labels added: {fixes_applied['priority_added']}")
    print(f"Duplicate priorities removed: {fixes_applied['priority_cleaned']}")
    print(f"Type labels added: {fixes_applied['type_added']}")

    # Save results
    results = {
        'audit': {
            'broken_deps': broken_deps,
            'missing_priority': missing_priority,
            'multiple_priority': multiple_priority,
            'missing_type': missing_type
        },
        'fixes': fixes_applied
    }

    with open('backlog_fix_results.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n[OK] Results saved to: backlog_fix_results.json")

    # Determine status
    total_issues = len(broken_deps) + len(missing_priority) + len(multiple_priority)
    fixed_issues = sum(fixes_applied.values())

    print("\n" + "=" * 80)
    if total_issues == 0:
        print("BACKLOG STATUS: [OK] HEALTHY - No critical issues found")
        print("SWARM STATUS: [OK] UNBLOCKED")
    elif fixed_issues == total_issues:
        print("BACKLOG STATUS: [OK] FIXED - All issues resolved")
        print("SWARM STATUS: [OK] UNBLOCKED")
    else:
        remaining = total_issues - fixed_issues
        print(f"BACKLOG STATUS: [!] PARTIAL - {remaining} issues need manual review")
        print("SWARM STATUS: [!] MANUAL INTERVENTION NEEDED")
    print("=" * 80 + "\n")

if __name__ == '__main__':
    audit_and_fix()
