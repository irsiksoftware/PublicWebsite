#!/usr/bin/env python3
import json
import sys
from datetime import datetime

# Read the API response
with open('gh_api_issues.json', 'r', encoding='utf-8') as f:
    issues = json.load(f)

# Priority order
priority_order = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']
categorized = {p: [] for p in priority_order}

for issue in issues:
    # Skip pull requests
    if 'pull_request' in issue:
        continue

    labels = [l['name'].upper() for l in issue['labels']]

    # Skip if has WIP label
    if 'WIP' in labels:
        continue

    # Get priority
    priority = None
    for p in priority_order:
        if p in labels:
            priority = p
            break

    if priority:
        categorized[priority].append({
            'number': issue['number'],
            'title': issue['title'],
            'created_at': issue['created_at'],
            'labels': [l['name'] for l in issue['labels']]
        })

# Sort each priority group by creation date (oldest first)
for priority in priority_order:
    categorized[priority].sort(key=lambda x: x['created_at'])

# Find first available issue
for priority in priority_order:
    if categorized[priority]:
        issue = categorized[priority][0]
        print(f"TARGET: #{issue['number']}")
        print(f"PRIORITY: {priority}")
        print(f"TITLE: {issue['title']}")
        print(f"CREATED: {issue['created_at']}")
        sys.exit(0)

# No available work
print("NO_WORK")
sys.exit(1)
