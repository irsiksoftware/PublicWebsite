import subprocess
import json

# Run gh pr list and capture output
result = subprocess.run(
    ['gh', 'pr', 'list', '--repo', 'irsiksoftware/TestForAI', '--state', 'open',
     '--json', 'number,title,body,labels,createdAt,statusCheckRollup'],
    capture_output=True,
    text=True,
    encoding='utf-8'
)

if result.returncode == 0:
    data = json.loads(result.stdout)
    with open('bruce_prs_testforai_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Found {len(data)} open PRs")
    for pr in data:
        print(f"PR #{pr['number']}: {pr['title']}")
else:
    print(f"Error: {result.stderr}")
