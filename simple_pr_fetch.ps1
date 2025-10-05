$owner = "irsiksoftware"
$repo = "TestForAI"

Write-Host "Fetching open PRs for $owner/$repo..."

try {
    $response = gh api -H "Accept: application/vnd.github+json" "/repos/$owner/$repo/pulls?state=open" 2>&1

    if ($LASTEXITCODE -eq 0) {
        $prs = $response | ConvertFrom-Json
        Write-Host "Found $($prs.Count) open PRs"

        if ($prs.Count -gt 0) {
            $response | Out-File -FilePath "open_prs_current_direct.json" -Encoding utf8

            foreach ($pr in $prs) {
                Write-Host "`n=== PR #$($pr.number) ==="
                Write-Host "Title: $($pr.title)"
                Write-Host "Branch: $($pr.head.ref)"
                Write-Host "Created: $($pr.created_at)"
                Write-Host "Body: $($pr.body)"
            }
        }
    } else {
        Write-Host "Error: $response"
    }
} catch {
    Write-Host "Exception: $_"
}
