#!/usr/bin/env python3
"""
PR_FIXER - Cyclops Tactical Field Commander
Fix merge conflicts and stale PRs using GitHub CLI
"""

import subprocess
import json
import time
import sys
from datetime import datetime, timezone

def run_command(cmd, capture=True, check=True, use_powershell=False):
    """Run a shell command and return the result"""
    try:
        if use_powershell:
            cmd = ['powershell', '-Command', cmd]
            shell = False
        else:
            shell = True

        if capture:
            result = subprocess.run(cmd, shell=shell, capture_output=True, text=True, check=check)
            return result.stdout.strip(), result.returncode
        else:
            result = subprocess.run(cmd, shell=shell, check=check)
            return "", result.returncode
    except subprocess.CalledProcessError as e:
        return e.stdout if capture else "", e.returncode

def notify_discord(event_type, agent, pr_num, message):
    """Send Discord notification"""
    try:
        cmd = f'python core/discord_notifier.py {event_type} "{agent}" {pr_num} "{message}"'
        subprocess.run(cmd, shell=True, capture_output=True, timeout=5)
    except:
        pass  # Ignore Discord errors

def main():
    print("=== PR FIXER - Cyclops Tactical Commander ===")
    print()

    # Step 1: Fetch all open PRs
    print("[1/5] Fetching open PRs...")
    output, code = run_command('gh pr list --state open --json number,title,mergeable,headRefName,isDraft,createdAt,commits', use_powershell=True)

    if code != 0 or not output:
        print(f"ERROR: Failed to fetch PRs (exit code: {code})")
        print(f"Output: {output}")
        return 1

    print(f"DEBUG: Raw output: {output}")

    try:
        prs = json.loads(output)
    except json.JSONDecodeError as e:
        print(f"ERROR: Failed to parse JSON: {e}")
        print(f"Raw output: {output}")
        return 1

    if not prs:
        print("No open PRs found.")
        return 0

    print(f"Found {len(prs)} open PR(s)")
    print()

    # Initialize tracking
    fixed = []
    closed = []
    skipped = []

    # Step 2: Process each PR
    print("[2/5] Analyzing PRs for conflicts and staleness...")

    for pr in prs:
        pr_num = pr['number']
        title = pr['title']
        mergeable = pr['mergeable']
        head_ref = pr['headRefName']
        is_draft = pr.get('isDraft', False)
        created_at = datetime.fromisoformat(pr['createdAt'].replace('Z', '+00:00'))
        age_hours = (datetime.now(timezone.utc) - created_at).total_seconds() / 3600

        print()
        print(f"PR #{pr_num}: {title}")
        print(f"  Branch: {head_ref} | Mergeable: {mergeable} | Age: {age_hours:.1f}h")

        # Process based on mergeable status
        if mergeable == "CONFLICTING":
            print("  [ACTION] Merge conflicts detected!")

            # Notify Discord
            print("  → Notifying Discord...")
            notify_discord("pr_conflict", "Scott Summers", pr_num, "Merge conflicts detected, attempting rebase")

            # Perform rebase
            print("  → Starting rebase operation...")

            # Fetch latest
            run_command("git fetch origin", capture=False, check=False)

            # Checkout PR branch
            print(f"    Checking out {head_ref}...")
            _, code = run_command(f"git checkout {head_ref}", check=False)
            if code != 0:
                print("    ERROR: Failed to checkout branch")
                skipped.append({"PR": pr_num, "Reason": "Checkout failed"})
                continue

            # Attempt rebase
            print("    Rebasing...")
            _, code = run_command("git rebase origin/main", check=False)

            if code != 0:
                # Conflicts detected
                print("    Conflicts detected during rebase")
                conflict_files, _ = run_command("git diff --name-only --diff-filter=U", check=False)

                if conflict_files:
                    print(f"    Conflicting files: {conflict_files}")
                    print("    → Manual resolution required - aborting rebase")
                    run_command("git rebase --abort", capture=False, check=False)

                    notify_discord("pr_conflict", "Scott Summers", pr_num, "Rebase failed: Manual conflict resolution required")
                    skipped.append({"PR": pr_num, "Reason": "Manual conflict resolution required"})
                else:
                    print("    ERROR: Rebase failed for unknown reason")
                    run_command("git rebase --abort", capture=False, check=False)
                    skipped.append({"PR": pr_num, "Reason": "Rebase failed"})

                run_command("git checkout main", capture=False, check=False)
                continue

            # Rebase successful - push
            print("    → Rebase successful, pushing...")
            _, code = run_command(f"git push --force-with-lease origin {head_ref}", check=False)

            if code != 0:
                print("    ERROR: Push failed")
                skipped.append({"PR": pr_num, "Reason": "Push failed"})
                run_command("git checkout main", capture=False, check=False)
                continue

            # Verify merge status
            print("    → Verifying merge status...")
            time.sleep(2)
            verify_output, _ = run_command(f"gh pr view {pr_num} --json mergeable")
            verify_pr = json.loads(verify_output)

            if verify_pr['mergeable'] == "MERGEABLE":
                print("    ✓ Conflicts resolved successfully!")
                notify_discord("pr_fixed", "Scott Summers", pr_num, "Conflicts resolved via rebase")
                fixed.append(pr_num)
            else:
                print(f"    WARNING: Status still shows {verify_pr['mergeable']}")
                skipped.append({"PR": pr_num, "Reason": "Status verification failed"})

            run_command("git checkout main", capture=False, check=False)

        elif mergeable == "UNKNOWN":
            print("  [SKIP] Status checks pending")
            skipped.append({"PR": pr_num, "Reason": "Status checks pending"})

        elif mergeable == "MERGEABLE":
            print("  [SKIP] Already mergeable - ready for review")

            if age_hours > 24 and len(pr.get('commits', [])) == 0:
                print("  [WARNING] PR is stale (>24h, no commits)")

            skipped.append({"PR": pr_num, "Reason": "Already mergeable"})

        else:
            print(f"  [SKIP] Unknown merge status: {mergeable}")
            skipped.append({"PR": pr_num, "Reason": f"Unknown status: {mergeable}"})

    print()

    # Step 3: Cleanup
    print("[3/5] Cleanup...")
    run_command("git checkout main", capture=False, check=False)
    run_command("git pull origin main", capture=False, check=False)
    print("  ✓ Returned to main branch")

    # Step 4: Summary
    print()
    print("=== SUMMARY ===")
    print()

    if fixed:
        print(f"Fixed ({len(fixed)}):")
        for pr_num in fixed:
            print(f"  - PR #{pr_num}")
        print()

    if closed:
        print(f"Closed ({len(closed)}):")
        for pr_num in closed:
            print(f"  - PR #{pr_num}")
        print()

    if skipped:
        print(f"Skipped ({len(skipped)}):")
        for item in skipped:
            print(f"  - PR #{item['PR']}: {item['Reason']}")
        print()

    print("=== OPERATION COMPLETE ===")
    return 0

if __name__ == "__main__":
    sys.exit(main())
