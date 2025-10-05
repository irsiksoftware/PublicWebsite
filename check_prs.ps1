$ErrorActionPreference = "Stop"

# Get open PRs via API - use hardcoded repo from git remote
$prs = gh api "repos/irsiksoftware/TestForAI/pulls?state=open&per_page=100"

# Save to file
$prs | Out-File -FilePath "prs_api_raw.json" -Encoding UTF8

# Display
Write-Output $prs
