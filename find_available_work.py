import json
import sys
from datetime import datetime

# Read from the raw API file
try:
    with open('raw_issues_api_real.json', 'r', encoding='utf-8') as f:
        all_issues = json.load(f)
except FileNotFoundError:
    print("Error: raw_issues_api_real.json not found", file=sys.stderr)
    sys.exit(1)
except json.JSONDecodeError as e:
    print(f"Error parsing JSON: {e}", file=sys.stderr)
    sys.exit(1)

# Filter out PRs (they have pull_request field) - we only want issues
issues = [issue for issue in all_issues if 'pull_request' not in issue]

# Filter out WIP issues
available_issues = [
    issue for issue in issues
    if 'wip' not in [label['name'].lower() for label in issue.get('labels', [])]
]

# Assign priority and extract dependencies
def get_priority(issue):
    label_names = [label['name'] for label in issue.get('labels', [])]
    if 'CRITICAL' in label_names:
        return 1
    elif 'URGENT' in label_names:
        return 2
    elif 'HIGH' in label_names:
        return 3
    elif 'MEDIUM' in label_names:
        return 4
    else:
        return 5

def get_dependencies(issue):
    import re
    deps = []
    for label in issue.get('labels', []):
        if re.match(r'^d\d+$', label['name']):
            # Extract dependency issue number
            dep_num = label['name'][1:]  # Remove 'd' prefix
            deps.append(int(dep_num))
    return deps

# Sort issues by priority (ascending), then by creation date (oldest first)
sorted_issues = sorted(
    available_issues,
    key=lambda x: (get_priority(x), x.get('created_at', ''))
)

# Output sorted issues with dependencies as JSON for easy processing
output = []
for issue in sorted_issues[:20]:  # Top 20
    priority_names = {1: 'CRITICAL', 2: 'URGENT', 3: 'HIGH', 4: 'MEDIUM', 5: 'LOW'}
    priority = get_priority(issue)
    deps = get_dependencies(issue)

    output.append({
        'number': issue['number'],
        'title': issue['title'],
        'priority': priority_names[priority],
        'priority_num': priority,
        'dependencies': deps,
        'created_at': issue.get('created_at', '')
    })

# Print JSON
print(json.dumps(output, indent=2))
