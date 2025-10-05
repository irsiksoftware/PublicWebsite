import json
import subprocess
from datetime import datetime

# Fetch all open issues
result = subprocess.run(
    [r"C:\Program Files\GitHub CLI\gh.bat", "issue", "list", "--state", "open", "--json", "number,title,labels,createdAt", "--limit", "100"],
    capture_output=True,
    text=True
)

issues = json.loads(result.stdout)

# Filter out issues with 'wip' label
available_issues = [
    issue for issue in issues
    if not any(label['name'] == 'wip' for label in issue['labels'])
]

# Priority mapping
priority_order = {'CRITICAL': 0, 'URGENT': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4}

def get_priority(issue):
    for label in issue['labels']:
        label_name = label['name'].upper()
        if label_name in priority_order:
            return priority_order[label_name]
    return 5  # No priority label

def parse_date(date_str):
    return datetime.fromisoformat(date_str.replace('Z', '+00:00'))

# Sort by priority first (ascending), then by createdAt (oldest first)
sorted_issues = sorted(
    available_issues,
    key=lambda x: (get_priority(x), parse_date(x['createdAt']))
)

# Output the sorted list
print(json.dumps(sorted_issues, indent=2))
