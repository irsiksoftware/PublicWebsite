import subprocess
import json
import re

# Priority labels
PRIORITY_LABELS = {'CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'}

# Get all open issues
print("Fetching all open issues...")
result = subprocess.run([
    'C:\\Program Files\\GitHub CLI\\gh.bat',
    'issue', 'list',
    '--state', 'open',
    '--limit', '1000',
    '--json', 'number,title,labels'
], capture_output=True, text=True)

try:
    issues = json.loads(result.stdout)
except:
    # Fallback: parse from text output
    print("Warning: Could not parse JSON, using text parsing")
    issues = []

# Analysis results
broken_deps = []
missing_priority = []
multiple_priority = []
missing_type = []

print(f"\nAnalyzing {len(issues)} issues...")

for issue in issues:
    num = issue['number']
    title = issue['title']
    labels = [l['name'] for l in issue['labels']]

    print(f"  Issue #{num}: {title}")
    print(f"    Labels: {', '.join(labels) if labels else 'None'}")

    # Check for dependency labels (d1, d2, d3, etc.)
    dep_labels = [l for l in labels if re.match(r'^d\d+$', l)]
    for dep_label in dep_labels:
        dep_num = dep_label[1:]  # Remove 'd' prefix
        print(f"    Checking dependency: #{dep_num}")
        # Check if dependency exists
        check = subprocess.run([
            'C:\\Program Files\\GitHub CLI\\gh.bat',
            'issue', 'view', dep_num,
            '--json', 'number,state'
        ], capture_output=True, text=True)

        if 'Could not resolve' in check.stderr or check.returncode != 0:
            broken_deps.append((num, dep_num, dep_label))
            print(f"      BROKEN: Issue #{num} depends on non-existent #{dep_num}")

    # Check priority labels
    priority_count = [l for l in labels if l in PRIORITY_LABELS]
    if len(priority_count) == 0:
        missing_priority.append(num)
        print(f"      MISSING PRIORITY")
    elif len(priority_count) > 1:
        multiple_priority.append((num, priority_count))
        print(f"      MULTIPLE PRIORITY: {priority_count}")

    # Check for type labels based on title
    title_lower = title.lower()
    has_type = False

    if any(l in labels for l in ['testing', 'bug', 'feature', 'enhancement', 'documentation']):
        has_type = True

    # Check title keywords
    needs_testing = any(word in title_lower for word in ['test', 'testing'])
    needs_bug = any(word in title_lower for word in ['bug', 'fix', 'error'])
    needs_feature = any(word in title_lower for word in ['feature', 'add', 'create', 'implement', 'build'])

    if needs_testing and 'testing' not in labels:
        missing_type.append((num, 'testing'))
        print(f"      MISSING TYPE: testing")

    if needs_bug and 'bug' not in labels:
        missing_type.append((num, 'bug'))
        print(f"      MISSING TYPE: bug")

    if needs_feature and 'feature' not in labels and not needs_testing and not needs_bug:
        missing_type.append((num, 'feature'))
        print(f"      MISSING TYPE: feature")

# Summary
print("\n" + "="*60)
print("AUDIT SUMMARY")
print("="*60)
print(f"Total issues analyzed: {len(issues)}")
print(f"Broken dependencies: {len(broken_deps)}")
print(f"Missing priority labels: {len(missing_priority)}")
print(f"Multiple priority labels: {len(multiple_priority)}")
print(f"Missing type labels: {len(missing_type)}")

# Save results
results = {
    'broken_deps': broken_deps,
    'missing_priority': missing_priority,
    'multiple_priority': multiple_priority,
    'missing_type': missing_type
}

with open('audit_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\nResults saved to audit_results.json")
