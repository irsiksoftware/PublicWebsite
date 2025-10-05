#!/usr/bin/env pwsh
# Get PRs in JSON format
$ErrorActionPreference = "Stop"
try {
    $json = gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body,createdAt
    Write-Host $json
    $json | Out-File -FilePath "prs_fetched.json" -Encoding utf8
} catch {
    Write-Host "Error: $_"
    exit 1
}
