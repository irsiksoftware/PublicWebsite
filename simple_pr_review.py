#!/usr/bin/env python3
"""Simple PR Review - Uses subprocess with proper encoding."""

import subprocess
import json
import re
import sys

def run_cmd(cmd):
    """Run command with proper error handling."""
    try:
        # Use list format for subprocess to avoid shell issues
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            check=False
        )
        if result.returncode != 0:
            print(f"Error: {result.stderr}")
            return None
        return result.stdout.strip()
    except Exception as e:
        print(f"Exception running {cmd}: {e}")
        return None

# First, check what PR #143 is about
print("Checking PR #143...")
pr_info = run_cmd("gh pr view 143")
if pr_info:
    print(pr_info)
    print("\n" + "="*60 + "\n")

# Extract issue number from PR title
issue_match = re.search(r'Fixes #(\d+)', pr_info or '')
if issue_match:
    issue_num = issue_match.group(1)
    print(f"PR #143 fixes issue #{issue_num}")

    # Get issue details
    print(f"\nChecking issue #{issue_num}...")
    issue_info = run_cmd(f"gh issue view {issue_num}")
    if issue_info:
        print(issue_info)
        print("\n" + "="*60 + "\n")

    # Check if issue is closed (dependencies)
    is_closed = "state: CLOSED" in (issue_info or '').lower()

    # Check CI status
    print("Checking CI status for PR #143...")
    ci_status = run_cmd("gh pr checks 143")
    if ci_status:
        print(ci_status)
        print("\n" + "="*60 + "\n")

    # Check if all checks passed
    all_passed = "fail" not in (ci_status or '').lower() and "pending" not in (ci_status or '').lower()

    # Decision
    print("\n" + "="*60)
    print("DECISION:")
    print("="*60)

    if all_passed:
        print("[PASS] CI checks: PASSED")
    else:
        print("[FAIL] CI checks: PENDING/FAILED")

    # Check for dependencies in issue labels
    # Since we can't easily get JSON, let's check the pr140.json file if it has similar structure
    print("\n")
    if all_passed:
        print("PR #143 is ready to merge!")
        print("\nWould you like to proceed with merge? (This would run:)")
        print("  gh pr merge 143 --squash --delete-branch")
        print("\nAnd then notify via Discord:")
        print("  python core/discord_notifier.py pr_merged 'Thor Odinson' 143 76")
    else:
        print("PR #143 needs attention:")
        if not all_passed:
            print("  - CI checks need to pass")

else:
    print("Could not find linked issue in PR title")
