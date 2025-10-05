$prs = & "C:\Program Files\GitHub CLI\gh.bat" api repos/irsiksoftware/TestForAI/pulls?state=open | ConvertFrom-Json
Write-Host "=== CYCLOPS PR STATUS CHECK ==="
Write-Host ""
foreach ($pr in $prs) {
    Write-Host "PR #$($pr.number): $($pr.title)"
    Write-Host "  Mergeable: $($pr.mergeable) | State: $($pr.mergeable_state)"
    Write-Host "  Branch: $($pr.head.ref)"
    Write-Host ""
}
Write-Host "Total: $($prs.Count) open PR(s)"
