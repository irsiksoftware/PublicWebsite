import subprocess
import sys

if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

cmd = 'powershell -Command "gh pr list --state open --json number,title"'
result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8')

print("STDOUT:")
print(repr(result.stdout))
print("\nSTDERR:")
print(repr(result.stderr))
print("\nReturn code:", result.returncode)
