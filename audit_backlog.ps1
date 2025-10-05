# Backlog Health Audit Script
$gh = 'C:\Program Files\GitHub CLI\gh.bat'

Write-Host "=== BACKLOG HEALTH AUDIT ===" -ForegroundColor Cyan
Write-Host "Fetching all open issues...`n"

# Get all open issues
$issues = 77..138
$allIssues = @()
$brokenDeps = @()
$missingPriority = @()
$multiPriority = @()

$priorityLabels = @('CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW')

foreach ($num in $issues) {
    $json = & $gh api "/repos/irsiksoftware/TestForAI/issues/$num" 2>&1 | ConvertFrom-Json

    $labels = $json.labels | Select-Object -ExpandProperty name
    $title = $json.title

    $issue = [PSCustomObject]@{
        Number = $num
        Title = $title
        Labels = $labels
        DependencyLabels = @($labels | Where-Object { $_ -match '^d\d+$' })
        PriorityLabels = @($labels | Where-Object { $priorityLabels -contains $_ })
    }

    $allIssues += $issue

    Write-Host "Issue #$num`: " -NoNewline -ForegroundColor Yellow
    Write-Host $title
    Write-Host "  Labels: $($labels -join ', ')" -ForegroundColor Gray

    # Check dependencies
    if ($issue.DependencyLabels.Count -gt 0) {
        Write-Host "  Dependencies: $($issue.DependencyLabels -join ', ')" -ForegroundColor Magenta
        foreach ($depLabel in $issue.DependencyLabels) {
            $depNum = $depLabel -replace '^d', ''
            $depCheck = & $gh api "/repos/irsiksoftware/TestForAI/issues/$depNum" 2>&1
            if ($depCheck -match "Not Found" -or $depCheck -match "Could not resolve") {
                $brokenDeps += [PSCustomObject]@{
                    Issue = $num
                    Dependency = $depNum
                    Label = $depLabel
                }
                Write-Host "    BROKEN: #$depNum does not exist!" -ForegroundColor Red
            }
        }
    }

    # Check priority labels
    if ($issue.PriorityLabels.Count -eq 0) {
        $missingPriority += $num
        Write-Host "  MISSING PRIORITY LABEL" -ForegroundColor Red
    } elseif ($issue.PriorityLabels.Count -gt 1) {
        $multiPriority += [PSCustomObject]@{
            Issue = $num
            Priorities = $issue.PriorityLabels
        }
        Write-Host "  MULTIPLE PRIORITY LABELS: $($issue.PriorityLabels -join ', ')" -ForegroundColor Red
    }

    Write-Host ""
}

# Generate summary
Write-Host "`n=== AUDIT SUMMARY ===" -ForegroundColor Cyan
Write-Host "Total issues audited: $($allIssues.Count)"
Write-Host "Broken dependencies: $($brokenDeps.Count)" -ForegroundColor $(if ($brokenDeps.Count -gt 0) { 'Red' } else { 'Green' })
Write-Host "Missing priority labels: $($missingPriority.Count)" -ForegroundColor $(if ($missingPriority.Count -gt 0) { 'Red' } else { 'Green' })
Write-Host "Multiple priority labels: $($multiPriority.Count)" -ForegroundColor $(if ($multiPriority.Count -gt 0) { 'Red' } else { 'Green' })

# Save results
$results = @{
    TotalIssues = $allIssues.Count
    BrokenDependencies = $brokenDeps
    MissingPriority = $missingPriority
    MultiplePriority = $multiPriority
    AllIssues = $allIssues
}

$results | ConvertTo-Json -Depth 5 | Out-File "C:\Code\TestForAI\audit_results.json"
Write-Host "`nResults saved to audit_results.json" -ForegroundColor Green
