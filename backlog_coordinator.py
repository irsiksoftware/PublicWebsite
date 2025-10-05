#!/usr/bin/env python3
import subprocess
import json
import re
import sys

# Fetch all open issues
def fetch_issues():
    try:
        gh_path = r'C:\Program Files\GitHub CLI\gh.bat'
        result = subprocess.run(
            [gh_path, 'issue', 'list', '--state', 'open', '--json', 'number,title,labels,state', '--limit', '1000'],
            capture_output=True,
            text=True,
            check=True
        )
        # Debug output
        if not result.stdout.strip():
            print(f"Error: Empty output from gh command")
            print(f"stderr: {result.stderr}")
            sys.exit(1)
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error fetching issues: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        print(f"Output was: {result.stdout[:500]}")
        sys.exit(1)

# Check if an issue exists
def check_issue_exists(issue_number):
    try:
        gh_path = r'C:\Program Files\GitHub CLI\gh.bat'
        result = subprocess.run(
            [gh_path, 'issue', 'view', str(issue_number), '--json', 'number,state'],
            capture_output=True,
            text=True,
            check=False
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

    # Save audit results
    results = {
        'broken_deps': broken_deps,
        'missing_priority': missing_priority,
        'multiple_priority': multiple_priority,
        'missing_type': missing_type
    }

    with open('backlog_audit_results_full.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n=== AUDIT SUMMARY ===")
    print(f"Total Issues Audited: {len(issues)}")
    print(f"Broken Dependencies: {len(broken_deps)}")
    print(f"Missing Priority: {len(missing_priority)}")
    print(f"Multiple Priority: {len(multiple_priority)}")
    print(f"Missing Type Labels: {len(missing_type)}")

    # FIX PHASE
    print(f"\n=== FIX PHASE ===\n")

    fixed_deps = 0
    created_placeholders = 0
    fixed_priority = 0
    fixed_multi_priority = 0
    fixed_type = 0

    # Fix broken dependencies
    gh_path = r'C:\Program Files\GitHub CLI\gh.bat'
    print(f"Fixing {len(broken_deps)} broken dependencies...")
    for issue_num, dep_num, title in broken_deps:
        if dep_num > 100:
            # Likely deleted/invalid - remove dependency label
            print(f"  Removing d{dep_num} from #{issue_num} (dependency > 100)...")
            result = subprocess.run(
                [gh_path, 'issue', 'edit', str(issue_num), '--remove-label', f'd{dep_num}'],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                print(f"    ✓ Removed d{dep_num}")
                fixed_deps += 1
            else:
                print(f"    ✗ Failed: {result.stderr}")
        else:
            # Create placeholder issue
            print(f"  Creating placeholder for dependency #{dep_num}...")
            placeholder_title = f"Placeholder: Dependency for #{issue_num}"
            placeholder_body = f"Auto-created dependency placeholder.\n\nRequired by: #{issue_num} - {title}"
            result = subprocess.run(
                [gh_path, 'issue', 'create', '--title', placeholder_title, '--body', placeholder_body, '--label', 'MEDIUM'],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                print(f"    ✓ Created placeholder")
                created_placeholders += 1
                fixed_deps += 1
            else:
                print(f"    ✗ Failed: {result.stderr}")

    # Fix missing priority labels
    print(f"\nAdding MEDIUM label to {len(missing_priority)} issues...")
    for num, title in missing_priority:
        result = subprocess.run(
            [gh_path, 'issue', 'edit', str(num), '--add-label', 'MEDIUM'],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print(f"  ✓ #{num}")
            fixed_priority += 1
        else:
            print(f"  ✗ #{num}: {result.stderr}")

    # Fix multiple priority labels
    print(f"\nFixing {len(multiple_priority)} issues with multiple priorities...")
    priority_order = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']
    for num, priorities, title in multiple_priority:
        # Keep highest priority
        highest = None
        for p in priority_order:
            if p in priorities:
                highest = p
                break

        # Remove others
        for p in priorities:
            if p != highest:
                result = subprocess.run(
                    [gh_path, 'issue', 'edit', str(num), '--remove-label', p],
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0:
                    print(f"  ✓ #{num}: Removed {p} (keeping {highest})")
                    fixed_multi_priority += 1
                else:
                    print(f"  ✗ #{num}: {result.stderr}")

    # Fix missing type labels
    print(f"\nAdding missing type labels to {len(missing_type)} issues...")
    for num, type_issues, title in missing_type:
        for label_name, action in type_issues:
            result = subprocess.run(
                [gh_path, 'issue', 'edit', str(num), '--add-label', label_name],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                print(f"  ✓ #{num}: Added {label_name}")
                fixed_type += 1
            else:
                print(f"  ✗ #{num}: {result.stderr}")

    # VERIFY PHASE
    print(f"\n=== VERIFY PHASE ===\n")
    print("Re-running audit to verify fixes...")

    issues_verify = fetch_issues()
    broken_deps_verify = []
    missing_priority_verify = []
    multiple_priority_verify = []
    missing_type_verify = []

    for issue in issues_verify:
        num = issue['number']
        title = issue['title']
        labels = issue.get('labels', [])

        deps = extract_dependencies(labels)
        for dep in deps:
            if not check_issue_exists(dep):
                broken_deps_verify.append((num, dep, title))

        priority_labels = get_priority_labels(labels)
        if len(priority_labels) == 0:
            missing_priority_verify.append((num, title))
        elif len(priority_labels) > 1:
            multiple_priority_verify.append((num, priority_labels, title))

        type_issues = check_type_labels(title, labels)
        if type_issues:
            missing_type_verify.append((num, type_issues, title))

    print(f"\nVerification Results:")
    print(f"  Broken Dependencies: {len(broken_deps_verify)}")
    print(f"  Missing Priority: {len(missing_priority_verify)}")
    print(f"  Multiple Priority: {len(multiple_priority_verify)}")
    print(f"  Missing Type Labels: {len(missing_type_verify)}")

    # FINAL SUMMARY
    print(f"\n=== FINAL SUMMARY ===")
    print(f"\nFixed Issues:")
    print(f"  - Fixed broken dependencies: {fixed_deps}")
    print(f"  - Created placeholder issues: {created_placeholders}")
    print(f"  - Added missing priority labels: {fixed_priority}")
    print(f"  - Fixed multiple priority labels: {fixed_multi_priority}")
    print(f"  - Added missing type labels: {fixed_type}")

    total_remaining = (len(broken_deps_verify) + len(missing_priority_verify) +
                      len(multiple_priority_verify) + len(missing_type_verify))

    print(f"\nBacklog Health: ", end="")
    if total_remaining == 0:
        print("✅ EXCELLENT - All issues resolved")
        print("Swarm Status: 🚀 UNBLOCKED")
    else:
        print("⚠️  NEEDS ATTENTION")
        print("Swarm Status: 🔴 REQUIRES HUMAN INTERVENTION")
        print(f"\nRemaining issues: {total_remaining}")

    print("\n=== MISSION COMPLETE ===")
    print("Backlog Coordinator (Maria Hill) - Signing off.")

if __name__ == '__main__':
    main()
