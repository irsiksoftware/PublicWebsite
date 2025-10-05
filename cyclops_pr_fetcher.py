#!/usr/bin/env python3
"""Cyclops PR Fetcher - Get open PRs with merge status"""
import subprocess
import json
import sys

def fetch_prs():
    """Fetch open PRs using gh CLI"""
    try:
        # Run gh pr list command
        result = subprocess.run(
            ['gh', 'pr', 'list', '--repo', 'irsiksoftware/TestForAI', '--state', 'open',
             '--json', 'number,title,mergeable,headRefName,isDraft,createdAt,author,url,commits'],
            capture_output=True,
            text=True,
            check=True
        )

        prs = json.loads(result.stdout)

        # Save to file
        with open('cyclops_prs_json.json', 'w') as f:
            json.dump(prs, f, indent=2)

        print(f"Fetched {len(prs)} open PRs:\n")

        for pr in prs:
            print(f"PR #{pr['number']}: {pr['title']}")
            print(f"  Branch: {pr['headRefName']}")
            print(f"  Mergeable: {pr.get('mergeable', 'UNKNOWN')}")
            print(f"  Draft: {pr['isDraft']}")
            print(f"  Created: {pr['createdAt']}")
            print(f"  Commits: {len(pr.get('commits', []))}")
            print(f"  URL: {pr['url']}")
            print()

        return prs

    except subprocess.CalledProcessError as e:
        print(f"Error running gh command: {e}")
        print(f"stderr: {e.stderr}")
        return []
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        print(f"Output was: {result.stdout}")
        return []
    except Exception as e:
        print(f"Unexpected error: {e}")
        return []

if __name__ == "__main__":
    prs = fetch_prs()
    sys.exit(0 if prs else 1)
