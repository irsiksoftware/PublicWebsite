#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Maria Hill Backlog Coordinator
Audit and fix backlog health - dependencies, labels, proper tagging
"""
import subprocess
import json
import sys
import re
import io

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def run_gh_command(cmd):
    """Run gh CLI command and return output"""
    full_cmd = f'gh {cmd}'
    result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, encoding='utf-8')
    return result.stdout.strip(), result.stderr.strip(), result.returncode

def get_all_open_issues():
    """Fetch all open issues with metadata via API"""
    print("[*] Fetching all open issues via GitHub API...")

    # Use gh api to get proper JSON
    stdout, stderr, code = run_gh_command('api repos/:owner/:repo/issues?state=open --paginate')

    if code != 0:
        print(f"[!] Error fetching issues: {stderr}")
        return []

    try:
        all_issues = json.loads(stdout)

        # Filter out pull requests (they show up in issues endpoint)
        issues = [issue for issue in all_issues if 'pull_request' not in issue]

        print(f"[+] Found {len(issues)} open issues")
        return issues
    except json.JSONDecodeError as e:
        print(f"[!] Failed to parse JSON: {e}")
        print(f"Raw output: {stdout[:500]}")
        return []

def extract_dependency_labels(labels):
    """Extract dependency labels (d1, d2, d3, etc.)"""
    dep_pattern = re.compile(r'^d(\d+)$')
    dependencies = []
    for label in labels:
        # Handle both dict (API) and string formats
        label_name = label.get('name', '') if isinstance(label, dict) else str(label)
        match = dep_pattern.match(label_name)
        if match:
            dep_num = int(match.group(1))
            dependencies.append({'label': label_name, 'issue_num': dep_num})
    return dependencies

def verify_issue_exists(issue_num):
    """Check if an issue exists via API"""
    stdout, stderr, code = run_gh_command(f'api repos/:owner/:repo/issues/{issue_num}')

    if 'Could not resolve' in stderr or 'Not Found' in stderr or code != 0:
        return False

    try:
        data = json.loads(stdout)
        return data.get('number') == issue_num
    except:
        return False

def get_priority_labels(labels):
    """Get all priority labels from issue"""
    priorities = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']
    found = []
    for label in labels:
        label_name = label.get('name', '') if isinstance(label, dict) else str(label)
        if label_name in priorities:
            found.append(label_name)
    return found

def get_type_labels(labels):
    """Get type labels (testing, bug, feature)"""
    types = ['testing', 'bug', 'feature']
    found = []
    for label in labels:
        label_name = label.get('name', '') if isinstance(label, dict) else str(label)
        if label_name in types:
            found.append(label_name)
    return found

def determine_type_from_title(title):
    """Determine type label from title keywords"""
    title_lower = title.lower()

    if any(word in title_lower for word in ['test', 'testing']):
        return 'testing'
    elif any(word in title_lower for word in ['bug', 'fix', 'error']):
        return 'bug'
    elif any(word in title_lower for word in ['feature', 'add', 'create', 'implement', 'build', 'design']):
        return 'feature'

    return None

def audit_phase():
    """Phase 1: Audit all issues"""
    print("\n" + "="*60)
    print("PHASE 1: AUDIT")
    print("="*60)

    issues = get_all_open_issues()
    if not issues:
        return None

    audit_results = {
        'total_issues': len(issues),
        'broken_dependencies': [],
        'missing_priority': [],
        'multiple_priorities': [],
        'missing_type': [],
        'all_issues': []
    }

    for issue in issues:
        issue_num = issue['number']
        title = issue['title']
        labels = issue.get('labels', [])

        issue_audit = {
            'number': issue_num,
            'title': title,
            'labels': [l.get('name', '') if isinstance(l, dict) else str(l) for l in labels],
            'problems': []
        }

        # Check dependencies
        dependencies = extract_dependency_labels(labels)
        for dep in dependencies:
            dep_num = dep['issue_num']
            dep_label = dep['label']
            print(f"  Checking issue #{issue_num} dependency: {dep_label} -> #{dep_num}...")

            if not verify_issue_exists(dep_num):
                print(f"    [!] BROKEN: #{dep_num} does not exist")
                audit_results['broken_dependencies'].append({
                    'issue': issue_num,
                    'title': title,
                    'dep_label': dep_label,
                    'dep_num': dep_num
                })
                issue_audit['problems'].append(f"Broken dependency: {dep_label} -> #{dep_num}")
            else:
                print(f"    [+] Valid")

        # Check priority labels
        priority_labels = get_priority_labels(labels)
        if len(priority_labels) == 0:
            audit_results['missing_priority'].append({
                'issue': issue_num,
                'title': title
            })
            issue_audit['problems'].append("Missing priority label")
        elif len(priority_labels) > 1:
            audit_results['multiple_priorities'].append({
                'issue': issue_num,
                'title': title,
                'priorities': priority_labels
            })
            issue_audit['problems'].append(f"Multiple priorities: {', '.join(priority_labels)}")

        # Check type labels
        type_labels = get_type_labels(labels)
        expected_type = determine_type_from_title(title)
        if expected_type and expected_type not in type_labels:
            audit_results['missing_type'].append({
                'issue': issue_num,
                'title': title,
                'expected_type': expected_type
            })
            issue_audit['problems'].append(f"Missing type label: {expected_type}")

        audit_results['all_issues'].append(issue_audit)

    # Print audit summary
    print("\n" + "="*60)
    print("AUDIT RESULTS")
    print("="*60)
    print(f"Total issues audited: {audit_results['total_issues']}")
    print(f"Broken dependencies: {len(audit_results['broken_dependencies'])}")
    print(f"Missing priority labels: {len(audit_results['missing_priority'])}")
    print(f"Multiple priority labels: {len(audit_results['multiple_priorities'])}")
    print(f"Missing type labels: {len(audit_results['missing_type'])}")

    if audit_results['broken_dependencies']:
        print("\n🚨 BROKEN DEPENDENCIES:")
        for item in audit_results['broken_dependencies']:
            print(f"  Issue #{item['issue']}: {item['title']}")
            print(f"    → Depends on non-existent #{item['dep_num']} ({item['dep_label']})")

    if audit_results['missing_priority']:
        print("\n⚠️  MISSING PRIORITY LABELS:")
        for item in audit_results['missing_priority'][:10]:  # Show first 10
            print(f"  Issue #{item['issue']}: {item['title']}")
        if len(audit_results['missing_priority']) > 10:
            print(f"  ... and {len(audit_results['missing_priority']) - 10} more")

    if audit_results['multiple_priorities']:
        print("\n⚠️  MULTIPLE PRIORITY LABELS:")
        for item in audit_results['multiple_priorities']:
            print(f"  Issue #{item['issue']}: {item['title']}")
            print(f"    → Has: {', '.join(item['priorities'])}")

    if audit_results['missing_type']:
        print("\n⚠️  MISSING TYPE LABELS:")
        for item in audit_results['missing_type'][:10]:  # Show first 10
            print(f"  Issue #{item['issue']}: {item['title']}")
            print(f"    → Should have: {item['expected_type']}")
        if len(audit_results['missing_type']) > 10:
            print(f"  ... and {len(audit_results['missing_type']) - 10} more")

    # Save audit results
    with open('maria_hill_audit_results.json', 'w') as f:
        json.dump(audit_results, f, indent=2)

    print("\n✓ Audit results saved to maria_hill_audit_results.json")

    return audit_results

def fix_phase(audit_results):
    """Phase 2: Fix all problems"""
    print("\n" + "="*60)
    print("PHASE 2: FIX")
    print("="*60)

    fix_results = {
        'dependencies_removed': 0,
        'placeholders_created': 0,
        'priority_labels_added': 0,
        'type_labels_added': 0,
        'duplicate_priorities_removed': 0,
        'actions': []
    }

    # Fix broken dependencies
    if audit_results['broken_dependencies']:
        print("\n🔧 Fixing broken dependencies...")
        for item in audit_results['broken_dependencies']:
            issue_num = item['issue']
            dep_num = item['dep_num']
            dep_label = item['dep_label']

            # Decision logic: if dep_num > 100, likely deleted/invalid
            if dep_num > 100:
                print(f"  Issue #{issue_num}: Removing invalid dependency label {dep_label}")
                stdout, stderr, code = run_gh_command(f'issue edit {issue_num} --remove-label {dep_label}')
                if code == 0:
                    print(f"    ✓ Removed label {dep_label}")
                    fix_results['dependencies_removed'] += 1
                    fix_results['actions'].append(f"Issue #{issue_num}: Removed broken dependency {dep_label}")
                else:
                    print(f"    ❌ Failed: {stderr}")
            else:
                print(f"  Issue #{issue_num}: Dependency #{dep_num} < 100, may need placeholder (manual review)")
                fix_results['actions'].append(f"Issue #{issue_num}: Dependency #{dep_num} needs manual review")

    # Fix missing priority labels
    if audit_results['missing_priority']:
        print("\n🔧 Adding missing priority labels (default: MEDIUM)...")
        for item in audit_results['missing_priority']:
            issue_num = item['issue']
            print(f"  Issue #{issue_num}: Adding MEDIUM label")
            stdout, stderr, code = run_gh_command(f'issue edit {issue_num} --add-label MEDIUM')
            if code == 0:
                print(f"    ✓ Added MEDIUM label")
                fix_results['priority_labels_added'] += 1
                fix_results['actions'].append(f"Issue #{issue_num}: Added MEDIUM priority label")
            else:
                print(f"    ❌ Failed: {stderr}")

    # Fix multiple priorities
    if audit_results['multiple_priorities']:
        print("\n🔧 Fixing multiple priority labels (keeping highest)...")
        priority_order = {'CRITICAL': 5, 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}

        for item in audit_results['multiple_priorities']:
            issue_num = item['issue']
            priorities = item['priorities']

            # Find highest priority
            highest = max(priorities, key=lambda p: priority_order.get(p, 0))
            to_remove = [p for p in priorities if p != highest]

            print(f"  Issue #{issue_num}: Keeping {highest}, removing {', '.join(to_remove)}")
            for label in to_remove:
                stdout, stderr, code = run_gh_command(f'issue edit {issue_num} --remove-label {label}')
                if code == 0:
                    print(f"    ✓ Removed {label}")
                    fix_results['duplicate_priorities_removed'] += 1
                    fix_results['actions'].append(f"Issue #{issue_num}: Removed duplicate priority {label}")
                else:
                    print(f"    ❌ Failed to remove {label}: {stderr}")

    # Fix missing type labels
    if audit_results['missing_type']:
        print("\n🔧 Adding missing type labels...")
        for item in audit_results['missing_type']:
            issue_num = item['issue']
            expected_type = item['expected_type']
            print(f"  Issue #{issue_num}: Adding {expected_type} label")
            stdout, stderr, code = run_gh_command(f'issue edit {issue_num} --add-label {expected_type}')
            if code == 0:
                print(f"    ✓ Added {expected_type} label")
                fix_results['type_labels_added'] += 1
                fix_results['actions'].append(f"Issue #{issue_num}: Added {expected_type} label")
            else:
                print(f"    ❌ Failed: {stderr}")

    # Save fix results
    with open('maria_hill_fix_results.json', 'w') as f:
        json.dump(fix_results, f, indent=2)

    print("\n✓ Fix results saved to maria_hill_fix_results.json")

    return fix_results

def verify_phase():
    """Phase 3: Re-audit to verify fixes"""
    print("\n" + "="*60)
    print("PHASE 3: VERIFY")
    print("="*60)

    return audit_phase()

def main():
    print("="*60)
    print("        MARIA HILL - BACKLOG COORDINATOR                   ")
    print("        Mission: Ensure all issues are workable            ")
    print("="*60)

    # Phase 1: Audit
    audit_results = audit_phase()
    if not audit_results:
        print("❌ Audit failed - cannot proceed")
        return 1

    # Check if fixes are needed
    needs_fixing = (
        len(audit_results['broken_dependencies']) > 0 or
        len(audit_results['missing_priority']) > 0 or
        len(audit_results['multiple_priorities']) > 0 or
        len(audit_results['missing_type']) > 0
    )

    if not needs_fixing:
        print("\n✅ BACKLOG HEALTH: EXCELLENT - No fixes needed!")
        print("✅ Swarm is UNBLOCKED and ready for action")
        return 0

    # Phase 2: Fix
    fix_results = fix_phase(audit_results)

    # Phase 3: Verify
    print("\n🔍 Re-auditing to verify fixes...")
    verify_results = verify_phase()

    # Final summary
    print("\n" + "="*60)
    print("FINAL SUMMARY")
    print("="*60)
    print(f"✓ Fixed {fix_results['dependencies_removed']} broken dependencies")
    print(f"✓ Created {fix_results['placeholders_created']} placeholder issues")
    print(f"✓ Added {fix_results['priority_labels_added']} missing priority labels")
    print(f"✓ Added {fix_results['type_labels_added']} missing type labels")
    print(f"✓ Removed {fix_results['duplicate_priorities_removed']} duplicate priority labels")

    # Check final health
    remaining_issues = (
        len(verify_results.get('broken_dependencies', [])) +
        len(verify_results.get('missing_priority', [])) +
        len(verify_results.get('multiple_priorities', [])) +
        len(verify_results.get('missing_type', []))
    )

    if remaining_issues == 0:
        print("\n✅ BACKLOG HEALTH: EXCELLENT")
        print("✅ Swarm is UNBLOCKED and ready for action")
    else:
        print(f"\n⚠️  BACKLOG HEALTH: {remaining_issues} issues remain")
        print("⚠️  Some issues may need HUMAN INTERVENTION")

    # Save final report
    final_report = {
        'initial_audit': audit_results,
        'fixes_applied': fix_results,
        'verification': verify_results,
        'status': 'UNBLOCKED' if remaining_issues == 0 else 'NEEDS_ATTENTION'
    }

    with open('MARIA_HILL_BACKLOG_REPORT.json', 'w') as f:
        json.dump(final_report, f, indent=2)

    print("\n✓ Final report saved to MARIA_HILL_BACKLOG_REPORT.json")

    return 0

if __name__ == '__main__':
    sys.exit(main())

