# Thor PR Reviewer - Fetch Open PRs in proper JSON
$ErrorActionPreference = "Stop"

# Fetch open PRs - gh outputs JSON directly when using --json
$prsJson = gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body,createdAt --jq '.'

# Save to file
$prsJson | Out-File -FilePath "thor_prs_current.json" -Encoding UTF8

# Display
Write-Output $prsJson
