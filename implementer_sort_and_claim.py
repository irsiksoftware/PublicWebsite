#!/usr/bin/env python3
import json
import subprocess
import sys
from datetime import datetime

# Read issues
with open('issues_api_implementer.json', 'r', encoding='utf-8-sig') as f:
    issues = json.load(f)

# Filter out issues with 'wip' label
available = [i for i in issues if 'wip' not in [l.lower() for l in i['labels']]]

# Priority mapping
priority_order = {'CRITICAL': 0, 'URGENT': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4}

def get_priority(issue):
    for label in issue['labels']:
        if label.upper() in priority_order:
            return priority_order[label.upper()]
    return 999  # No priority label

def get_created_timestamp(issue):
    return datetime.fromisoformat(issue['createdAt'].replace('Z', '+00:00'))

# Sort by priority (lower is better), then by oldest first
available.sort(key=lambda x: (get_priority(x), get_created_timestamp(x)))

print(f"Found {len(available)} available issues (excluding WIP)")

# Try to claim an issue
for issue in available:
    num = issue['number']
    title = issue['title']
    labels = issue['labels']

    print(f"\n=== Checking #{num}: {title}")
    print(f"    Labels: {', '.join(labels)}")

    # Double-check for WIP (safety)
    if 'wip' in [l.lower() for l in labels]:
        print(f"    SKIP: Has WIP label")
        continue

    # Check for dependency labels (d1, d2, d3, etc.)
    dep_labels = [l for l in labels if l.lower().startswith('d') and l[1:].isdigit()]

    if dep_labels:
        print(f"    Found dependency labels: {', '.join(dep_labels)}")
        blocked = False

        for dep_label in dep_labels:
            dep_num = dep_label[1:]  # Extract number from d1, d2, etc.

            # Check if dependency issue is closed
            try:
                result = subprocess.run(
                    ['C:\\Program Files\\GitHub CLI\\gh.bat', 'issue', 'view', dep_num, '--json', 'state,number,title'],
                    capture_output=True,
                    text=True,
                    check=True
                )
                dep_data = json.loads(result.stdout)
                dep_state = dep_data['state']
                dep_title = dep_data.get('title', 'Unknown')

                print(f"    Dependency #{dep_num} ({dep_title}): {dep_state}")

                if dep_state.upper() != 'CLOSED':
                    print(f"    BLOCKED by open dependency #{dep_num}")
                    blocked = True
                    break

            except Exception as e:
                print(f"    ERROR checking dependency #{dep_num}: {e}")
                blocked = True
                break

        if blocked:
            continue

    # Found claimable issue!
    print(f"\nCLAIMING #{num}: {title}")

    # Output the issue number for the calling script
    with open('claimable_issue.json', 'w', encoding='utf-8') as f:
        json.dump({'number': num, 'title': title, 'labels': labels}, f, indent=2)

    sys.exit(0)

print("\nNo claimable issues found (all are either WIP or blocked by dependencies)")
sys.exit(1)
