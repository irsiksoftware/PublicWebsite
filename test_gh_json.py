import subprocess
import os

os.environ['GH_PAGER'] = ''

# Test different gh commands
commands = [
    'gh --version',
    'gh pr list --state open',
    'gh pr view 140',
]

for cmd in commands:
    print(f"\n{'='*60}")
    print(f"Command: {cmd}")
    print(f"{'='*60}")
    full_cmd = f'"C:\\Program Files\\GitHub CLI\\gh.bat" {cmd.replace("gh ", "")}'
    result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, encoding='utf-8', env=os.environ.copy())
    print(f"stdout:\n{result.stdout}")
    if result.stderr:
        print(f"stderr:\n{result.stderr}")
    print(f"returncode: {result.returncode}")
