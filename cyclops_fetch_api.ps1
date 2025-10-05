# Cyclops PR Fixer - Fetch open PRs using GitHub API
$owner = "irsiksoftware"
$repo = "TestForAI"
$apiUrl = "https://api.github.com/repos/$owner/$repo/pulls?state=open"

# Fetch the PRs
$prs = Invoke-RestMethod -Uri $apiUrl -Headers @{Accept="application/vnd.github.v3+json"}

# Save to file
$prs | ConvertTo-Json -Depth 10 | Out-File -FilePath "cyclops_prs_api_data.json" -Encoding utf8

# Display PR count
Write-Host "Fetched $($prs.Count) open PRs"

# Display basic info for each PR
foreach ($pr in $prs) {
    Write-Host "`nPR #$($pr.number): $($pr.title)"
    Write-Host "  Branch: $($pr.head.ref)"
    Write-Host "  Created: $($pr.created_at)"
    Write-Host "  Draft: $($pr.draft)"
}
