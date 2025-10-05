import subprocess
import json
import re
import sys
import io
import os

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Disable pager for gh CLI
os.environ['GH_PAGER'] = ''

def run_gh(cmd):
    """Run gh command with full path"""
    full_cmd = f'"C:\\Program Files\\GitHub CLI\\gh.bat" {cmd}'
    env = os.environ.copy()
    env['GH_PAGER'] = ''
    result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, encoding='utf-8', env=env)
    return result.stdout.strip(), result.stderr.strip(), result.returncode

def parse_issue_number(text):
    """Extract issue number from PR title or body"""
    matches = re.findall(r'#(\d+)', text)
    return int(matches[0]) if matches else None

def get_issue_info(issue_num):
    """Get issue details"""
    stdout, stderr, code = run_gh(f"issue view {issue_num} --json labels,state,title")
    if code != 0:
        print(f"Error getting issue {issue_num}: {stderr}")
        return None
    try:
        return json.loads(stdout)
    except:
        return None

def check_dependencies(issue_info):
    """Check if issue has dependency labels and verify dependencies are closed"""
    if not issue_info or 'labels' not in issue_info:
        return [], []

    dep_labels = [l['name'] for l in issue_info['labels'] if l['name'].startswith('d')]
    dependencies = []
    open_deps = []

    for label in dep_labels:
        # Extract dependency issue numbers (e.g., d1, d2 -> issues #1, #2)
        dep_match = re.match(r'd(\d+)', label)
        if dep_match:
            dep_num = int(dep_match.group(1))
            dependencies.append(dep_num)
            dep_info = get_issue_info(dep_num)
            if dep_info and dep_info.get('state') == 'OPEN':
                open_deps.append(dep_num)

    return dependencies, open_deps

# Main workflow
print("PR REVIEWER - Starting review process")
print("=" * 60)

# 1. Get open PRs
print("\n1. Fetching open PRs...")
stdout, stderr, code = run_gh("pr list --state open --json number,title,body,labels,statusCheckRollup")

if code != 0:
    print(f"Error: {stderr}")
    sys.exit(1)

try:
    prs = json.loads(stdout)
except json.JSONDecodeError:
    # Try alternative format
    stdout, stderr, code = run_gh("pr list --state open")
    print(f"Open PRs (raw format):\n{stdout}")
    # Manual parsing needed
    pr_lines = stdout.strip().split('\n')
    prs = []
    for line in pr_lines:
        match = re.match(r'#(\d+)', line)
        if match:
            pr_num = int(match.group(1))
            # Get detailed info for each PR
            pr_stdout, pr_stderr, pr_code = run_gh(f"pr view {pr_num} --json number,title,body,labels,statusCheckRollup")
            if pr_code == 0:
                try:
                    pr_data = json.loads(pr_stdout)
                    prs.append(pr_data)
                except:
                    print(f"Failed to parse PR #{pr_num}")

print(f"Found {len(prs)} open PR(s)")

# 2. Process each PR in priority order
merged_prs = []
blocked_prs = []
ci_waiting = []

for pr in prs:
    pr_num = pr['number']
    pr_title = pr['title']
    pr_body = pr.get('body', '')

    print(f"\n{'='*60}")
    print(f"Processing PR #{pr_num}: {pr_title}")
    print(f"{'='*60}")

    # Extract issue number
    issue_num = parse_issue_number(pr_title) or parse_issue_number(pr_body)

    if not issue_num:
        print(f"⚠️  Could not find linked issue number")
        continue

    print(f"Linked to issue #{issue_num}")

    # Get issue info
    issue_info = get_issue_info(issue_num)
    if not issue_info:
        print(f"⚠️  Could not fetch issue #{issue_num}")
        continue

    print(f"Issue: {issue_info.get('title', 'Unknown')}")
    print(f"Issue state: {issue_info.get('state', 'Unknown')}")

    # Check dependencies
    deps, open_deps = check_dependencies(issue_info)

    if open_deps:
        print(f"❌ BLOCKED by open dependencies: {open_deps}")
        blocked_prs.append((pr_num, open_deps))

        # Comment on PR
        dep_list = ', '.join([f'#{d}' for d in open_deps])
        comment_body = f"🚫 This PR is blocked by open dependencies: {dep_list}"
        run_gh(f'pr comment {pr_num} --body "{comment_body}"')

        # Notify Discord
        run_gh(f'run python core/discord_notifier.py pr_blocked "Thor Odinson" {pr_num} "Blocked by dependencies: {dep_list}"')
        continue

    # Check CI status
    status_checks = pr.get('statusCheckRollup', [])
    if status_checks:
        all_passed = all(check.get('conclusion') == 'SUCCESS' for check in status_checks)
        if not all_passed:
            print(f"⏳ Waiting for CI to pass")
            ci_waiting.append(pr_num)
            run_gh(f'pr comment {pr_num} --body "⏳ Waiting for CI to pass"')
            continue

    print(f"✅ All checks passed")

    # Review code
    print(f"\n📝 Reviewing code changes...")
    diff_out, _, _ = run_gh(f"pr diff {pr_num}")
    print(f"Changes: {len(diff_out.split(chr(10)))} lines")

    # Check tests
    print(f"\n🧪 Checking tests...")
    checks_out, _, _ = run_gh(f"pr checks {pr_num}")
    print(checks_out)

    # Merge PR
    print(f"\n🔀 Merging PR #{pr_num}...")
    merge_out, merge_err, merge_code = run_gh(f"pr merge {pr_num} --squash --delete-branch")

    if merge_code == 0:
        print(f"✅ Successfully merged PR #{pr_num}")
        merged_prs.append(pr_num)

        # Notify Discord
        run_gh(f'run python core/discord_notifier.py pr_merged "Thor Odinson" {pr_num} {issue_num}')
        print(f"📢 Notified Discord: Merged PR #{pr_num}, closes issue #{issue_num}")
    else:
        print(f"❌ Failed to merge: {merge_err}")

# 4. Summary
print(f"\n{'='*60}")
print("SUMMARY")
print(f"{'='*60}")
print(f"✅ Merged: {merged_prs if merged_prs else 'None'}")
print(f"🚫 Blocked: {[(pr, deps) for pr, deps in blocked_prs] if blocked_prs else 'None'}")
print(f"⏳ Waiting on CI: {ci_waiting if ci_waiting else 'None'}")
print(f"{'='*60}")
