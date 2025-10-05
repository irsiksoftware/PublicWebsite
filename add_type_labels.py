import subprocess
import json

# Read audit results
with open('audit_results.json', 'r') as f:
    results = json.load(f)

missing_type = results['missing_type']

print(f"Adding {len(missing_type)} missing type labels using GitHub API...")
print()

success_count = 0
failed = []

for num, type_label in missing_type:
    print(f"Adding '{type_label}' label to issue #{num}...", end=" ")

    # Get current labels first
    get_result = subprocess.run([
        'powershell', '-Command',
        f'gh api repos/irsiksoftware/TestForAI/issues/{num} --jq .labels'
    ], capture_output=True, text=True, timeout=30)

    if get_result.returncode != 0:
        print(f"Failed to get current labels: {get_result.stderr}")
        failed.append((num, type_label, "Failed to get current labels"))
        continue

    try:
        current_labels = json.loads(get_result.stdout)
        current_label_names = [l['name'] for l in current_labels]

        # Add the new label if it doesn't exist
        if type_label not in current_label_names:
            current_label_names.append(type_label)

            # Update labels
            labels_json = json.dumps(current_label_names)
            update_result = subprocess.run([
                'powershell', '-Command',
                f"gh api repos/irsiksoftware/TestForAI/issues/{num} -X PATCH -f labels='{labels_json}'"
            ], capture_output=True, text=True, timeout=30)

            if update_result.returncode == 0:
                print("Success")
                success_count += 1
            else:
                print(f"Failed: {update_result.stderr}")
                failed.append((num, type_label, update_result.stderr))
        else:
            print("Already has label")
            success_count += 1
    except Exception as e:
        print(f"Error: {e}")
        failed.append((num, type_label, str(e)))

print()
print("="*60)
print("FIX SUMMARY")
print("="*60)
print(f"Successfully added/verified: {success_count}")
print(f"Failed: {len(failed)}")

if failed:
    print()
    print("FAILED OPERATIONS:")
    for num, label, error in failed:
        print(f"  Issue #{num} ({label}): {error}")
