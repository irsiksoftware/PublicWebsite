$ErrorActionPreference = "Stop"

# Get repository info
$repo = gh repo view --json nameWithOwner | ConvertFrom-Json
$repoName = $repo.nameWithOwner

# Get open PRs via API
$prs = gh api "repos/$repoName/pulls?state=open&per_page=100" | ConvertFrom-Json

# Create formatted output
$result = $prs | Select-Object number, title, @{Name='mergeable';Expression={$_.mergeable}}, @{Name='headRefName';Expression={$_.head.ref}}, draft, created_at, @{Name='commits';Expression={$_.commits}}

$result | ConvertTo-Json | Out-File -FilePath "pr_status_api.json" -Encoding UTF8
Write-Output ($result | ConvertTo-Json)
