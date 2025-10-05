# BACKLOG AUDIT SCRIPT - Check for broken dependencies and missing labels

Write-Host "=== BACKLOG HEALTH AUDIT STARTING ===" -ForegroundColor Cyan

# Fetch all open issues (not PRs)
Write-Host "`nFetching all open issues..." -ForegroundColor Yellow
$allItems = & "C:\Program Files\GitHub CLI\gh.bat" api 'repos/:owner/:repo/issues' --paginate | ConvertFrom-Json
$issues = $allItems | Where-Object { $_.state -eq 'open' -and $null -eq $_.pull_request }

Write-Host "Found $($issues.Count) open issues" -ForegroundColor Green

# Initialize trackers
$brokenDeps = @()
$missingPriority = @()
$missingTypeLabels = @()
$multiplePriority = @()

$priorityLabels = @('CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW')

Write-Host "`n=== PHASE 1: AUDIT ===" -ForegroundColor Cyan

foreach ($issue in $issues) {
    $num = $issue.number
    $title = $issue.title
    $labelNames = $issue.labels | ForEach-Object { $_.name }

    Write-Host "Checking issue #$num..." -ForegroundColor Gray

    # Check for dependency labels (d1, d2, d3, etc.)
    $depLabels = $labelNames | Where-Object { $_ -match '^d\d+$' }

    foreach ($depLabel in $depLabels) {
        $depNum = $depLabel -replace '^d', ''

        # Try to fetch dependency issue
        $depCheck = & "C:\Program Files\GitHub CLI\gh.bat" issue view $depNum --json number,state 2>&1

        if ($depCheck -match 'Could not resolve' -or $depCheck -match 'not found') {
            $brokenDeps += [PSCustomObject]@{
                IssueNumber = $num
                IssueTitle = $title
                DependencyLabel = $depLabel
                DependencyNumber = $depNum
            }
            Write-Host "  âš  BROKEN DEPENDENCY: #$num depends on non-existent #$depNum" -ForegroundColor Red
        }
    }

    # Check priority labels
    $priorityCount = ($labelNames | Where-Object { $_ -in $priorityLabels }).Count

    if ($priorityCount -eq 0) {
        $missingPriority += [PSCustomObject]@{
            IssueNumber = $num
            IssueTitle = $title
            CurrentLabels = $labelNames -join ', '
        }
        Write-Host "  âš  MISSING PRIORITY: #$num has no priority label" -ForegroundColor Yellow
    }
    elseif ($priorityCount -gt 1) {
        $currentPriorities = $labelNames | Where-Object { $_ -in $priorityLabels }
        $multiplePriority += [PSCustomObject]@{
            IssueNumber = $num
            IssueTitle = $title
            PriorityLabels = $currentPriorities -join ', '
        }
        Write-Host "  âš  MULTIPLE PRIORITY: #$num has $priorityCount priority labels" -ForegroundColor Magenta
    }

    # Check for required type labels based on title keywords
    $needsLabels = @()

    if ($title -match 'test|testing' -and 'testing' -notin $labelNames) {
        $needsLabels += 'testing'
    }
    if ($title -match 'bug|fix|error' -and 'bug' -notin $labelNames) {
        $needsLabels += 'bug'
    }
    if ($title -match 'feature|add|create|implement|build|design' -and 'feature' -notin $labelNames) {
        $needsLabels += 'feature'
    }

    if ($needsLabels.Count -gt 0) {
        $missingTypeLabels += [PSCustomObject]@{
            IssueNumber = $num
            IssueTitle = $title
            MissingLabels = $needsLabels -join ', '
        }
        Write-Host "  âš  MISSING TYPE LABELS: #$num needs: $($needsLabels -join ', ')" -ForegroundColor Yellow
    }
}

Write-Host "`n=== AUDIT SUMMARY ===" -ForegroundColor Cyan
Write-Host "Broken dependencies: $($brokenDeps.Count)" -ForegroundColor $(if ($brokenDeps.Count -gt 0) { 'Red' } else { 'Green' })
Write-Host "Missing priority labels: $($missingPriority.Count)" -ForegroundColor $(if ($missingPriority.Count -gt 0) { 'Yellow' } else { 'Green' })
Write-Host "Multiple priority labels: $($multiplePriority.Count)" -ForegroundColor $(if ($multiplePriority.Count -gt 0) { 'Magenta' } else { 'Green' })
Write-Host "Missing type labels: $($missingTypeLabels.Count)" -ForegroundColor $(if ($missingTypeLabels.Count -gt 0) { 'Yellow' } else { 'Green' })

# Save audit results
$auditResults = @{
    BrokenDependencies = $brokenDeps
    MissingPriority = $missingPriority
    MultiplePriority = $multiplePriority
    MissingTypeLabels = $missingTypeLabels
    TotalIssues = $issues.Count
    AuditTimestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

$auditResults | ConvertTo-Json -Depth 10 | Out-File "backlog_audit_results.json" -Encoding UTF8

Write-Host "`nAudit results saved to backlog_audit_results.json" -ForegroundColor Green
Write-Host "=== AUDIT COMPLETE ===" -ForegroundColor Cyan
