#!/usr/bin/env python3
"""Bruce Banner PR Review - Fetch Current PRs"""

import subprocess
import json
import sys

def run_command(cmd):
    """Run a command and return output"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        return result.stdout.strip(), result.returncode
    except Exception as e:
        print(f"Error running command: {e}", file=sys.stderr)
        return None, 1

def main():
    print("Fetching open PRs...")

    # Fetch PRs
    output, code = run_command(
        'gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body --limit 100'
    )

    if code != 0:
        print("Error fetching PRs", file=sys.stderr)
        sys.exit(1)

    # Parse JSON
    try:
        prs = json.loads(output)
        print(f"Found {len(prs)} open PRs")

        # Save to file
        with open('prs_bruce_review_python.json', 'w', encoding='utf-8') as f:
            json.dump(prs, f, indent=2, ensure_ascii=False)

        print("PR data saved to prs_bruce_review_python.json")

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}", file=sys.stderr)
        print(f"Raw output: {output[:500]}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
