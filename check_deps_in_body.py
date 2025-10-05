import subprocess
import json
import re

# Run gh command
cmd = [r'C:\Program Files\GitHub CLI\gh.bat', 'api', '--method', 'GET', 'repos/:owner/:repo/issues', '-F', 'state=open', '-F', 'per_page=100']
result = subprocess.run(cmd, capture_output=True, text=True, shell=True, encoding='utf-8', errors='replace')

issues = json.loads(result.stdout)

print("Checking for dependencies mentioned in issue descriptions...\n")

for issue in issues[:10]:
    num = issue['number']
    title = issue['title']
    body = issue.get('body', '') or ''

    # Look for "Depends on: #X" or similar patterns
    deps_pattern = r'(?:Depends on:|depends on:|Dependency:|dependency:)\s*#(\d+)'
    deps = re.findall(deps_pattern, body, re.IGNORECASE)

    if deps:
        print(f"Issue #{num}: {title}")
        print(f"  Dependencies found in description: {', '.join(['#' + d for d in deps])}")
        print()
