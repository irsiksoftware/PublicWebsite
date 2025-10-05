#!/usr/bin/env python3
import subprocess
import json
import sys

def run_gh_command(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8')
    if result.returncode != 0:
        print(f"Error: {result.stderr}", file=sys.stderr)
        return None
    return result.stdout.strip()

# Fetch open PRs
prs_json = run_gh_command("gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body")

if prs_json:
    with open('thor_prs_live_data.json', 'w', encoding='utf-8') as f:
        f.write(prs_json)
    print(prs_json)
else:
    print("Failed to fetch PRs", file=sys.stderr)
    sys.exit(1)
