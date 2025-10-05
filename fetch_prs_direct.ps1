#!/usr/bin/env pwsh
# Fetch open PRs with direct output
$output = & gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body,createdAt 2>&1 | Out-String
Write-Host "Raw output:"
Write-Host $output
$output | Out-File -FilePath "pr_raw_output.txt" -Encoding utf8
