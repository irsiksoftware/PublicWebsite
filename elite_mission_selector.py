#!/usr/bin/env python3
import subprocess
import json
import sys
from datetime import datetime

# Fetch all open issues with JSON output
result = subprocess.run(
    [r'C:\Program Files\GitHub CLI\gh.bat', 'issue', 'list', '--state', 'open', '--json',
     'number,title,labels,createdAt', '--limit', '200'],
    capture_output=True,
    text=True
)

issues = json.loads(result.stdout)

# Filter out WIP issues and categorize by priority
priority_order = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']
categorized = {p: [] for p in priority_order}

for issue in issues:
    labels = [l['name'] for l in issue['labels']]

    # Skip if has WIP label
    if 'wip' in labels:
        continue

    # Get priority
    priority = None
    for p in priority_order:
        if p in labels:
            priority = p
            break

    if priority:
        categorized[priority].append(issue)

# Sort each priority group by creation date (oldest first)
for priority in priority_order:
    categorized[priority].sort(key=lambda x: x['createdAt'])

# Find first available issue
for priority in priority_order:
    if categorized[priority]:
        issue = categorized[priority][0]
        print(json.dumps(issue, indent=2))
        sys.exit(0)

# No available work
print("NO_WORK")
sys.exit(1)
