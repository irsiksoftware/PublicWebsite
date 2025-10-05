#!/usr/bin/env python3
"""Cyclops PR Scanner - Tactical Field Analysis"""
import subprocess
import json
import sys
from datetime import datetime, timezone

def run_gh_command(args):
    """Execute gh command and return output"""
    cmd = ["C:\\Program Files\\GitHub CLI\\gh.bat"] + args
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout.strip(), result.stderr.strip(), result.returncode

def get_pr_list():
    """Get list of open PRs"""
    stdout, stderr, code = run_gh_command([
        "api", "repos/:owner/:repo/pulls",
        "--jq", ".[] | {number, title, mergeable_state, head: .head.ref, draft, created_at, commits}"
    ])

    if code != 0:
        print(f"Error fetching PRs: {stderr}", file=sys.stderr)
        return []

    # Parse line-by-line JSON objects
    prs = []
    for line in stdout.split('\n'):
        if line.strip():
            try:
                prs.append(json.loads(line))
            except json.JSONDecodeError:
                continue

    return prs

def check_staleness(created_at_str):
    """Check if PR is stale (>24h old)"""
    created = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
    now = datetime.now(timezone.utc)
    age_hours = (now - created).total_seconds() / 3600
    return age_hours > 24

def main():
    print("=== CYCLOPS TACTICAL PR SCAN ===\n")

    prs = get_pr_list()

    if not prs:
        print("No open PRs found or error fetching data.")
        return

    analysis = {
        "conflicting": [],
        "mergeable": [],
        "unknown": [],
        "stale": []
    }

    for pr in prs:
        num = pr.get('number')
        title = pr.get('title')
        mergeable = pr.get('mergeable_state')
        head = pr.get('head')
        draft = pr.get('draft', False)
        created = pr.get('created_at')

        print(f"PR #{num}: {title}")
        print(f"  Branch: {head}")
        print(f"  Mergeable: {mergeable}")
        print(f"  Draft: {draft}")
        print(f"  Created: {created}")

        is_stale = check_staleness(created) if created else False
        print(f"  Stale: {is_stale}")
        print()

        if mergeable == 'dirty':
            analysis['conflicting'].append(num)
        elif mergeable == 'clean' or mergeable == 'unstable':
            analysis['mergeable'].append(num)
        else:
            analysis['unknown'].append(num)

        if is_stale:
            analysis['stale'].append(num)

    # Save analysis
    with open('cyclops_tactical_analysis.json', 'w') as f:
        json.dump(analysis, f, indent=2)

    print("\n=== TACTICAL ANALYSIS ===")
    print(f"Conflicting: {analysis['conflicting']}")
    print(f"Mergeable: {analysis['mergeable']}")
    print(f"Unknown: {analysis['unknown']}")
    print(f"Stale: {analysis['stale']}")

if __name__ == "__main__":
    main()
