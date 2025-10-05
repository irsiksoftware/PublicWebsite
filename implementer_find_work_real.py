import subprocess
import json
import sys

# Fetch issues using gh CLI
result = subprocess.run(
    ['gh', 'issue', 'list', '--state', 'open', '--json', 'number,title,labels,createdAt', '--limit', '100'],
    capture_output=True,
    text=True
)

if result.returncode != 0:
    print(f"Error fetching issues: {result.stderr}")
    sys.exit(1)

issues = json.loads(result.stdout)

# Filter out issues with 'wip' label
available_issues = []
for issue in issues:
    label_names = [label['name'].lower() for label in issue['labels']]
    if 'wip' not in label_names:
        available_issues.append(issue)

# Priority mapping
priority_map = {
    'critical': 0,
    'urgent': 1,
    'high': 2,
    'medium': 3,
    'low': 4
}

# Sort by priority, then by creation date (oldest first)
def get_priority(issue):
    label_names = [label['name'].lower() for label in issue['labels']]
    for priority in priority_map.keys():
        if priority in label_names:
            return priority_map[priority]
    return 5  # No priority label

sorted_issues = sorted(available_issues, key=lambda x: (get_priority(x), x['createdAt']))

# Output sorted issues
print(json.dumps(sorted_issues, indent=2))
