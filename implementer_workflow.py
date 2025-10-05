#!/usr/bin/env python3
import subprocess
import json
import sys
from datetime import datetime

def run_gh_command(args):
    """Run gh command and return output"""
    cmd = ["C:\\Program Files\\GitHub CLI\\gh.bat"] + args
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30, encoding='utf-8', errors='replace')
    if result.returncode != 0:
        print(f"Error running command: {' '.join(args)}", file=sys.stderr)
        print(f"Error: {result.stderr}", file=sys.stderr)
        return None
    return result.stdout.strip()

def run_gh_api(endpoint):
    """Run GitHub API command and return JSON output"""
    try:
        result = subprocess.run(
            ["C:\\Program Files\\GitHub CLI\\gh.bat", "api", endpoint],
            capture_output=True,
            text=True,
            timeout=30,
            encoding='utf-8',
            errors='replace'
        )
        # gh.bat may return non-zero even on success, check for output
        if result.stdout.strip():
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}", file=sys.stderr)
                print(f"Output: {result.stdout[:500]}", file=sys.stderr)
                return None
        print(f"No output from API call (returncode={result.returncode})", file=sys.stderr)
        if result.stderr:
            print(f"STDERR: {result.stderr[:500]}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Error running gh api: {e}", file=sys.stderr)
        return None

def get_all_issues():
    """Fetch all open issues with JSON data using API"""
    issues = run_gh_api("repos/irsiksoftware/TestForAI/issues?state=open&per_page=100")
    if not issues:
        return []

    # Filter out PRs and convert to consistent format
    filtered = []
    for issue in issues:
        # Skip PRs
        if 'pull_request' in issue:
            continue

        filtered.append({
            'number': issue['number'],
            'title': issue['title'],
            'labels': [{'name': label['name']} for label in issue.get('labels', [])],
            'createdAt': issue['created_at']
        })

    return filtered

def has_wip_label(issue):
    """Check if issue has 'wip' label"""
    return any(label.get('name', '').lower() == 'wip' for label in issue.get('labels', []))

def get_priority(issue):
    """Get priority level from labels"""
    priority_map = {
        'CRITICAL': 5,
        'URGENT': 4,
        'HIGH': 3,
        'MEDIUM': 2,
        'LOW': 1
    }
    for label in issue.get('labels', []):
        label_name = label.get('name', '').upper()
        if label_name in priority_map:
            return priority_map[label_name]
    return 0

def get_dependencies(issue):
    """Get dependency issue numbers from labels (d1, d2, etc.)"""
    deps = []
    for label in issue.get('labels', []):
        label_name = label.get('name', '').lower()
        if label_name.startswith('d') and label_name[1:].isdigit():
            deps.append(int(label_name[1:]))
    return deps

def check_issue_status(issue_num):
    """Check if an issue is closed"""
    data = run_gh_api(f"repos/irsiksoftware/TestForAI/issues/{issue_num}")
    if not data:
        return "UNKNOWN"
    return data.get('state', 'UNKNOWN').upper()

def find_claimable_issue(skip_issues=None):
    """Find first claimable issue following priority and dependency rules"""
    if skip_issues is None:
        skip_issues = set()

    issues = get_all_issues()
    print(f"Total issues fetched: {len(issues)}", file=sys.stderr)

    # Filter out WIP issues and previously checked issues
    available_issues = [i for i in issues if not has_wip_label(i) and i['number'] not in skip_issues]
    print(f"Available issues (no WIP): {len(available_issues)}", file=sys.stderr)

    # Sort by priority (high to low), then by creation date (oldest first)
    sorted_issues = sorted(
        available_issues,
        key=lambda x: (-get_priority(x), x.get('createdAt', ''))
    )

    # Find first issue with no open dependencies
    for issue in sorted_issues:
        issue_num = issue['number']
        priority = get_priority(issue)
        priority_name = 'LOW'
        for label in issue.get('labels', []):
            ln = label.get('name', '').upper()
            if ln in ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']:
                priority_name = ln
                break

        deps = get_dependencies(issue)

        print(f"Checking #{issue_num} [{priority_name}]: {issue['title']}", file=sys.stderr)

        if not deps:
            # No dependencies, this is claimable
            print(f"Found claimable issue: #{issue_num}", file=sys.stderr)
            return issue

        # Check all dependencies
        print(f"  Dependencies: {deps}", file=sys.stderr)
        blocked = False
        for dep in deps:
            status = check_issue_status(dep)
            if status != 'CLOSED':
                print(f"  Skipping #{issue_num} - blocked by #{dep} (status: {status})", file=sys.stderr)
                blocked = True
                break
            else:
                print(f"  Dependency #{dep} is CLOSED", file=sys.stderr)

        if not blocked:
            print(f"Found claimable issue: #{issue_num}", file=sys.stderr)
            return issue

    return None

if __name__ == "__main__":
    issue = find_claimable_issue()
    if issue:
        print(json.dumps(issue, indent=2))
    else:
        print("NO_CLAIMABLE_ISSUE", file=sys.stderr)
        sys.exit(1)
