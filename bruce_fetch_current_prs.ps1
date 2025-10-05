# Bruce Banner PR Review - Fetch Current PRs
$ErrorActionPreference = "Stop"

Write-Host "Fetching open PRs..."
$prs = gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body --limit 100 | ConvertFrom-Json

Write-Host "Found $($prs.Count) open PRs"
$prs | ConvertTo-Json -Depth 10 | Out-File -FilePath "prs_bruce_current_review.json" -Encoding utf8

Write-Host "PR data saved to prs_bruce_current_review.json"
