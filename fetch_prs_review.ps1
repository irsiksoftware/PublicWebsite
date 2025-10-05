#!/usr/bin/env pwsh
# Fetch open PRs with full details
$prs = gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body,createdAt | ConvertFrom-Json
$prs | ConvertTo-Json -Depth 10 | Out-File -FilePath "open_prs_current.json" -Encoding utf8
Write-Host "Fetched $($prs.Count) open PRs"
$prs | ConvertTo-Json -Depth 10
