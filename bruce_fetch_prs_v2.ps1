# Bruce Banner PR Review - Fetch Current PRs v2
$ErrorActionPreference = "Stop"

Write-Host "Fetching open PRs..."

# Get raw JSON output
$rawJson = gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body --limit 100

# Save raw output
$rawJson | Out-File -FilePath "prs_bruce_raw_output.json" -Encoding utf8

# Parse and save
$prs = $rawJson | ConvertFrom-Json
Write-Host "Found $($prs.Count) open PRs"

# Output formatted
$prs | ConvertTo-Json -Depth 10 | Out-File -FilePath "prs_bruce_current_review.json" -Encoding utf8

Write-Host "PR data saved"
