#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Thor Odinson - PR Reviewer and Merger
Reviews and merges ready PRs following dependency rules
PRIORITY ORDER: CRITICAL > URGENT > HIGH > MEDIUM > LOW
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# GitHub API Configuration
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN', '')
REPO_OWNER = 'irsiksoftware'
REPO_NAME = 'TestForAI'
API_BASE = f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}'

PRIORITY_ORDER = {
    'critical': 5,
    'urgent': 4,
    'high': 3,
    'medium': 2,
    'low': 1,
    'none': 0
}

class ThorPRMerger:
    def __init__(self):
        self.merged_prs = []
        self.blocked_prs = []
        self.waiting_ci = []
        self.failed_reviews = []
        self.issue_cache = {}  # Cache for issue lookups
        self.dry_run = not bool(GITHUB_TOKEN)  # Dry run mode if no token

    def run_command(self, cmd: List[str], shell: bool = False) -> Tuple[int, str, str]:
        """Run a command and return exit code, stdout, stderr"""
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                shell=shell
            )
            return result.returncode, result.stdout, result.stderr
        except Exception as e:
            return 1, '', str(e)

    def api_get(self, endpoint: str) -> Optional[Dict]:
        """Make GET request to GitHub API"""
        headers = {
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github.v3+json'
        }

        url = f'{API_BASE}{endpoint}'
        cmd = ['curl', '-s', '-H', f'Authorization: token {GITHUB_TOKEN}',
               '-H', 'Accept: application/vnd.github.v3+json', url]

        code, stdout, stderr = self.run_command(cmd)

        if code != 0:
            print(f"API Error: {stderr}")
            return None

        try:
            return json.loads(stdout)
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            return None

    def api_post(self, endpoint: str, data: Dict) -> Optional[Dict]:
        """Make POST request to GitHub API"""
        url = f'{API_BASE}{endpoint}'
        cmd = ['curl', '-s', '-X', 'POST',
               '-H', f'Authorization: token {GITHUB_TOKEN}',
               '-H', 'Accept: application/vnd.github.v3+json',
               '-d', json.dumps(data), url]

        code, stdout, stderr = self.run_command(cmd)

        if code != 0:
            return None

        try:
            return json.loads(stdout)
        except json.JSONDecodeError:
            return None

    def fetch_prs(self) -> List[Dict]:
        """Fetch all open PRs using GitHub API or cached data"""
        print("⚡ Thor: Fetching open pull requests...")

        # Try to use cached PR data if API fails
        cache_file = 'cyclops_api_prs_real.json'

        if GITHUB_TOKEN:
            prs = self.api_get('/pulls?state=open&per_page=100')

            if prs is None:
                print(f"⚠️  API failed, using cached data from {cache_file}")
            elif isinstance(prs, list):
                print(f"✓ Found {len(prs)} open PRs from API")
                return prs
            else:
                print(f"⚠️  Unexpected API response, using cached data")

        # Use cached data
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if 'value' in data:
                        prs = data['value']
                    elif isinstance(data, list):
                        prs = data
                    else:
                        return []

                    print(f"✓ Loaded {len(prs)} PRs from cache")
                    return prs
            except Exception as e:
                print(f"❌ Failed to load cache: {e}")
                return []
        else:
            print(f"❌ No cached data available")
            return []

    def get_issue_from_pr(self, pr: Dict) -> Optional[int]:
        """Extract issue number from PR body or title"""
        # Check PR body first
        body = pr.get('body', '') or ''
        title = pr.get('title', '') or ''

        # Look for "Fixes #N", "Closes #N", etc.
        patterns = [
            r'[Ff]ixes?\s+#(\d+)',
            r'[Cc]loses?\s+#(\d+)',
            r'[Rr]esolves?\s+#(\d+)',
            r'#(\d+)'
        ]

        for pattern in patterns:
            match = re.search(pattern, body + ' ' + title)
            if match:
                return int(match.group(1))

        return None

    def fetch_issue(self, issue_num: int) -> Optional[Dict]:
        """Fetch issue details from GitHub API"""
        return self.api_get(f'/issues/{issue_num}')

    def get_priority_from_labels(self, labels: List[Dict]) -> str:
        """Extract priority from issue labels"""
        for label in labels:
            label_name = label.get('name', '').lower()
            if label_name in PRIORITY_ORDER:
                return label_name
        return 'none'

    def get_dependencies_from_labels(self, labels: List[Dict]) -> List[int]:
        """Extract dependency issue numbers from labels (d1, d2, etc.)"""
        deps = []
        for label in labels:
            label_name = label.get('name', '')
            match = re.match(r'd(\d+)', label_name)
            if match:
                deps.append(int(match.group(1)))
        return deps

    def check_dependencies(self, issue_num: int, deps: List[int]) -> Tuple[bool, List[int]]:
        """Check if all dependency issues are closed"""
        open_deps = []

        for dep_num in deps:
            dep_issue = self.fetch_issue(dep_num)
            if not dep_issue:
                print(f"  ⚠️  Could not fetch dependency #{dep_num}")
                continue

            if dep_issue.get('state') == 'open':
                open_deps.append(dep_num)

        return len(open_deps) == 0, open_deps

    def check_pr_status(self, pr: Dict) -> Tuple[bool, str]:
        """Check PR CI status"""
        pr_num = pr['number']

        # Get PR status checks
        status = self.api_get(f'/commits/{pr["head"]["sha"]}/status')

        if status is None:
            return False, "Could not fetch CI status"

        state = status.get('state', 'pending')

        if state == 'success':
            return True, "CI passed"
        elif state == 'pending':
            return False, "CI pending"
        elif state == 'failure':
            return False, "CI failed"
        else:
            # No CI checks configured, allow merge
            return True, "No CI checks"

    def comment_on_pr(self, pr_num: int, comment: str) -> bool:
        """Add a comment to a PR"""
        result = self.api_post(f'/issues/{pr_num}/comments', {'body': comment})
        return result is not None

    def notify_discord(self, event_type: str, agent: str, pr_num: int, message: str = ''):
        """Send Discord notification"""
        if not os.path.exists('core/discord_notifier.py'):
            return

        cmd = [
            'python', 'core/discord_notifier.py',
            event_type, agent, str(pr_num), message
        ]

        self.run_command(cmd)

    def merge_pr(self, pr: Dict) -> bool:
        """Merge a PR using squash merge"""
        pr_num = pr['number']

        print(f"  🔨 Merging PR #{pr_num}...")

        # Squash merge via API
        url = f'{API_BASE}/pulls/{pr_num}/merge'
        cmd = ['curl', '-s', '-X', 'PUT',
               '-H', f'Authorization: token {GITHUB_TOKEN}',
               '-H', 'Accept: application/vnd.github.v3+json',
               '-d', json.dumps({
                   'merge_method': 'squash',
                   'commit_title': pr['title'],
                   'commit_message': pr.get('body', '')
               }),
               url]

        code, stdout, stderr = self.run_command(cmd)

        if code != 0:
            print(f"  ❌ Failed to merge: {stderr}")
            return False

        try:
            result = json.loads(stdout)
            if result.get('merged'):
                # Delete branch
                branch = pr['head']['ref']
                delete_url = f'{API_BASE}/git/refs/heads/{branch}'
                delete_cmd = ['curl', '-s', '-X', 'DELETE',
                             '-H', f'Authorization: token {GITHUB_TOKEN}',
                             '-H', 'Accept: application/vnd.github.v3+json',
                             delete_url]
                self.run_command(delete_cmd)

                return True
            else:
                print(f"  ❌ Merge failed: {result.get('message', 'Unknown error')}")
                return False
        except json.JSONDecodeError:
            return False

    def review_and_merge_prs(self):
        """Main workflow: Review and merge PRs in priority order"""
        print("\n" + "="*80)
        print("⚡ THOR ODINSON - PR REVIEWER AND MERGER")
        print("="*80 + "\n")

        # Step 1: Fetch open PRs
        prs = self.fetch_prs()

        if not prs:
            print("✓ No open PRs to review")
            return

        # Step 2: Enrich PRs with issue data and sort by priority
        pr_data = []

        for pr in prs:
            pr_num = pr['number']
            issue_num = self.get_issue_from_pr(pr)

            print(f"\n📋 PR #{pr_num}: {pr['title']}")

            if not issue_num:
                print(f"  ⚠️  No linked issue found, skipping")
                continue

            print(f"  → Linked to issue #{issue_num}")

            # Fetch issue details
            issue = self.fetch_issue(issue_num)
            if not issue:
                print(f"  ❌ Could not fetch issue #{issue_num}")
                continue

            # Get priority and dependencies
            labels = issue.get('labels', [])
            priority = self.get_priority_from_labels(labels)
            deps = self.get_dependencies_from_labels(labels)

            pr_data.append({
                'pr': pr,
                'issue': issue,
                'issue_num': issue_num,
                'priority': priority,
                'priority_value': PRIORITY_ORDER.get(priority, 0),
                'deps': deps,
                'created_at': pr['created_at']
            })

            print(f"  Priority: {priority.upper()}")
            if deps:
                print(f"  Dependencies: {deps}")

        # Sort by priority (highest first), then by creation date (oldest first)
        pr_data.sort(key=lambda x: (-x['priority_value'], x['created_at']))

        print(f"\n{'='*80}")
        print(f"📊 Processing {len(pr_data)} PRs in priority order...")
        print(f"{'='*80}\n")

        # Step 3: Process each PR
        for idx, data in enumerate(pr_data, 1):
            pr = data['pr']
            pr_num = pr['number']
            issue_num = data['issue_num']
            priority = data['priority']
            deps = data['deps']

            print(f"\n[{idx}/{len(pr_data)}] ⚡ Processing PR #{pr_num} (Priority: {priority.upper()})")
            print(f"  Title: {pr['title']}")
            print(f"  Issue: #{issue_num}")

            # Check dependencies
            if deps:
                print(f"  Checking dependencies: {deps}")
                deps_ok, open_deps = self.check_dependencies(issue_num, deps)

                if not deps_ok:
                    reason = f"Blocked by open dependencies: {', '.join(f'#{d}' for d in open_deps)}"
                    print(f"  ❌ {reason}")

                    # Comment on PR
                    self.comment_on_pr(pr_num, f"⚠️ This PR is blocked by open dependencies: {', '.join(f'#{d}' for d in open_deps)}")

                    # Notify Discord
                    self.notify_discord('pr_blocked', 'Thor Odinson', pr_num, reason)

                    self.blocked_prs.append({'pr': pr_num, 'reason': reason})
                    continue
                else:
                    print(f"  ✓ All dependencies are closed")

            # Check CI status
            ci_ok, ci_message = self.check_pr_status(pr)
            if not ci_ok:
                print(f"  ⏳ {ci_message}")
                self.comment_on_pr(pr_num, f"⏳ Waiting for CI checks to pass: {ci_message}")
                self.waiting_ci.append({'pr': pr_num, 'reason': ci_message})
                continue
            else:
                print(f"  ✓ {ci_message}")

            # All checks passed - merge PR
            if self.merge_pr(pr):
                print(f"  ✅ MERGED PR #{pr_num}, closes issue #{issue_num}")

                # Notify Discord
                self.notify_discord('pr_merged', 'Thor Odinson', pr_num, str(issue_num))

                self.merged_prs.append({'pr': pr_num, 'issue': issue_num})
            else:
                print(f"  ❌ Failed to merge PR #{pr_num}")
                self.failed_reviews.append({'pr': pr_num, 'reason': 'Merge failed'})

        # Step 4: Summary
        self.print_summary()

    def print_summary(self):
        """Print summary of PR review results"""
        print("\n" + "="*80)
        print("📊 THOR'S SUMMARY REPORT")
        print("="*80 + "\n")

        if self.merged_prs:
            print(f"✅ Merged ({len(self.merged_prs)}):")
            for item in self.merged_prs:
                print(f"   • PR #{item['pr']} → Issue #{item['issue']}")
        else:
            print("✅ Merged: None")

        if self.blocked_prs:
            print(f"\n❌ Blocked by dependencies ({len(self.blocked_prs)}):")
            for item in self.blocked_prs:
                print(f"   • PR #{item['pr']}: {item['reason']}")
        else:
            print("\n❌ Blocked: None")

        if self.waiting_ci:
            print(f"\n⏳ Waiting on CI ({len(self.waiting_ci)}):")
            for item in self.waiting_ci:
                print(f"   • PR #{item['pr']}: {item['reason']}")
        else:
            print("\n⏳ Waiting on CI: None")

        if self.failed_reviews:
            print(f"\n⚠️  Failed reviews ({len(self.failed_reviews)}):")
            for item in self.failed_reviews:
                print(f"   • PR #{item['pr']}: {item['reason']}")

        print("\n" + "="*80)
        print("⚡ Thor Odinson signing off")
        print("="*80 + "\n")

def main():
    thor = ThorPRMerger()
    thor.review_and_merge_prs()

if __name__ == '__main__':
    main()
