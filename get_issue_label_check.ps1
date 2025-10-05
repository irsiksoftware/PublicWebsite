$issue117 = gh api repos/:owner/:repo/issues/117 | ConvertFrom-Json
$issue122 = gh api repos/:owner/:repo/issues/122 | ConvertFrom-Json

Write-Host "Issue #117 labels:"
$issue117.labels | ForEach-Object { Write-Host "  - $($_.name)" }

Write-Host "`nIssue #122 labels:"
$issue122.labels | ForEach-Object { Write-Host "  - $($_.name)" }

# Check for dependency labels (d1, d2, etc.)
$issue117_deps = $issue117.labels | Where-Object { $_.name -match '^d\d+$' }
$issue122_deps = $issue122.labels | Where-Object { $_.name -match '^d\d+$' }

Write-Host "`nIssue #117 dependency labels: $($issue117_deps.name -join ', ')"
Write-Host "Issue #122 dependency labels: $($issue122_deps.name -join ', ')"
