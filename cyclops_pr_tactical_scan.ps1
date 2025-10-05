# Cyclops - Tactical PR Scanner
# Fetches all open PRs with complete status information

$prs = gh api repos/:owner/:repo/pulls?state=open | ConvertFrom-Json

$prData = @()

foreach ($pr in $prs) {
    $prInfo = @{
        number = $pr.number
        title = $pr.title
        mergeable_state = $pr.mergeable_state
        mergeable = $pr.mergeable
        head_ref = $pr.head.ref
        draft = $pr.draft
        created_at = $pr.created_at
        updated_at = $pr.updated_at
    }
    $prData += $prInfo
}

$prData | ConvertTo-Json -Depth 10 | Out-File -FilePath "cyclops_tactical_prs.json" -Encoding UTF8
Write-Output "Scanned $($prData.Count) open PRs"
$prData | ForEach-Object {
    Write-Output "PR #$($_.number): $($_.title) [Mergeable: $($_.mergeable_state)]"
}
