import subprocess
import json
import sys

# Priority order
PRIORITY_ORDER = {'CRITICAL': 0, 'URGENT': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4}

# Get all open issues
result = subprocess.run([
    r'C:\Program Files\GitHub CLI\gh.bat',
    'issue', 'list',
    '--state', 'open',
    '--limit', '200',
    '--json', 'number,title,labels,createdAt'
], capture_output=True, text=True)

if result.returncode != 0:
    print(f"Error: {result.stderr}", file=sys.stderr)
    sys.exit(1)

try:
    issues = json.loads(result.stdout)
except json.JSONDecodeError as e:
    print(f"JSON Error: {e}", file=sys.stderr)
    print(f"Output was: {result.stdout}", file=sys.stderr)
    sys.exit(1)

# Filter out WIP issues and sort by priority
available_issues = []
for issue in issues:
    label_names = [label['name'].lower() for label in issue['labels']]

    # Skip if has wip label
    if 'wip' in label_names:
        continue

    # Determine priority
    priority = 'LOW'  # default
    for label in issue['labels']:
        label_upper = label['name'].upper()
        if label_upper in PRIORITY_ORDER:
            priority = label_upper
            break

    # Extract dependency labels (d1, d2, etc)
    dependencies = [label['name'] for label in issue['labels'] if label['name'].startswith('d')]

    available_issues.append({
        'number': issue['number'],
        'title': issue['title'],
        'priority': priority,
        'priority_rank': PRIORITY_ORDER.get(priority, 4),
        'created_at': issue['createdAt'],
        'dependencies': dependencies,
        'labels': label_names
    })

# Sort by priority rank (lower is higher priority), then by creation date (older first)
available_issues.sort(key=lambda x: (x['priority_rank'], x['created_at']))

# Print the sorted list
if available_issues:
    print(json.dumps(available_issues, indent=2))
else:
    print("[]")
