# Check for dependency labels on all open issues
Write-Host "Checking for dependency labels..." -ForegroundColor Cyan

$issuesWithDeps = @()

# Get all open issue numbers
$issueNums = gh issue list --state open --limit 100 | ForEach-Object {
    if ($_ -match '^\#(\d+)') { $matches[1] }
}

Write-Host "Checking $($issueNums.Count) issues for dependency labels...`n"

foreach ($num in $issueNums) {
    # Get labels for this issue
    $labels = gh api "repos/:owner/:repo/issues/$num" --jq '.labels[].name' 2>$null

    # Check for dependency labels (d1, d2, d3, etc.)
    $depLabels = $labels | Where-Object { $_ -match '^d\d+$' }

    if ($depLabels.Count -gt 0) {
        Write-Host "Issue #$num has dependency labels: $($depLabels -join ', ')" -ForegroundColor Yellow
        $issuesWithDeps += @{
            Issue = $num
            DependencyLabels = $depLabels
        }
    }
}

Write-Host "`n=== RESULT ===" -ForegroundColor Cyan
if ($issuesWithDeps.Count -eq 0) {
    Write-Host "NO ISSUES WITH DEPENDENCY LABELS FOUND" -ForegroundColor Green
    Write-Host "All dependency references are in descriptions only (not tracked as labels)" -ForegroundColor Green
} else {
    Write-Host "Found $($issuesWithDeps.Count) issues with dependency labels" -ForegroundColor Yellow
    foreach ($item in $issuesWithDeps) {
        Write-Host "  Issue #$($item.Issue): $($item.DependencyLabels -join ', ')"
    }
}
