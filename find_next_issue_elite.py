import subprocess
import json
import sys

# Priority mapping
PRIORITY_MAP = {
    'CRITICAL': 0,
    'URGENT': 1,
    'HIGH': 2,
    'MEDIUM': 3,
    'LOW': 4
}

try:
    # Get all open issues
    result = subprocess.run(
        ['gh', 'issue', 'list', '--state', 'open', '--json', 'number,title,labels,createdAt', '--limit', '100'],
        capture_output=True,
        text=True,
        check=True
    )

    issues = json.loads(result.stdout)

    # Filter out issues with 'wip' label
    available_issues = []
    for issue in issues:
        label_names = [label['name'].upper() for label in issue['labels']]

        # Skip if has 'wip' label
        if 'WIP' in label_names:
            continue

        # Find priority level
        priority = 4  # Default to LOW
        for label_name in label_names:
            if label_name in PRIORITY_MAP:
                priority = PRIORITY_MAP[label_name]
                break

        available_issues.append({
            'number': issue['number'],
            'title': issue['title'],
            'priority': priority,
            'priority_name': [k for k, v in PRIORITY_MAP.items() if v == priority][0],
            'created_at': issue['createdAt'],
            'labels': label_names
        })

    if not available_issues:
        print("NO_ISSUES_AVAILABLE")
        sys.exit(0)

    # Sort by priority (ascending), then by created date (oldest first)
    available_issues.sort(key=lambda x: (x['priority'], x['created_at']))

    # Get the first issue
    target = available_issues[0]
    print(f"{target['number']}")
    print(f"TITLE:{target['title']}")
    print(f"PRIORITY:{target['priority_name']}")

except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
