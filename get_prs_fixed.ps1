# Get repository info
$repoInfo = gh repo view --json nameWithOwner | ConvertFrom-Json
$repo = $repoInfo.nameWithOwner
Write-Host "Repository: $repo"

# Get open PRs
Write-Host "Fetching open PRs..."
$apiResponse = gh api "repos/$repo/pulls?state=open&per_page=100"
Write-Host "API Response: $apiResponse"

if ($apiResponse -and $apiResponse -ne "[]") {
    $prs = $apiResponse | ConvertFrom-Json
    Write-Host "Found $($prs.Count) open PRs"

    if ($prs.Count -gt 0) {
        $prs | ConvertTo-Json -Depth 10 | Out-File -FilePath "open_prs_direct.json" -Encoding utf8

        foreach ($pr in $prs) {
            Write-Host "`nPR #$($pr.number): $($pr.title)"
            Write-Host "  Branch: $($pr.head.ref)"
            Write-Host "  Created: $($pr.created_at)"
        }
    }
} else {
    Write-Host "No open PRs found"
}
