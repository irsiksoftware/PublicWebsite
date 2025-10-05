import subprocess
import json
import sys

# Get all open issues with JSON format
result = subprocess.run(
    [r'C:\Program Files\GitHub CLI\gh.bat', 'issue', 'list', '--state', 'open',
     '--json', 'number,title,labels,createdAt', '--limit', '100'],
    capture_output=True,
    text=True
)

issues = json.loads(result.stdout)

# Filter out WIP issues
available = [i for i in issues if not any(l['name'] == 'wip' for l in i['labels'])]

# Sort by priority (CRITICAL > URGENT > HIGH > MEDIUM > LOW), then by creation date (oldest first)
priority_order = {'CRITICAL': 0, 'URGENT': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4}

def get_priority(issue):
    for label in issue['labels']:
        name = label['name'].upper()
        if name in priority_order:
            return priority_order[name]
    return 5  # No priority label

sorted_issues = sorted(available, key=lambda x: (get_priority(x), x['createdAt']))

# Print sorted issues
for issue in sorted_issues[:10]:  # Show top 10
    priority = 'NONE'
    for label in issue['labels']:
        name = label['name'].upper()
        if name in priority_order:
            priority = name
            break

    deps = [l['name'] for l in issue['labels'] if l['name'].startswith('d')]
    dep_str = f" [deps: {','.join(deps)}]" if deps else ""

    print(f"#{issue['number']} [{priority}] {issue['title']}{dep_str}")
