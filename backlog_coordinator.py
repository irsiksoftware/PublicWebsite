#!/usr/bin/env python3
import subprocess
import json
import re
import sys

# Fetch all open issues
def fetch_issues():
    try:
        result = subprocess.run(
            'gh issue list --state open --json number,title,labels,state --limit 1000',
            capture_output=True,
            text=True,
            check=True,
            shell=True
        )
        # Debug output
        if not result.stdout.strip():
            print(f"Error: Empty output from gh command")
            print(f"stderr: {result.stderr}")
            sys.exit(1)
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error fetching issues: {e}")
        sys.exit(1)

# Check if an issue exists
def check_issue_exists(issue_number):
    try:
        result = subprocess.run(
            f'gh issue view {issue_number} --json number,state',
            capture_output=True,
            text=True,
            check=False,
            shell=True
        )
        if result.returncode != 0:
            return False
        data = json.loads(result.stdout)
        return True
    except:
        return False

# Extract dependency numbers from labels
def extract_dependencies(labels):
    deps = []
    for label in labels:
        name = label.get('name', '')
        # Match d1, d2, d3, etc.
        match = re.match(r'^d(\d+)$', name)
        if match:
            deps.append(int(match.group(1)))
    return deps

# Extract priority labels
def get_priority_labels(labels):
    priorities = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']
    found = []
    for label in labels:
        name = label.get('name', '')
        if name.upper() in priorities:
            found.append(name.upper())
    return found

# Check for type labels
def check_type_labels(title, labels):
    label_names = [l.get('name', '').lower() for l in labels]
    issues = []

    title_lower = title.lower()

    # Check for testing
    if any(word in title_lower for word in ['test', 'testing']):
        if 'testing' not in label_names:
            issues.append(('testing', 'add'))

    # Check for bug
    if any(word in title_lower for word in ['bug', 'fix', 'error']):
        if 'bug' not in label_names:
            issues.append(('bug', 'add'))

    # Check for feature
    if any(word in title_lower for word in ['feature', 'add', 'create', 'implement', 'build', 'design']):
        if 'feature' not in label_names:
            issues.append(('feature', 'add'))

    return issues

# Main audit
def main():
    print("=== BACKLOG AUDIT PHASE ===\n")

    issues = fetch_issues()
    print(f"Found {len(issues)} open issues\n")

    broken_deps = []
    missing_priority = []
    multiple_priority = []
    missing_type = []

    # Audit each issue
    for issue in issues:
        num = issue['number']
        title = issue['title']
        labels = issue.get('labels', [])

        # Check dependencies
        deps = extract_dependencies(labels)
        for dep in deps:
            if not check_issue_exists(dep):
                broken_deps.append((num, dep, title))

        # Check priority labels
        priority_labels = get_priority_labels(labels)
        if len(priority_labels) == 0:
            missing_priority.append((num, title))
        elif len(priority_labels) > 1:
            multiple_priority.append((num, priority_labels, title))

        # Check type labels
        type_issues = check_type_labels(title, labels)
        if type_issues:
            missing_type.append((num, type_issues, title))

    # Report findings
    print("=== AUDIT RESULTS ===\n")

    print(f"Broken Dependencies: {len(broken_deps)}")
    for issue_num, dep_num, title in broken_deps:
        print(f"  Issue #{issue_num} depends on non-existent #{dep_num}")
        print(f"    Title: {title}")
    print()

    print(f"Missing Priority Labels: {len(missing_priority)}")
    for num, title in missing_priority:
        print(f"  Issue #{num}: {title}")
    print()

    print(f"Multiple Priority Labels: {len(multiple_priority)}")
    for num, priorities, title in multiple_priority:
        print(f"  Issue #{num} has: {', '.join(priorities)}")
        print(f"    Title: {title}")
    print()

    print(f"Missing Type Labels: {len(missing_type)}")
    for num, type_issues, title in missing_type:
        labels_to_add = [t[0] for t in type_issues]
        print(f"  Issue #{num} needs: {', '.join(labels_to_add)}")
        print(f"    Title: {title}")
    print()

    # Save results
    results = {
        'broken_deps': broken_deps,
        'missing_priority': missing_priority,
        'multiple_priority': multiple_priority,
        'missing_type': missing_type
    }

    with open('backlog_audit_results_full.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n=== SUMMARY ===")
    print(f"Total Issues Audited: {len(issues)}")
    print(f"Broken Dependencies: {len(broken_deps)}")
    print(f"Missing Priority: {len(missing_priority)}")
    print(f"Multiple Priority: {len(multiple_priority)}")
    print(f"Missing Type Labels: {len(missing_type)}")
    print(f"\nResults saved to backlog_audit_results_full.json")

if __name__ == '__main__':
    main()
