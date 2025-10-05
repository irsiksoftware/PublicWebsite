import subprocess
import json
import sys
from datetime import datetime

def get_issues():
    """Fetch all open issues using GitHub CLI"""
    cmd = [r"C:\Program Files\GitHub CLI\gh.bat", "issue", "list",
           "--state", "open", "--json", "number,title,labels,createdAt", "--limit", "100"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error fetching issues: {result.stderr}")
        sys.exit(1)
    return json.loads(result.stdout)

def has_wip_label(labels):
    """Check if issue has WIP label"""
    return any(label['name'].lower() == 'wip' for label in labels)

def get_priority(labels):
    """Extract priority from labels (CRITICAL=5, URGENT=4, HIGH=3, MEDIUM=2, LOW=1)"""
    priority_map = {'critical': 5, 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1}
    for label in labels:
        label_name = label['name'].lower()
        if label_name in priority_map:
            return priority_map[label_name]
    return 0  # No priority label

def get_dependency_labels(labels):
    """Extract dependency labels (d1, d2, etc.)"""
    deps = []
    for label in labels:
        label_name = label['name'].lower()
        if label_name.startswith('d') and label_name[1:].isdigit():
            deps.append(int(label_name[1:]))
    return deps

def check_issue_closed(issue_number):
    """Check if an issue is closed"""
    cmd = [r"C:\Program Files\GitHub CLI\gh.bat", "issue", "view", str(issue_number),
           "--json", "state"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return False
    data = json.loads(result.stdout)
    return data.get('state', '').upper() == 'CLOSED'

def main():
    # Fetch all open issues
    print("Fetching open issues...")
    issues = get_issues()

    # Filter out WIP issues
    available_issues = [issue for issue in issues if not has_wip_label(issue['labels'])]
    print(f"Found {len(available_issues)} issues without WIP label")

    if not available_issues:
        print("No available issues found.")
        sys.exit(0)

    # Sort by priority (desc) then by creation date (asc - oldest first)
    available_issues.sort(key=lambda x: (-get_priority(x['labels']), x['createdAt']))

    # Try to find a claimable issue
    for issue in available_issues:
        issue_num = issue['number']
        title = issue['title']
        labels = issue['labels']
        priority_labels = [l['name'] for l in labels if l['name'].upper() in ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']]
        priority = priority_labels[0] if priority_labels else 'NONE'

        # Safety check for WIP
        if has_wip_label(labels):
            print(f"Skipping #{issue_num} - has WIP label (safety check)")
            continue

        # Check dependencies
        deps = get_dependency_labels(labels)
        if deps:
            blocked = False
            for dep in deps:
                if not check_issue_closed(dep):
                    print(f"Skipping #{issue_num} - blocked by #{dep}")
                    blocked = True
                    break
            if blocked:
                continue

        # Found claimable issue!
        print(f"\n=== CLAIMABLE ISSUE FOUND ===")
        print(f"Issue: #{issue_num}")
        print(f"Title: {title}")
        print(f"Priority: {priority}")
        print(json.dumps({
            "number": issue_num,
            "title": title,
            "priority": priority,
            "labels": [l['name'] for l in labels]
        }, indent=2))
        sys.exit(0)

    print("\nAll issues are either blocked or have WIP label.")
    sys.exit(1)

if __name__ == "__main__":
    main()
