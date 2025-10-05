import re
import subprocess
import json

# Get all open PRs to exclude issues that already have PRs
pr_result = subprocess.run(
    [r"C:\Program Files\GitHub CLI\gh.bat", "pr", "list", "--state", "open", "--json", "number,title"],
    capture_output=True,
    text=True
)

open_prs = json.loads(pr_result.stdout)

# Extract issue numbers from PR titles (format: "Fixes #N: ...")
issues_with_prs = set()
for pr in open_prs:
    match = re.search(r'#(\d+)', pr['title'])
    if match:
        issues_with_prs.add(int(match.group(1)))

print(f"Issues with open PRs: {sorted(issues_with_prs)}")

# Get all open issues
result = subprocess.run(
    [r"C:\Program Files\GitHub CLI\gh.bat", "issue", "list", "--state", "open", "--limit", "100"],
    capture_output=True,
    text=True
)

issues_text = result.stdout

# Parse issues
issues = []
for line in issues_text.strip().split('\n'):
    match = re.match(r'#(\d+)\s+\[OPEN\]\s+\[([^\]]+)\]\s+(.+)', line)
    if match:
        number = int(match.group(1))
        labels = [l.strip() for l in match.group(2).split(',')]
        title = match.group(3)

        # Skip if wip label present or if issue already has open PR
        if 'wip' in labels or number in issues_with_prs:
            continue

        issues.append({
            'number': number,
            'labels': labels,
            'title': title
        })

# Priority mapping
priority_order = {'CRITICAL': 0, 'URGENT': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4}

def get_priority(issue):
    for label in issue['labels']:
        label_upper = label.upper()
        if label_upper in priority_order:
            return priority_order[label_upper]
    return 5

# Sort by priority, then by issue number (oldest first)
sorted_issues = sorted(issues, key=lambda x: (get_priority(x), x['number']))

# Print first available issue
if sorted_issues:
    first = sorted_issues[0]
    priority_label = next((l for l in first['labels'] if l.upper() in priority_order), 'NO_PRIORITY')
    print(f"\nTARGET: #{first['number']} [{priority_label.upper()}] {first['title']}")
else:
    print("\nNO_AVAILABLE_WORK")
