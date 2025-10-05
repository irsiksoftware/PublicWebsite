import subprocess
import json

# Get issues from GitHub CLI
result = subprocess.run(
    [r"C:\Program Files\GitHub CLI\gh.bat", "issue", "list", "--label", "!wip", "--state", "open",
     "--json", "number,title,labels,createdAt", "-L", "100"],
    capture_output=True,
    text=True
)

issues = json.loads(result.stdout)

# Priority mapping
priority_order = {"CRITICAL": 0, "URGENT": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}

def get_priority(issue):
    labels = [label['name'].upper() for label in issue['labels']]
    for priority in priority_order:
        if priority in labels:
            return priority_order[priority]
    return 5  # No priority label

def has_wip(issue):
    labels = [label['name'].lower() for label in issue['labels']]
    return 'wip' in labels

def get_dependencies(issue):
    labels = [label['name'] for label in issue['labels']]
    deps = [label for label in labels if label.startswith('d')]
    return deps

# Filter out WIP issues and sort
filtered_issues = [issue for issue in issues if not has_wip(issue)]
sorted_issues = sorted(filtered_issues, key=lambda x: (get_priority(x), x['createdAt']))

# Print sorted issues
for issue in sorted_issues[:10]:
    labels = [label['name'] for label in issue['labels']]
    priority_labels = [l for l in labels if l.upper() in priority_order]
    dep_labels = [l for l in labels if l.startswith('d')]
    print(f"#{issue['number']} - {priority_labels} - {dep_labels} - {issue['title']}")
