#!/usr/bin/env python3
import subprocess
import json
import sys
import re
from datetime import datetime

def run_gh_command(cmd):
    """Run GitHub CLI command and return output"""
    try:
        # Use full path to gh on Windows
        gh_path = r'C:\Program Files\GitHub CLI\gh.exe'

        # Parse command into list
        import shlex
        parts = shlex.split(cmd.replace('gh ', '', 1))

        result = subprocess.run(
            [gh_path] + parts,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        output = result.stdout.strip()
        if result.returncode != 0 and result.stderr:
            print(f"GH Error: {result.stderr.strip()}")
        return output, result.returncode
    except Exception as e:
        print(f"Error running command: {e}")
        return None, 1

def get_open_prs():
    """Fetch all open PRs"""
    cmd = 'gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body,createdAt'
    output, code = run_gh_command(cmd)
    if code != 0 or not output:
        print(f"Failed to fetch PRs - code: {code}, output: '{output}'")
        return []
    try:
        prs = json.loads(output)
        return prs
    except json.JSONDecodeError as e:
        print(f"Failed to parse PR JSON: {e}")
        print(f"Output was: {output[:200]}")
        return []

def extract_issue_number(pr):
    """Extract issue number from PR title or body"""
    # Try title first
    title_match = re.search(r'(?:Fixes|Closes|Resolves)\s+#(\d+)', pr['title'], re.IGNORECASE)
    if title_match:
        return int(title_match.group(1))

    # Try body
    body = pr.get('body', '')
    body_match = re.search(r'(?:Fixes|Closes|Resolves)\s+#(\d+)', body, re.IGNORECASE)
    if body_match:
        return int(body_match.group(1))

    return None

def get_issue_details(issue_num):
    """Get issue details including labels and state"""
    cmd = f'gh issue view {issue_num} --json labels,state,title'
    output, code = run_gh_command(cmd)
    if code != 0 or not output:
        return None
    try:
        return json.loads(output)
    except:
        return None

def get_priority(labels):
    """Extract priority from labels"""
    priority_order = {'critical': 0, 'urgent': 1, 'high': 2, 'medium': 3, 'low': 4}
    for label in labels:
        label_name = label['name'].lower()
        if label_name in priority_order:
            return priority_order[label_name], label_name
    return 5, 'none'

def get_dependencies(labels):
    """Extract dependency numbers from labels (d1, d2, etc)"""
    deps = []
    for label in labels:
        match = re.match(r'd(\d+)', label['name'].lower())
        if match:
            deps.append(int(match.group(1)))
    return deps

def check_dependencies_closed(deps):
    """Check if all dependency issues are closed"""
    open_deps = []
    for dep in deps:
        issue = get_issue_details(dep)
        if issue and issue['state'] != 'CLOSED':
            open_deps.append(dep)
    return open_deps

def check_ci_status(pr):
    """Check if all CI checks passed"""
    rollup = pr.get('statusCheckRollup')
    if not rollup:
        return True, "No CI checks"

    for check in rollup:
        if check.get('conclusion') not in ['SUCCESS', 'SKIPPED', 'NEUTRAL']:
            if check.get('status') == 'IN_PROGRESS':
                return False, f"CI in progress: {check.get('name', 'unknown')}"
            return False, f"CI failed: {check.get('name', 'unknown')}"
    return True, "All checks passed"

def notify_discord(event_type, agent, pr_num, message):
    """Send Discord notification"""
    cmd = f'python core/discord_notifier.py {event_type} "{agent}" {pr_num} "{message}"'
    run_gh_command(cmd)

def merge_pr(pr_num, issue_num):
    """Merge PR using squash merge"""
    cmd = f'gh pr merge {pr_num} --squash --delete-branch'
    output, code = run_gh_command(cmd)
    return code == 0, output

def comment_on_pr(pr_num, message):
    """Add comment to PR"""
    # Escape quotes in message
    message = message.replace('"', '\\"')
    cmd = f'gh pr comment {pr_num} --body "{message}"'
    run_gh_command(cmd)

def main():
    print("Thor PR Reviewer - Fetching open PRs...")

    prs = get_open_prs()
    if not prs:
        print("No open PRs found")
        return

    print(f"Found {len(prs)} open PR(s)")

    # Enrich PRs with issue data and priority
    pr_data = []
    for pr in prs:
        issue_num = extract_issue_number(pr)
        if not issue_num:
            print(f"PR #{pr['number']}: Could not find linked issue, skipping")
            continue

        issue = get_issue_details(issue_num)
        if not issue:
            print(f"PR #{pr['number']}: Could not fetch issue #{issue_num}, skipping")
            continue

        priority_val, priority_name = get_priority(issue['labels'])
        deps = get_dependencies(issue['labels'])

        pr_data.append({
            'pr': pr,
            'issue_num': issue_num,
            'issue': issue,
            'priority': priority_val,
            'priority_name': priority_name,
            'dependencies': deps,
            'created_at': pr['createdAt']
        })

    # Sort by priority (lower is higher priority), then by creation date (older first)
    pr_data.sort(key=lambda x: (x['priority'], x['created_at']))

    # Process each PR
    merged = []
    blocked = []
    waiting_ci = []

    for data in pr_data:
        pr = data['pr']
        pr_num = pr['number']
        issue_num = data['issue_num']
        deps = data['dependencies']
        priority = data['priority_name'].upper()

        print(f"\n{'='*60}")
        print(f"PR #{pr_num}: {pr['title']}")
        print(f"Priority: {priority} | Issue: #{issue_num}")

        # Check dependencies
        if deps:
            print(f"Checking dependencies: {deps}")
            open_deps = check_dependencies_closed(deps)
            if open_deps:
                dep_list = ', '.join([f'#{d}' for d in open_deps])
                msg = f"Blocked by open dependencies: {dep_list}"
                print(f"❌ {msg}")
                comment_on_pr(pr_num, f"⚠️ This PR is blocked by open dependencies: {dep_list}")
                notify_discord('pr_blocked', 'Thor Odinson', pr_num, msg)
                blocked.append({'pr': pr_num, 'reason': msg})
                continue

        # Check CI
        ci_passed, ci_msg = check_ci_status(pr)
        if not ci_passed:
            print(f"⏳ {ci_msg}")
            waiting_ci.append({'pr': pr_num, 'reason': ci_msg})
            continue

        print(f"✅ All checks passed, merging...")

        # Merge PR
        success, output = merge_pr(pr_num, issue_num)
        if success:
            print(f"✅ Merged PR #{pr_num}, closes issue #{issue_num}")
            notify_discord('pr_merged', 'Thor Odinson', pr_num, str(issue_num))
            merged.append(pr_num)
        else:
            print(f"❌ Failed to merge: {output}")
            blocked.append({'pr': pr_num, 'reason': f'Merge failed: {output}'})

    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Merged: {merged if merged else 'None'}")
    blocked_str = [f"#{b['pr']}: {b['reason']}" for b in blocked] if blocked else 'None'
    waiting_str = [f"#{w['pr']}: {w['reason']}" for w in waiting_ci] if waiting_ci else 'None'
    print(f"Blocked: {blocked_str}")
    print(f"Waiting on CI: {waiting_str}")

if __name__ == "__main__":
    main()
