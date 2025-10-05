$ErrorActionPreference = "Stop"

# Get repo info
$repoInfo = & "C:\Program Files\GitHub CLI\gh.bat" repo view --json nameWithOwner,owner,name 2>&1
Write-Host "Repo info output: $repoInfo"

# Try alternative approach - use gh api directly
$owner = "irsiksoftware"
$repo = "TestForAI"

Write-Host "Fetching PRs for $owner/$repo..."

# Use gh api to get PRs
$prs = & "C:\Program Files\GitHub CLI\gh.bat" api "repos/$owner/$repo/pulls?state=open" | ConvertFrom-Json

Write-Host "Found $($prs.Count) open PR(s)"
Write-Host ""

foreach ($pr in $prs) {
    Write-Host "PR #$($pr.number): $($pr.title)"
    Write-Host "  Branch: $($pr.head.ref)"
    Write-Host "  Mergeable: $($pr.mergeable)"
    Write-Host "  Draft: $($pr.draft)"
    Write-Host "  Created: $($pr.created_at)"
    Write-Host "  State: $($pr.mergeable_state)"
    Write-Host ""
}

# Save to JSON
$prs | ConvertTo-Json -Depth 10 | Out-File "pr_status_api.json"
Write-Host "Saved to pr_status_api.json"
