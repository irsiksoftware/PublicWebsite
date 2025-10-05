import subprocess
import json
import sys

def run_gh_command(args):
    """Run GitHub CLI command and return JSON output"""
    try:
        result = subprocess.run(
            ["C:\\Program Files\\GitHub CLI\\gh.bat"] + args,
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout)
        return None
    except Exception as e:
        print(f"Error running gh command: {e}", file=sys.stderr)
        return None

def get_priority_value(labels):
    """Get numeric priority value from labels"""
    priority_map = {
        'CRITICAL': 5,
        'URGENT': 4,
        'HIGH': 3,
        'MEDIUM': 2,
        'LOW': 1
    }
    for label in labels:
        label_name = label.get('name', '').upper()
        if label_name in priority_map:
            return priority_map[label_name]
    return 0

def has_wip_label(labels):
    """Check if issue has WIP label"""
    return any(label.get('name', '').lower() == 'wip' for label in labels)

def get_dependency_numbers(labels):
    """Extract dependency issue numbers from labels (d1, d2, etc.)"""
    deps = []
    for label in labels:
        label_name = label.get('name', '').lower()
        if label_name.startswith('d') and label_name[1:].isdigit():
            deps.append(int(label_name[1:]))
    return deps

def is_issue_closed(issue_num):
    """Check if an issue is closed"""
    result = run_gh_command(['issue', 'view', str(issue_num), '--json', 'state'])
    if result:
        return result.get('state', '').upper() == 'CLOSED'
    return False

def main():
    # Fetch all open issues without WIP label
    print("Fetching open issues without WIP label...", file=sys.stderr)
    issues = run_gh_command([
        'issue', 'list',
        '--label', '!wip',
        '--state', 'open',
        '--json', 'number,title,labels,createdAt',
        '--limit', '100'
    ])

    if not issues:
        print("No issues found or error fetching issues", file=sys.stderr)
        sys.exit(1)

    # Filter out issues with WIP label (safety check)
    filtered_issues = [issue for issue in issues if not has_wip_label(issue.get('labels', []))]

    print(f"Found {len(filtered_issues)} issues without WIP", file=sys.stderr)

    # Sort by priority (descending) and then by creation date (ascending - oldest first)
    sorted_issues = sorted(
        filtered_issues,
        key=lambda x: (-get_priority_value(x.get('labels', [])), x.get('createdAt', ''))
    )

    # Find first claimable issue
    for issue in sorted_issues:
        number = issue.get('number')
        title = issue.get('title')
        labels = issue.get('labels', [])
        priority = get_priority_value(labels)
        deps = get_dependency_numbers(labels)

        priority_name = 'UNKNOWN'
        for label in labels:
            label_name = label.get('name', '').upper()
            if label_name in ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']:
                priority_name = label_name
                break

        print(f"Checking #{number} [{priority_name}]: {title}", file=sys.stderr)

        # Check dependencies
        if deps:
            blocked = False
            for dep in deps:
                if not is_issue_closed(dep):
                    print(f"  Skipping #{number} - blocked by #{dep}", file=sys.stderr)
                    blocked = True
                    break
            if blocked:
                continue

        # Found claimable issue
        print(json.dumps({
            'number': number,
            'title': title,
            'priority': priority_name
        }))
        sys.exit(0)

    print("All issues are either blocked or have WIP", file=sys.stderr)
    sys.exit(1)

if __name__ == '__main__':
    main()
