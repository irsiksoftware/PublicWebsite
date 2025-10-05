import subprocess
import json
from datetime import datetime

# Fetch issues using gh CLI
result = subprocess.run(
    [r"C:\Program Files\GitHub CLI\gh.bat", "issue", "list",
     "--label", "!wip", "--state", "open",
     "--json", "number,title,labels,createdAt", "--limit", "100"],
    capture_output=True,
    text=True
)

issues = json.loads(result.stdout)

# Filter out any issues that have 'wip' label (safety check)
filtered_issues = []
for issue in issues:
    label_names = [label['name'] for label in issue['labels']]
    if 'wip' not in label_names:
        filtered_issues.append(issue)

# Priority mapping
priority_map = {
    'CRITICAL': 0,
    'URGENT': 1,
    'HIGH': 2,
    'MEDIUM': 3,
    'LOW': 4
}

# Sort issues
def get_priority(issue):
    label_names = [label['name'].upper() for label in issue['labels']]
    for priority in ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']:
        if priority in label_names:
            return priority_map[priority]
    return 5  # Default priority if none found

def sort_key(issue):
    priority = get_priority(issue)
    created_at = datetime.fromisoformat(issue['createdAt'].replace('Z', '+00:00'))
    return (priority, created_at)

sorted_issues = sorted(filtered_issues, key=sort_key)

# Print sorted issues
print(json.dumps(sorted_issues, indent=2))
