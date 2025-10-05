#!/usr/bin/env python3
"""Cyclops PR Fetcher - Use gh API to get PR data"""

import subprocess
import json
import sys

def main():
    try:
        # Use gh api to fetch PRs
        result = subprocess.run(
            ['gh', 'api', 'repos/swedenhill/TestForAI/pulls', '-q', '.'],
            capture_output=True,
            text=True,
            encoding='utf-8',
            shell=True
        )

        if result.returncode != 0:
            print(f"Error: {result.stderr}", file=sys.stderr)
            sys.exit(1)

        prs_raw = json.loads(result.stdout)

        # Process each PR to extract needed fields
        prs = []
        for pr in prs_raw:
            # Fetch additional details for merge status
            pr_detail = subprocess.run(
                ['gh', 'api', f'repos/swedenhill/TestForAI/pulls/{pr["number"]}'],
                capture_output=True,
                text=True,
                encoding='utf-8',
                shell=True
            )

            if pr_detail.returncode == 0:
                detail = json.loads(pr_detail.stdout)
                prs.append({
                    'number': pr['number'],
                    'title': pr['title'],
                    'headRefName': pr['head']['ref'],
                    'mergeable': detail.get('mergeable_state', 'UNKNOWN').upper(),
                    'isDraft': pr['draft'],
                    'createdAt': pr['created_at'],
                    'updatedAt': pr['updated_at'],
                    'commits': pr['commits']
                })

        # Save and output
        with open('pr_cyclops_api.json', 'w', encoding='utf-8') as f:
            json.dump(prs, f, indent=2)

        print(json.dumps(prs, indent=2))

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
