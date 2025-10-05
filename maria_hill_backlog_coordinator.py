#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MARIA HILL - Backlog Coordinator
Audits and fixes backlog health to unblock the swarm
"""

import json
import subprocess
import re
import sys
import io
import os
from typing import Dict, List, Set, Tuple

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

class BacklogCoordinator:
    def __init__(self):
        self.gh_cli = r"C:\Program Files\GitHub CLI\gh.bat"
        self.broken_dependencies = []
        self.missing_priorities = []
        self.missing_type_labels = []
        self.fixes_applied = []

    def run_gh_command(self, args: List[str], check_error: bool = False) -> str:
        """Execute gh CLI command"""
        try:
            # Force JSON format for issue list commands
            env = {}
            if '--json' in args:
                env = {'GH_FORCE_TTY': '0'}

            result = subprocess.run(
                [self.gh_cli] + args,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',  # Replace encoding errors with ?
                timeout=60,
                env={**os.environ, **env} if env else None
            )
            if check_error and result.returncode != 0:
                return None
            if result.stdout:
                return result.stdout.strip()
            return None
        except Exception as e:
            print(f"Error running gh command: {e}")
            return None

    def get_all_issues(self) -> List[Dict]:
        """Fetch all open issues"""
        print("📋 Fetching all open issues...")

        # Use gh api to get issues directly
        output = self.run_gh_command([
            'api',
            'repos/:owner/:repo/issues',
            '--paginate',
            '-X', 'GET',
            '-f', 'state=open',
            '-f', 'per_page=100'
        ])

        if not output:
            print("  DEBUG: No output from gh api command")
            return []

        try:
            # The API returns an array of issues
            issues = json.loads(output)

            # Filter out pull requests (they have a 'pull_request' key)
            issues = [i for i in issues if 'pull_request' not in i or not i['pull_request']]

            print(f"  ✓ Found {len(issues)} open issues")
            return issues
        except Exception as e:
            print(f"  DEBUG: JSON parse error: {e}")
            print(f"  DEBUG: Output: {output[:500]}")
            return []

    def extract_dependency_numbers(self, labels: List[Dict]) -> List[int]:
        """Extract dependency issue numbers from labels"""
        deps = []
        for label in labels:
            name = label.get('name', '')
            # Match d<number> pattern
            if name.startswith('d') and name[1:].isdigit():
                deps.append(int(name[1:]))
        return deps

    def extract_body_dependencies(self, body: str) -> List[int]:
        """Extract dependencies from issue body text"""
        if not body:
            return []

        deps = []
        # Look for patterns like: Depends on: #123, #456
        # Or: **Depends on:** #123
        patterns = [
            r'Depends on[:\s]+#(\d+)',
            r'depends on[:\s]+#(\d+)',
            r'Blocked by[:\s]+#(\d+)',
            r'blocked by[:\s]+#(\d+)',
        ]

        for pattern in patterns:
            matches = re.findall(pattern, body, re.IGNORECASE)
            deps.extend([int(m) for m in matches])

        return list(set(deps))  # Remove duplicates

    def check_issue_exists(self, issue_number: int) -> bool:
        """Check if an issue exists"""
        result = self.run_gh_command([
            'issue', 'view', str(issue_number),
            '--json', 'number,state'
        ], check_error=True)

        return result is not None

    def get_priority_labels(self, labels: List[Dict]) -> List[str]:
        """Get priority labels from issue"""
        priorities = {'CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'}
        return [l['name'] for l in labels if l['name'] in priorities]

    def get_type_labels(self, labels: List[Dict]) -> Set[str]:
        """Get type labels from issue"""
        types = {'feature', 'bug', 'testing', 'documentation'}
        return {l['name'] for l in labels if l['name'] in types}

    def should_have_type_label(self, title: str, body: str) -> Set[str]:
        """Determine what type labels an issue should have based on title/body"""
        needed = set()
        title_lower = title.lower()
        body_lower = (body or '').lower()

        # Testing - only check title to avoid false positives
        if any(word in title_lower for word in ['test ', 'testing ']):
            needed.add('testing')

        # Bug - check title for bug/fix keywords
        # Avoid false positives from phrases like "known issues section" or "issue exists"
        bug_keywords_title = ['bug', 'fix ', 'broken', 'error']
        if any(word in title_lower for word in bug_keywords_title):
            needed.add('bug')

        # Feature - very common, check title
        feature_keywords = ['feature', 'add ', 'create ', 'implement', 'build ']
        if any(word in title_lower for word in feature_keywords):
            needed.add('feature')

        # Documentation
        if any(word in title_lower for word in ['document', 'docs', 'readme']):
            needed.add('documentation')

        return needed

    def audit_phase(self, issues: List[Dict]):
        """Audit all issues for problems"""
        print(f"\n🔍 AUDIT PHASE: Checking {len(issues)} issues...")

        for issue in issues:
            num = issue['number']
            title = issue['title']
            labels = issue.get('labels', [])
            body = issue.get('body', '')

            print(f"\nAuditing #{num}: {title[:50]}...")

            # Check dependency labels
            dep_labels = self.extract_dependency_numbers(labels)
            body_deps = self.extract_body_dependencies(body)
            all_deps = list(set(dep_labels + body_deps))

            for dep in all_deps:
                if not self.check_issue_exists(dep):
                    self.broken_dependencies.append({
                        'issue': num,
                        'title': title,
                        'missing_dep': dep,
                        'from_label': dep in dep_labels
                    })
                    print(f"  ⚠️  Broken dependency: #{num} depends on non-existent #{dep}")

            # Check priority labels
            priority_labels = self.get_priority_labels(labels)
            if len(priority_labels) == 0:
                self.missing_priorities.append({
                    'issue': num,
                    'title': title,
                    'action': 'add_medium'
                })
                print(f"  ⚠️  No priority label")
            elif len(priority_labels) > 1:
                # Keep highest priority
                priority_order = ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']
                highest = min(priority_labels, key=lambda x: priority_order.index(x))
                to_remove = [p for p in priority_labels if p != highest]
                self.missing_priorities.append({
                    'issue': num,
                    'title': title,
                    'action': 'remove_duplicates',
                    'keep': highest,
                    'remove': to_remove
                })
                print(f"  ⚠️  Multiple priority labels: keeping {highest}, removing {to_remove}")

            # Check type labels
            current_types = self.get_type_labels(labels)
            needed_types = self.should_have_type_label(title, body)
            missing_types = needed_types - current_types

            if missing_types:
                self.missing_type_labels.append({
                    'issue': num,
                    'title': title,
                    'add_labels': list(missing_types)
                })
                print(f"  ⚠️  Missing type labels: {missing_types}")

    def fix_phase(self):
        """Fix all identified problems"""
        print(f"\n🔧 FIX PHASE: Applying fixes...")

        # Fix broken dependencies
        for item in self.broken_dependencies:
            issue_num = item['issue']
            dep_num = item['missing_dep']
            from_label = item['from_label']

            if dep_num > 100:
                # Likely deleted/invalid - remove dependency label if it exists
                if from_label:
                    label_name = f"d{dep_num}"
                    print(f"  🔧 Removing broken dependency label {label_name} from #{issue_num}")
                    result = self.run_gh_command([
                        'issue', 'edit', str(issue_num),
                        '--remove-label', label_name
                    ])
                    if result is not None:
                        self.fixes_applied.append(f"Removed label d{dep_num} from #{issue_num}")
                else:
                    print(f"  ℹ️  #{issue_num} mentions non-existent #{dep_num} in body (no action taken)")
            else:
                # Low number - may be needed, create placeholder
                print(f"  🔧 Creating placeholder issue #{dep_num} (referenced by #{issue_num})")
                # Note: This would require more context - for now just log it
                self.fixes_applied.append(f"MANUAL: Create placeholder for #{dep_num} (needed by #{issue_num})")

        # Fix missing priorities
        for item in self.missing_priorities:
            issue_num = item['issue']
            action = item['action']

            if action == 'add_medium':
                print(f"  🔧 Adding MEDIUM label to #{issue_num}")
                result = self.run_gh_command([
                    'issue', 'edit', str(issue_num),
                    '--add-label', 'MEDIUM'
                ])
                if result is not None:
                    self.fixes_applied.append(f"Added MEDIUM label to #{issue_num}")

            elif action == 'remove_duplicates':
                for label in item['remove']:
                    print(f"  🔧 Removing duplicate priority {label} from #{issue_num}")
                    result = self.run_gh_command([
                        'issue', 'edit', str(issue_num),
                        '--remove-label', label
                    ])
                    if result is not None:
                        self.fixes_applied.append(f"Removed {label} from #{issue_num}, kept {item['keep']}")

        # Fix missing type labels
        for item in self.missing_type_labels:
            issue_num = item['issue']
            for label in item['add_labels']:
                print(f"  🔧 Adding {label} label to #{issue_num}")
                result = self.run_gh_command([
                    'issue', 'edit', str(issue_num),
                    '--add-label', label
                ])
                if result is not None:
                    self.fixes_applied.append(f"Added {label} label to #{issue_num}")

    def verify_phase(self) -> bool:
        """Re-run audit to verify fixes"""
        print(f"\n✅ VERIFY PHASE: Re-checking backlog...")

        # Reset tracking
        self.broken_dependencies = []
        self.missing_priorities = []
        self.missing_type_labels = []

        # Re-audit
        issues = self.get_all_issues()
        self.audit_phase(issues)

        # Check if any issues remain
        total_issues = (
            len(self.broken_dependencies) +
            len(self.missing_priorities) +
            len(self.missing_type_labels)
        )

        return total_issues == 0

    def generate_report(self, initial_issues_count: int, verification_passed: bool):
        """Generate final report"""
        print(f"\n" + "="*60)
        print(f"📊 BACKLOG COORDINATOR REPORT")
        print(f"="*60)

        print(f"\n📈 Statistics:")
        print(f"  Total issues audited: {initial_issues_count}")
        print(f"  Fixes applied: {len(self.fixes_applied)}")

        if self.fixes_applied:
            print(f"\n🔧 Changes made:")
            for fix in self.fixes_applied:
                print(f"  • {fix}")

        # Count fixes by type
        broken_dep_fixes = sum(1 for f in self.fixes_applied if 'dependency' in f.lower() or 'label d' in f.lower())
        priority_fixes = sum(1 for f in self.fixes_applied if 'MEDIUM' in f or 'CRITICAL' in f or 'HIGH' in f or 'LOW' in f or 'URGENT' in f)
        type_fixes = sum(1 for f in self.fixes_applied if 'feature' in f or 'bug' in f or 'testing' in f)

        print(f"\n📊 Breakdown:")
        print(f"  Fixed broken dependencies: {broken_dep_fixes}")
        print(f"  Added/fixed priority labels: {priority_fixes}")
        print(f"  Added type labels: {type_fixes}")

        # Final status
        if verification_passed:
            print(f"\n✅ BACKLOG HEALTH: HEALTHY")
            print(f"🚀 SWARM STATUS: UNBLOCKED")
        else:
            remaining = len(self.broken_dependencies) + len(self.missing_priorities) + len(self.missing_type_labels)
            print(f"\n⚠️  BACKLOG HEALTH: ISSUES REMAIN ({remaining})")
            print(f"🛑 SWARM STATUS: NEEDS HUMAN INTERVENTION")

            if self.broken_dependencies:
                print(f"\n  Remaining broken dependencies:")
                for item in self.broken_dependencies[:5]:  # Show first 5
                    print(f"    • #{item['issue']} → #{item['missing_dep']}")

        print(f"\n" + "="*60)

        return 0 if verification_passed else 1

def main():
    coordinator = BacklogCoordinator()

    print("🎯 MARIA HILL - BACKLOG COORDINATOR")
    print("Mission: Ensure all issues are workable\n")

    # Get all issues
    issues = coordinator.get_all_issues()
    if not issues:
        print("❌ Failed to fetch issues")
        return 1

    initial_count = len(issues)

    # Audit
    coordinator.audit_phase(issues)

    # Fix
    coordinator.fix_phase()

    # Verify
    verification_passed = coordinator.verify_phase()

    # Report
    return coordinator.generate_report(initial_count, verification_passed)

if __name__ == "__main__":
    sys.exit(main())
