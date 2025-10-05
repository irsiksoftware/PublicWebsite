# Thor PR Reviewer - Fetch Open PRs
$ErrorActionPreference = "Stop"

# Fetch open PRs with all needed data
gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body,createdAt | Out-File -FilePath "thor_prs_current.json" -Encoding UTF8

# Display the content
Get-Content "thor_prs_current.json" -Raw
