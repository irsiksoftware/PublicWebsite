#!/usr/bin/env python3
"""Cyclops PR Status Checker - Fetch PR data using GitHub CLI"""

import subprocess
import json
import sys

def run_gh_command(cmd):
    """Run gh command and return JSON output"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        if result.returncode != 0:
            print(f"Error running command: {result.stderr}", file=sys.stderr)
            return None
        return result.stdout
    except Exception as e:
        print(f"Exception: {e}", file=sys.stderr)
        return None

def main():
    # Fetch open PRs with detailed info
    cmd = 'gh pr list --state open --json number,title,mergeable,headRefName,isDraft,createdAt,commits,updatedAt'

    output = run_gh_command(cmd)
    if not output:
        print("Failed to fetch PRs", file=sys.stderr)
        sys.exit(1)

    try:
        prs = json.loads(output)
        # Save to file
        with open('pr_cyclops_current.json', 'w', encoding='utf-8') as f:
            json.dump(prs, f, indent=2)

        print(json.dumps(prs, indent=2))

    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {e}", file=sys.stderr)
        print(f"Raw output: {output}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
