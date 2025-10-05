import subprocess
import json

def run_gh(args):
    cmd = [r'C:\Program Files\GitHub CLI\gh.bat'] + args
    result = subprocess.run(cmd, capture_output=True, text=True, shell=True, encoding='utf-8', errors='replace')
    return result.stdout.strip()

# Get a few sample issues
stdout = run_gh(['api', '--method', 'GET', 'repos/:owner/:repo/issues', '-F', 'state=open', '-F', 'per_page=10'])
issues = json.loads(stdout)

print("SAMPLE VERIFICATION - First 10 Open Issues")
print("=" * 80)

priorities = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']
types = ['testing', 'bug', 'feature']

for issue in issues:
    num = issue['number']
    title = issue['title']
    label_names = [l['name'] for l in issue['labels']]

    # Check priority labels
    priority_labels = [l for l in label_names if l in priorities]
    type_labels = [l for l in label_names if l in types]

    print(f"\nIssue #{num}: {title}")
    print(f"  All Labels: {', '.join(label_names) if label_names else 'NONE'}")
    print(f"  Priority: {', '.join(priority_labels) if priority_labels else 'MISSING'}")
    print(f"  Type: {', '.join(type_labels) if type_labels else 'MISSING'}")

    # Check for issues
    issues_found = []
    if len(priority_labels) == 0:
        issues_found.append("Missing priority label")
    elif len(priority_labels) > 1:
        issues_found.append(f"Multiple priorities: {', '.join(priority_labels)}")

    if len(type_labels) == 0:
        # Check if title suggests a type
        title_lower = title.lower()
        if any(word in title_lower for word in ['test', 'testing']):
            issues_found.append("Missing 'testing' label (suggested by title)")
        elif any(word in title_lower for word in ['bug', 'fix', 'error']):
            issues_found.append("Missing 'bug' label (suggested by title)")
        elif any(word in title_lower for word in ['feature', 'add', 'create', 'implement', 'build', 'design']):
            issues_found.append("Missing 'feature' label (suggested by title)")

    if issues_found:
        print(f"  Issues: {'; '.join(issues_found)}")
    else:
        print(f"  Status: ✓ Healthy")

print("\n" + "=" * 80)
