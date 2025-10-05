import json
import subprocess
from datetime import datetime

# Get all open issues
result = subprocess.run(
    [r'C:\Program Files\GitHub CLI\gh.bat', 'issue', 'list', '--state', 'open', '--json', 'number,title,labels,createdAt', '--limit', '100'],
    capture_output=True,
    text=True
)

print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("RETURNCODE:", result.returncode)
issues = json.loads(result.stdout) if result.stdout else []

# Filter out WIP issues
available_issues = [i for i in issues if 'wip' not in [l['name'] for l in i['labels']]]

# Sort by priority then by creation date (oldest first)
def get_priority(issue):
    labels = [l['name'] for l in issue['labels']]
    if 'CRITICAL' in labels:
        return 1
    elif 'URGENT' in labels:
        return 2
    elif 'HIGH' in labels:
        return 3
    elif 'MEDIUM' in labels:
        return 4
    elif 'LOW' in labels:
        return 5
    else:
        return 6

available_issues.sort(key=lambda x: (get_priority(x), x['createdAt']))

if available_issues:
    target = available_issues[0]
    print(json.dumps(target, indent=2))
else:
    print("NO_WORK")
