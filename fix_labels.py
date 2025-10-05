import subprocess
import json

# Read audit results
with open('audit_results.json', 'r') as f:
    results = json.load(f)

missing_type = results['missing_type']

print(f"Adding {len(missing_type)} missing type labels...")
print()

success_count = 0
failed = []

for num, type_label in missing_type:
    print(f"Adding '{type_label}' label to issue #{num}...")
    result = subprocess.run([
        'C:\\Program Files\\GitHub CLI\\gh.bat',
        'issue', 'edit', str(num),
        '--add-label', type_label
    ], capture_output=True, text=True, timeout=30)

    if result.returncode == 0:
        print(f"  Success")
        success_count += 1
    else:
        print(f"  Failed: {result.stderr}")
        failed.append((num, type_label, result.stderr))

print()
print("="*60)
print("FIX SUMMARY")
print("="*60)
print(f"Successfully added: {success_count}")
print(f"Failed: {len(failed)}")

if failed:
    print()
    print("FAILED OPERATIONS:")
    for num, label, error in failed:
        print(f"  Issue #{num} ({label}): {error}")
