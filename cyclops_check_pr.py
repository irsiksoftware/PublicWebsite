#!/usr/bin/env python3
"""Check PR merge status"""
import subprocess
import json
import sys
from datetime import datetime, timezone

def run_cmd(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8')
    if result.returncode != 0:
        print(f"Error: {result.stderr}", file=sys.stderr)
        return None
    return result.stdout.strip()

# Get PR from bruce_api_prs.json
with open('bruce_api_prs.json', 'r', encoding='utf-8-sig') as f:
    prs = json.load(f)

if not prs:
    print("No PRs found")
    sys.exit(0)

pr = prs[0]
pr_num = pr['number']

# Get detailed merge status
cmd = f'gh api repos/irsiksoftware/TestForAI/pulls/{pr_num}'
output = run_cmd(cmd)

if output:
    detail = json.loads(output)

    # Calculate age
    created = datetime.fromisoformat(detail['created_at'].replace('Z', '+00:00'))
    now = datetime.now(timezone.utc)
    age_hours = (now - created).total_seconds() / 3600

    result = {
        'number': detail['number'],
        'title': detail['title'],
        'head_ref': detail['head']['ref'],
        'mergeable': detail.get('mergeable'),
        'mergeable_state': detail.get('mergeable_state'),
        'created_at': detail['created_at'],
        'updated_at': detail['updated_at'],
        'age_hours': round(age_hours, 1),
        'commits': detail.get('commits', 0),
        'draft': detail.get('draft', False)
    }

    print(json.dumps(result, indent=2))

    with open('pr_162_status.json', 'w') as f:
        json.dump(result, f, indent=2)
