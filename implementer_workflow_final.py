import subprocess
import json
import sys

def run_cmd(cmd):
    """Run command and return output"""
    result = subprocess.run(cmd, capture_output=True, text=True, shell=True, encoding='utf-8', errors='ignore')
    return result.stdout.strip(), result.stderr.strip(), result.returncode

def get_issue_details(issue_num):
    """Get issue details via gh CLI"""
    stdout, stderr, code = run_cmd(f'gh issue view {issue_num} --json number,title,labels,body,state,createdAt')
    if code == 0:
        return json.loads(stdout)
    return None

# Fetch all open issues
print("Fetching open issues...", file=sys.stderr)
stdout, stderr, code = run_cmd('gh api "repos/:owner/:repo/issues?state=open&per_page=100"')

if code != 0:
    print(f"Error fetching issues: {stderr}", file=sys.stderr)
    sys.exit(1)

issues = json.loads(stdout)

# Priority mapping
priority_map = {
    'CRITICAL': 0,
    'URGENT': 1,
    'HIGH': 2,
    'MEDIUM': 3,
    'LOW': 4
}

# Filter and sort issues
available_issues = []
for issue in issues:
    # Skip PRs
    if 'pull_request' in issue:
        continue

    labels = [label['name'].lower() for label in issue['labels']]

    # Skip if has wip label
    if 'wip' in labels:
        print(f"Skipping #{issue['number']} - has WIP label", file=sys.stderr)
        continue

    # Determine priority
    priority = 4  # Default to LOW
    priority_name = 'LOW'
    for label in issue['labels']:
        label_name = label['name'].upper()
        if label_name in priority_map:
            priority = priority_map[label_name]
            priority_name = label_name
            break

    # Extract dependency labels (d1, d2, etc.)
    dependencies = []
    for label in issue['labels']:
        if label['name'].startswith('d') and label['name'][1:].replace('#', '').isdigit():
            dep_num = label['name'][1:].replace('#', '')
            dependencies.append(int(dep_num))

    available_issues.append({
        'number': issue['number'],
        'title': issue['title'],
        'priority': priority,
        'priority_name': priority_name,
        'created_at': issue['created_at'],
        'dependencies': dependencies
    })

# Sort by priority (ascending), then by created_at (oldest first)
available_issues.sort(key=lambda x: (x['priority'], x['created_at']))

print(f"\nFound {len(available_issues)} available issues (excluding WIP)\n", file=sys.stderr)

# Try to find claimable issue
for issue in available_issues:
    print(f"Checking #{issue['number']} [{issue['priority_name']}] {issue['title']}", file=sys.stderr)

    # Check if has dependencies
    if issue['dependencies']:
        blocked = False
        for dep_num in issue['dependencies']:
            # Check if dependency is closed
            dep_info = get_issue_details(dep_num)
            if dep_info and dep_info['state'] == 'OPEN':
                print(f"  Skipping #{issue['number']} - blocked by #{dep_num}", file=sys.stderr)
                blocked = True
                break

        if blocked:
            continue

    # Found claimable issue!
    print(f"\n✓ Found claimable issue: #{issue['number']}", file=sys.stderr)
    print(json.dumps(issue))
    sys.exit(0)

# No claimable issues found
print("\nNo claimable issues found. All issues are either WIP or blocked by dependencies.", file=sys.stderr)
sys.exit(1)
