import subprocess
import json

# Fetch all open issues
result = subprocess.run(
    [r"C:\Program Files\GitHub CLI\gh.bat", "issue", "list", "--state", "open", "--json", "number,title,labels,createdAt", "--limit", "100"],
    capture_output=True,
    text=True
)

issues = json.loads(result.stdout)

# Filter out issues with 'wip' label
available_issues = []
for issue in issues:
    labels = [label['name'] for label in issue['labels']]
    if 'wip' not in labels:
        available_issues.append({
            'number': issue['number'],
            'title': issue['title'],
            'labels': labels,
            'createdAt': issue['createdAt']
        })

# Prioritize issues: CRITICAL > URGENT > HIGH > MEDIUM > LOW (oldest first within tier)
priority_map = {'CRITICAL': 0, 'URGENT': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4}

def get_priority(issue):
    labels = issue['labels']
    for label in labels:
        if label in priority_map:
            return (priority_map[label], issue['createdAt'])
    return (5, issue['createdAt'])  # Default to lowest priority

available_issues.sort(key=get_priority)

# Output the prioritized list
print(json.dumps(available_issues, indent=2))
