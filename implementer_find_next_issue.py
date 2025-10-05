import subprocess
import json
import re
from datetime import datetime

# Fetch issues using gh CLI
result = subprocess.run([
    'C:\\Program Files\\GitHub CLI\\gh.bat', 'issue', 'list',
    '--state', 'open',
    '--json', 'number,title,labels,createdAt',
    '--limit', '100'
], capture_output=True, text=True, encoding='utf-8')

issues = json.loads(result.stdout)

# Priority mapping
priority_map = {
    'CRITICAL': 0,
    'URGENT': 1,
    'HIGH': 2,
    'MEDIUM': 3,
    'LOW': 4
}

# Filter and sort issues
available_issues = []
for issue in issues:
    labels = [label['name'].lower() for label in issue['labels']]

    # Skip if has wip label
    if 'wip' in labels:
        continue

    # Determine priority
    priority = 4  # Default to LOW
    for label in issue['labels']:
        label_name = label['name'].upper()
        if label_name in priority_map:
            priority = priority_map[label_name]
            break

    # Extract dependency labels
    dependencies = [label['name'] for label in issue['labels'] if label['name'].startswith('d') and label['name'][1:].isdigit()]

    available_issues.append({
        'number': issue['number'],
        'title': issue['title'],
        'priority': priority,
        'priority_name': list(priority_map.keys())[priority],
        'createdAt': issue['createdAt'],
        'dependencies': dependencies,
        'labels': labels
    })

# Sort by priority (ascending), then by createdAt (oldest first)
available_issues.sort(key=lambda x: (x['priority'], x['createdAt']))

# Save sorted issues
with open('sorted_available_issues.json', 'w', encoding='utf-8') as f:
    json.dump(available_issues, f, indent=2)

print(f"Found {len(available_issues)} available issues (excluding WIP)")
for issue in available_issues[:10]:
    deps = ', '.join(issue['dependencies']) if issue['dependencies'] else 'none'
    print(f"#{issue['number']} [{issue['priority_name']}] {issue['title'][:60]} (deps: {deps})")
