import subprocess
import json

# Get issue 74 with full JSON
result = subprocess.run([
    'powershell', '-Command',
    'gh issue view 74 --json labels'
], capture_output=True, text=True)

print("Raw output:")
print(result.stdout)
print()

try:
    data = json.loads(result.stdout)
    print("Parsed JSON:")
    print(json.dumps(data, indent=2))
    print()
    print("Label names:")
    for label in data.get('labels', []):
        print(f"  - {label['name']}")
except Exception as e:
    print(f"Error parsing JSON: {e}")
    print()
    print("Stderr:")
    print(result.stderr)
