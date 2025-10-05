import json
import subprocess
import sys

# Get issues from GitHub CLI
result = subprocess.run(
    [r'C:\Program Files\GitHub CLI\gh.bat', 'issue', 'list', '--state', 'open', '--json', 'number,title,labels,createdAt', '--limit', '100'],
    capture_output=True,
    text=True
)

issues = json.loads(result.stdout)

# Filter out issues with 'wip' label
issues = [i for i in issues if not any(l['name'] == 'wip' for l in i['labels'])]

# Priority mapping
priority_order = {'CRITICAL': 0, 'URGENT': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4}

def get_priority(issue):
    for label in issue['labels']:
        name = label['name'].upper()
        if name in priority_order:
            return priority_order[name]
    return 5  # No priority label

def get_dependencies(issue):
    deps = []
    for label in issue['labels']:
        name = label['name']
        if name.startswith('d') and name[1:].isdigit():
            deps.append(int(name[1:]))
    return deps

# Sort by priority (lowest number first), then by createdAt (oldest first)
issues.sort(key=lambda x: (get_priority(x), x['createdAt']))

# Print sorted issues with priorities and dependencies
for issue in issues:
    priority_labels = [l['name'].upper() for l in issue['labels'] if l['name'].upper() in priority_order]
    priority = priority_labels[0] if priority_labels else 'NONE'
    deps = get_dependencies(issue)
    deps_str = f" [deps: {','.join(map(str, deps))}]" if deps else ""
    print(f"#{issue['number']} [{priority}]{deps_str} {issue['title']}")
