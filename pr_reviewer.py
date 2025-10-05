import subprocess
import json
import sys

def run_gh_command(cmd):
    """Run gh command and return output"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error running command: {cmd}")
        print(f"stderr: {result.stderr}")
        return None
    return result.stdout.strip()

# Get open PRs
print("Fetching open PRs...")
pr_list = run_gh_command("gh pr list --state open --json number,title,body,labels,statusCheckRollup")

if pr_list:
    try:
        prs = json.loads(pr_list)
        print(f"Found {len(prs)} open PR(s)")
        print(json.dumps(prs, indent=2))
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {e}")
        print(f"Raw output: {pr_list}")
else:
    print("No PRs found or error occurred")
