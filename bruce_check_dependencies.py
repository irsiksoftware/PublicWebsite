#!/usr/bin/env python3
"""Bruce Banner - Check PR #168 Dependencies"""

import subprocess
import json
import sys
import re

def run_gh_command(cmd):
    """Run a gh command and parse JSON output"""
    try:
        result = subprocess.run(
            f'gh {cmd}',
            shell=True,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )

        if result.returncode != 0:
            print(f"Command failed: {result.stderr}", file=sys.stderr)
            return None

        # Try to parse as JSON
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError:
            # Return raw output if not JSON
            return result.stdout.strip()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return None

def check_issue_exists(issue_num):
    """Check if an issue exists and get its status"""
    print(f"Checking issue #{issue_num}...")

    # Try to get issue details
    data = run_gh_command(f'issue view {issue_num} --json number,title,state,labels')

    if data is None or isinstance(data, str):
        # Issue might not exist, check in closed issues
        print(f"Issue #{issue_num} not found or inaccessible")
        return None

    return data

def main():
    print("="*60)
    print("BRUCE BANNER PR #168 DEPENDENCY CHECK")
    print("="*60)

    # Check PR #168
    print("\n1. Checking PR #168...")
    pr_data = run_gh_command('pr view 168 --json number,title,body,state,statusCheckRollup')

    if not pr_data:
        print("ERROR: Could not fetch PR #168", file=sys.stderr)
        sys.exit(1)

    print(f"   PR #168: {pr_data.get('title')}")
    print(f"   State: {pr_data.get('state')}")

    # Extract issue number from PR body/title
    body = pr_data.get('body', '') or ''
    title = pr_data.get('title', '') or ''

    # Find issue reference
    issue_match = re.search(r'#(\d+)', title + ' ' + body)
    if issue_match:
        linked_issue = int(issue_match.group(1))
        print(f"   Linked to issue #{linked_issue}")
    else:
        print("   No linked issue found")
        linked_issue = None

    # Check issue #97 (from PR title)
    print("\n2. Checking issue #97...")
    issue97_data = run_gh_command('issue view 97 --json number,title,state,labels,body')

    if not issue97_data:
        print("ERROR: Could not fetch issue #97", file=sys.stderr)
        sys.exit(1)

    print(f"   Issue #97: {issue97_data.get('title')}")
    print(f"   State: {issue97_data.get('state')}")

    labels = issue97_data.get('labels', [])
    print(f"   Labels: {', '.join([l['name'] for l in labels])}")

    # Check for dependency labels (d1, d2, etc.)
    dep_labels = [l['name'] for l in labels if re.match(r'^d\d+$', l['name'])]

    if dep_labels:
        print(f"   Dependency labels found: {', '.join(dep_labels)}")
    else:
        print("   No dependency labels found")

    # Parse body for dependency information
    body = issue97_data.get('body', '') or ''
    dep_match = re.search(r'\*\*Depends on:\*\*\s*#(\d+)', body)

    dependencies = []
    if dep_match:
        dep_issue = int(dep_match.group(1))
        dependencies.append(dep_issue)
        print(f"   Dependency mentioned in body: #{dep_issue}")

    # Check all dependencies
    print("\n3. Checking dependencies...")
    all_deps_closed = True

    for dep in dependencies:
        dep_data = check_issue_exists(dep)

        if dep_data is None:
            print(f"   Issue #{dep}: NOT FOUND (may be deleted/closed)")
            # Assume deleted issues are resolved
            continue

        state = dep_data.get('state', 'UNKNOWN')
        print(f"   Issue #{dep}: {dep_data.get('title')} - State: {state}")

        if state != 'CLOSED':
            all_deps_closed = False
            print(f"   ⚠️  BLOCKER: Issue #{dep} is {state}")

    # Check CI status
    print("\n4. Checking CI status...")
    status_checks = pr_data.get('statusCheckRollup', [])

    if isinstance(status_checks, list):
        if len(status_checks) == 0:
            print("   No CI checks configured")
            ci_passed = True
        else:
            all_passed = all(check.get('conclusion') == 'SUCCESS' for check in status_checks)
            print(f"   Checks: {len(status_checks)} total")

            for check in status_checks:
                name = check.get('name', 'Unknown')
                conclusion = check.get('conclusion', 'UNKNOWN')
                print(f"     - {name}: {conclusion}")

            ci_passed = all_passed
    else:
        print("   CI status: Not available")
        ci_passed = True

    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"PR #168 State: {pr_data.get('state')}")
    print(f"Dependencies Closed: {'YES' if all_deps_closed else 'NO'}")
    print(f"CI Checks Passed: {'YES' if ci_passed else 'NO'}")

    can_merge = all_deps_closed and ci_passed and pr_data.get('state') == 'OPEN'
    print(f"\nCan Merge: {'YES ✅' if can_merge else 'NO ❌'}")

    if not all_deps_closed:
        print(f"\nBLOCKED: Waiting for dependencies: {', '.join([f'#{d}' for d in dependencies if check_issue_exists(d) and check_issue_exists(d).get('state') != 'CLOSED'])}")

    # Save results
    results = {
        'pr_number': 168,
        'pr_state': pr_data.get('state'),
        'linked_issue': linked_issue,
        'dependencies': dependencies,
        'all_deps_closed': all_deps_closed,
        'ci_passed': ci_passed,
        'can_merge': can_merge
    }

    with open('pr168_dependency_check.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)

    print("\nResults saved to pr168_dependency_check.json")

    sys.exit(0 if can_merge else 1)

if __name__ == '__main__':
    main()
