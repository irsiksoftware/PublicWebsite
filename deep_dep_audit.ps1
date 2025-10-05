# Deep dependency audit - check actual label usage on issues

Write-Host "=== DEEP DEPENDENCY AUDIT ===" -ForegroundColor Cyan

# Fetch all open issues with full details
$allItems = & "C:\Program Files\GitHub CLI\gh.bat" api 'repos/:owner/:repo/issues' --paginate | ConvertFrom-Json
$issues = $allItems | Where-Object { $_.state -eq 'open' -and $null -eq $_.pull_request }

Write-Host "Checking $($issues.Count) open issues for dependency labels..." -ForegroundColor Yellow

$issuesWithDeps = @()
$brokenDeps = @()

foreach ($issue in $issues) {
    $num = $issue.number
    $labelNames = $issue.labels | ForEach-Object { $_.name }

    # Find all dependency labels (d followed by digits)
    $depLabels = $labelNames | Where-Object { $_ -match '^d\d+$' }

    if ($depLabels.Count -gt 0) {
        Write-Host "`nIssue #$num has $($depLabels.Count) dependency label(s): $($depLabels -join ', ')" -ForegroundColor Cyan

        foreach ($depLabel in $depLabels) {
            $depNum = [int]($depLabel -replace '^d', '')

            # Check if dependency issue exists
            Write-Host "  Checking if issue #$depNum exists..." -ForegroundColor Gray

            try {
                $result = & "C:\Program Files\GitHub CLI\gh.bat" issue view $depNum --json number,state,title 2>&1

                if ($result -match 'Could not resolve' -or $result -match 'not found' -or $result -match 'HTTP 404') {
                    Write-Host "    âš  BROKEN: Issue #$depNum does NOT exist!" -ForegroundColor Red
                    $brokenDeps += [PSCustomObject]@{
                        Issue = $num
                        IssueTitle = $issue.title
                        DependencyLabel = $depLabel
                        DependencyNumber = $depNum
                        Action = if ($depNum -gt 100) { 'REMOVE' } else { 'NEEDS_REVIEW' }
                    }
                }
                else {
                    # Parse the JSON result
                    try {
                        $depInfo = $result | ConvertFrom-Json
                        Write-Host "    âœ" OK: Issue #$depNum exists - '$($depInfo.title)' (State: $($depInfo.state))" -ForegroundColor Green
                    }
                    catch {
                        Write-Host "    âš  Could not parse response for #$depNum" -ForegroundColor Yellow
                    }
                }
            }
            catch {
                Write-Host "    âš  Error checking #$depNum : $_" -ForegroundColor Red
            }
        }

        $issuesWithDeps += [PSCustomObject]@{
            IssueNumber = $num
            DependencyLabels = $depLabels -join ', '
        }
    }
}

Write-Host "`n=== RESULTS ===" -ForegroundColor Cyan
Write-Host "Issues with dependencies: $($issuesWithDeps.Count)" -ForegroundColor Yellow
Write-Host "Broken dependencies found: $($brokenDeps.Count)" -ForegroundColor $(if ($brokenDeps.Count -gt 0) { 'Red' } else { 'Green' })

if ($brokenDeps.Count -gt 0) {
    Write-Host "`nBROKEN DEPENDENCIES:" -ForegroundColor Red
    $brokenDeps | Format-Table -AutoSize
}

# Save results
@{
    IssuesWithDeps = $issuesWithDeps
    BrokenDeps = $brokenDeps
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json -Depth 10 | Out-File "deep_dep_audit_results.json" -Encoding UTF8

Write-Host "`nResults saved to deep_dep_audit_results.json" -ForegroundColor Green
