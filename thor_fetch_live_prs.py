#!/usr/bin/env python3
import subprocess
import json
import sys

def run_gh_json(cmd):
    # Force JSON output
    result = subprocess.run(
        cmd,
        shell=True,
        capture_output=True,
        text=True,
        encoding='utf-8',
        env={'GH_PAGER': ''}  # Disable pager
    )
    if result.returncode != 0:
        print(f"Error: {result.stderr}", file=sys.stderr)
        return None

    # Parse JSON
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}", file=sys.stderr)
        print(f"Raw output: {result.stdout}", file=sys.stderr)
        return None

# Fetch open PRs with all required fields
prs = run_gh_json("gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body,updatedAt")

if prs is not None:
    # Save to file
    with open('thor_prs_live_data.json', 'w', encoding='utf-8') as f:
        json.dump(prs, f, indent=2, ensure_ascii=False)

    print(f"Fetched {len(prs)} open PR(s)")
    print(json.dumps(prs, indent=2, ensure_ascii=False))
else:
    print("Failed to fetch PRs", file=sys.stderr)
    sys.exit(1)
