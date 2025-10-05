# Get open PRs using GitHub API
$repo = gh repo view --json nameWithOwner -q .nameWithOwner
Write-Host "Repository: $repo"

$prs = gh api "repos/$repo/pulls?state=open" | ConvertFrom-Json
Write-Host "Found $($prs.Count) open PRs"

if ($prs.Count -gt 0) {
    $prs | ConvertTo-Json -Depth 10 | Out-File -FilePath "open_prs_api_direct.json" -Encoding utf8
    foreach ($pr in $prs) {
        Write-Host "PR #$($pr.number): $($pr.title)"
    }
} else {
    Write-Host "No open PRs found"
}
