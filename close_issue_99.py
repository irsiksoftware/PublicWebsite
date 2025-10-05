#!/usr/bin/env python3
"""Close issue #99 using GitHub CLI."""

import subprocess
import sys

def run_gh(args):
    """Run gh command."""
    gh_path = r"C:\Program Files\GitHub CLI\gh.bat"
    cmd = [gh_path] + args
    result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    return result.returncode, result.stdout, result.stderr

def main():
    # Close issue with comment
    comment = "Implementation complete. Search bar with icon and focus glow successfully implemented. All requirements met."

    returncode, stdout, stderr = run_gh(['issue', 'close', '99', '--comment', comment])

    if returncode == 0:
        print("✓ Issue #99 closed successfully")
        print(stdout)
    else:
        print(f"✗ Failed to close issue: {stderr}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
