# Dr. Strange PR Reviewer - Fetch Open PRs
$ErrorActionPreference = "Stop"

Write-Host "Fetching open PRs..."
$prs = gh pr list --state open --limit 100 --json number,title,headRefName,labels,statusCheckRollup,body,createdAt | ConvertFrom-Json

Write-Host "Found $($prs.Count) open PRs"
$prs | ConvertTo-Json -Depth 10 | Out-File -FilePath "prs_dr_strange_api_current.json" -Encoding utf8

Write-Host "PRs saved to prs_dr_strange_api_current.json"
Get-Content "prs_dr_strange_api_current.json"
