#!/usr/bin/env python3
"""Backlog Health Audit Script - Maria Hill Protocol"""

import subprocess
import json
import sys
import re

GH_CLI = "C:/Program Files/GitHub CLI/gh.bat"

# Priority labels in order from highest to lowest
PRIORITY_LABELS = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']

# Type keywords mapping
TYPE_KEYWORDS = {
    'testing': ['test', 'testing'],
    'bug': ['bug', 'fix', 'error'],
    'feature': ['feature', 'add', 'create', 'implement', 'build', 'design']
}

def run_gh_command(args):
    """Run gh CLI command and return output"""
    try:
        result = subprocess.run(
            [GH_CLI] + args,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except Exception as e:
        return "", str(e), 1

def get_all_issues():
    """Fetch all open issues with metadata"""
    stdout, stderr, code = run_gh_command([
        'issue', 'list',
        '--state', 'open',
        '--json', 'number,title,labels',
        '--limit', '1000'
    ])

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

def check_issue_exists(issue_num):
    """Check if an issue exists"""
    stdout, stderr, code = run_gh_command([
        'issue', 'view', str(issue_num),
        '--json', 'number,state'
    ])

    if 'Could not resolve' in stderr or code != 0:
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

def audit_issues():
    """Main audit function"""
    print("=" * 80)
    print("BACKLOG HEALTH AUDIT - MARIA HILL PROTOCOL")
    print("=" * 80)

    issues = get_all_issues()
    if not issues:
        print("No issues found or error fetching issues.")
        return

    print(f"\nTotal open issues: {len(issues)}")
    print("\n" + "=" * 80)
    print("PHASE 1: AUDITING")
    print("=" * 80)

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
            if not check_issue_exists(dep_num):
                broken_deps.append({
                    'issue': num,
                    'title': title,
                    'missing_dep': dep_num,
                    'dep_label': dep_label
                })
                print(f"❌ Issue #{num} depends on non-existent #{dep_num}")

        # Check priority labels
        priorities = get_priority_labels(labels)
        if len(priorities) == 0:
            missing_priority.append({
                'issue': num,
                'title': title
            })
            print(f"⚠️  Issue #{num} has NO priority label")
        elif len(priorities) > 1:
            multiple_priority.append({
                'issue': num,
                'title': title,
                'priorities': priorities
            })
            print(f"⚠️  Issue #{num} has MULTIPLE priority labels: {priorities}")

        # Check type labels
        types = get_type_labels(labels)
        suggested_type = detect_missing_type_label(title, types)
        if suggested_type:
            missing_type.append({
                'issue': num,
                'title': title,
                'suggested_type': suggested_type
            })
            print(f"ℹ️  Issue #{num} may need '{suggested_type}' label")

    # Summary
    print("\n" + "=" * 80)
    print("AUDIT SUMMARY")
    print("=" * 80)
    print(f"Broken dependencies: {len(broken_deps)}")
    print(f"Missing priority labels: {len(missing_priority)}")
    print(f"Multiple priority labels: {len(multiple_priority)}")
    print(f"Suggested type labels: {len(missing_type)}")

    # Store results
    results = {
        'broken_deps': broken_deps,
        'missing_priority': missing_priority,
        'multiple_priority': multiple_priority,
        'missing_type': missing_type
    }

    with open('backlog_audit_results.json', 'w') as f:
        json.dump(results, f, indent=2)

    print("\nResults saved to: backlog_audit_results.json")

    return results

if __name__ == '__main__':
    audit_issues()
