import subprocess
import json
import sys

# Run gh command to get JSON output
try:
    result = subprocess.run(
        [r'C:\Program Files\GitHub CLI\gh.bat', 'issue', 'list', '--state', 'open', '--json', 'number,title,labels', '--limit', '1000'],
        capture_output=True,
        text=True,
        check=True,
        shell=True
    )

    # Parse JSON
    issues = json.loads(result.stdout)

    # Save to file
    with open('issues_fetched.json', 'w', encoding='utf-8') as f:
        json.dump(issues, f, indent=2, ensure_ascii=False)

    print(f"Successfully fetched {len(issues)} issues")

except subprocess.CalledProcessError as e:
    print(f"Error running gh command: {e}")
    print(f"stderr: {e.stderr}")
    sys.exit(1)
except json.JSONDecodeError as e:
    print(f"Error parsing JSON: {e}")
    print(f"Output was: {result.stdout[:500]}")
    sys.exit(1)
