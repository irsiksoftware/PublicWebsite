import subprocess
import re
import json

def run_gh_command(args):
    """Run GitHub CLI command"""
    cmd = [r"C:\Program Files\GitHub CLI\gh.bat"] + args
    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    return result.stdout, result.stderr, result.returncode

def parse_issue_line(line):
    """Parse issue line from gh issue list output"""
    # Format: #138 [OPEN] [LOW, feature, testing] Create comprehensive feature test page
    match = re.match(r'#(\d+)\s+\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.+)', line.strip())
    if not match:
        return None

    number = int(match.group(1))
    state = match.group(2)
    labels_str = match.group(3)
    title = match.group(4)

    labels = [l.strip() for l in labels_str.split(',')]

    return {
        'number': number,
        'state': state,
        'labels': labels,
        'title': title
    }

def has_wip_label(labels):
    """Check if issue has WIP label"""
    return any(label.lower() == 'wip' for label in labels)

def get_priority_value(labels):
    """Get priority value (higher is more important)"""
    priority_map = {'critical': 5, 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1}
    for label in labels:
        label_lower = label.lower()
        if label_lower in priority_map:
            return priority_map[label_lower]
    return 0

def get_dependency_labels(labels):
    """Extract dependency issue numbers from labels like d77, d104, etc."""
    deps = []
    for label in labels:
        if label.lower().startswith('d') and label[1:].isdigit():
            deps.append(int(label[1:]))
    return deps

def check_issue_state(issue_num):
    """Check if an issue is closed"""
    stdout, stderr, code = run_gh_command(['issue', 'view', str(issue_num)])
    if code != 0:
        return 'unknown'
    # Look for state in output
    for line in stdout.split('\n'):
        if 'state:' in line.lower() or 'status:' in line.lower():
            if 'closed' in line.lower():
                return 'closed'
            if 'open' in line.lower():
                return 'open'
    # Check if contains "closed" anywhere
    if 'closed' in stdout.lower():
        return 'closed'
    return 'open'

def main():
    print("Fetching open issues without WIP label...")
    stdout, stderr, code = run_gh_command(['issue', 'list', '--label', '!wip', '--state', 'open', '--limit', '100'])

    if code != 0:
        print(f"Error: {stderr}")
        return

    # Parse issues
    issues = []
    for line in stdout.strip().split('\n'):
        if line.strip():
            issue = parse_issue_line(line)
            if issue:
                issues.append(issue)

    print(f"Found {len(issues)} issues without WIP label\n")

    if not issues:
        print("No available issues.")
        return

    # Sort by priority (desc) then by issue number (asc - older issues have lower numbers)
    issues.sort(key=lambda x: (-get_priority_value(x['labels']), x['number']))

    # Try to find claimable issue
    for issue in issues:
        num = issue['number']
        title = issue['title']
        labels = issue['labels']
        priority = next((l for l in labels if l.upper() in ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']), 'NONE')

        # Safety check for WIP
        if has_wip_label(labels):
            print(f"Skipping #{num} - has WIP label (safety check)")
            continue

        # Check dependencies
        deps = get_dependency_labels(labels)
        if deps:
            print(f"Checking dependencies for #{num}: {deps}")
            blocked = False
            for dep in deps:
                state = check_issue_state(dep)
                print(f"  #{dep}: {state}")
                if state != 'closed':
                    print(f"Skipping #{num} - blocked by #{dep} ({state})")
                    blocked = True
                    break
            if blocked:
                continue
            print(f"  All dependencies closed, proceeding with #{num}")

        # Found claimable issue!
        print(f"\n{'='*50}")
        print(f"CLAIMABLE ISSUE FOUND")
        print(f"{'='*50}")
        print(f"Number: #{num}")
        print(f"Title: {title}")
        print(f"Priority: {priority}")
        print(f"Labels: {', '.join(labels)}")

        # Save to file for the main script
        with open('claimable_issue_work.json', 'w') as f:
            json.dump({
                'number': num,
                'title': title,
                'priority': priority,
                'labels': labels
            }, f, indent=2)

        return

    print("\n" + "="*50)
    print("All issues are blocked or have WIP label")
    print("="*50)

if __name__ == "__main__":
    main()
