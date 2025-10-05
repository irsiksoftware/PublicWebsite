# Backlog Health Audit Script
# Fetches all open issues and analyzes dependencies, labels, etc.

$ErrorActionPreference = "Continue"

Write-Host "=== BACKLOG HEALTH AUDIT ===" -ForegroundColor Cyan
Write-Host ""

# Get all open issues
Write-Host "Fetching open issues..." -ForegroundColor Yellow
$issuesRaw = & gh issue list --state open --limit 1000
$issues = @()

# Parse each issue line
foreach ($line in $issuesRaw) {
    if ($line -match '^#(\d+)\s+\[OPEN\]\s+\[([^\]]+)\]\s+(.+)$') {
        $number = [int]$matches[1]
        $labelsStr = $matches[2]
        $title = $matches[3]
        $labels = $labelsStr -split ',\s*'

        $issues += @{
            Number = $number
            Title = $title
            Labels = $labels
        }
    }
}

Write-Host "Found $($issues.Count) open issues" -ForegroundColor Green
Write-Host ""

# Initialize tracking
$brokenDeps = @()
$missingPriority = @()
$multiplePriority = @()
$missingType = @()
$allDeps = @()

# Priority labels
$priorityLabels = @('CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW')

Write-Host "=== AUDIT PHASE ===" -ForegroundColor Cyan
Write-Host ""

foreach ($issue in $issues) {
    $num = $issue.Number
    $title = $issue.Title
    $labels = $issue.Labels

    # Check for dependency labels (d1, d2, d3, etc)
    $depLabels = $labels | Where-Object { $_ -match '^d(\d+)$' }

    foreach ($depLabel in $depLabels) {
        if ($depLabel -match '^d(\d+)$') {
            $depNum = [int]$matches[1]
            $allDeps += @{
                Issue = $num
                DependsOn = $depNum
                Label = $depLabel
            }

            # Check if dependency exists
            Write-Host "  Checking #$num dependency on #$depNum..." -NoNewline
            $depCheck = & gh issue view $depNum --json number,state 2>&1

            if ($depCheck -match 'Could not resolve' -or $depCheck -match 'not found') {
                Write-Host " BROKEN" -ForegroundColor Red
                $brokenDeps += @{
                    Issue = $num
                    Title = $title
                    DependsOn = $depNum
                    Label = $depLabel
                }
            } else {
                Write-Host " OK" -ForegroundColor Green
            }
        }
    }

    # Check priority labels
    $hasPriority = $labels | Where-Object { $priorityLabels -contains $_ }

    if ($hasPriority.Count -eq 0) {
        $missingPriority += @{
            Number = $num
            Title = $title
        }
    } elseif ($hasPriority.Count -gt 1) {
        $multiplePriority += @{
            Number = $num
            Title = $title
            Priorities = $hasPriority
        }
    }

    # Check type labels based on title keywords
    $hasFeature = $labels -contains 'feature'
    $hasBug = $labels -contains 'bug'
    $hasTesting = $labels -contains 'testing'

    $needsType = @()

    if ($title -match 'test|testing' -and -not $hasTesting) {
        $needsType += 'testing'
    }
    if ($title -match 'bug|fix|error' -and -not $hasBug) {
        $needsType += 'bug'
    }
    if ($title -match 'feature|add|create|implement|build|design' -and -not $hasFeature) {
        $needsType += 'feature'
    }

    if ($needsType.Count -gt 0) {
        $missingType += @{
            Number = $num
            Title = $title
            MissingLabels = $needsType
        }
    }
}

Write-Host ""
Write-Host "=== AUDIT RESULTS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total dependencies checked: $($allDeps.Count)" -ForegroundColor White
Write-Host "Broken dependencies: $($brokenDeps.Count)" -ForegroundColor $(if ($brokenDeps.Count -gt 0) { 'Red' } else { 'Green' })
Write-Host "Missing priority labels: $($missingPriority.Count)" -ForegroundColor $(if ($missingPriority.Count -gt 0) { 'Yellow' } else { 'Green' })
Write-Host "Multiple priority labels: $($multiplePriority.Count)" -ForegroundColor $(if ($multiplePriority.Count -gt 0) { 'Yellow' } else { 'Green' })
Write-Host "Missing type labels: $($missingType.Count)" -ForegroundColor $(if ($missingType.Count -gt 0) { 'Yellow' } else { 'Green' })
Write-Host ""

# Show details
if ($brokenDeps.Count -gt 0) {
    Write-Host "BROKEN DEPENDENCIES:" -ForegroundColor Red
    foreach ($dep in $brokenDeps) {
        Write-Host "  Issue #$($dep.Issue) depends on non-existent #$($dep.DependsOn) (label: $($dep.Label))" -ForegroundColor Red
    }
    Write-Host ""
}

if ($missingPriority.Count -gt 0) {
    Write-Host "MISSING PRIORITY:" -ForegroundColor Yellow
    foreach ($item in $missingPriority) {
        Write-Host "  Issue #$($item.Number): $($item.Title)" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($multiplePriority.Count -gt 0) {
    Write-Host "MULTIPLE PRIORITIES:" -ForegroundColor Yellow
    foreach ($item in $multiplePriority) {
        Write-Host "  Issue #$($item.Number): $($item.Priorities -join ', ')" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($missingType.Count -gt 0) {
    Write-Host "MISSING TYPE LABELS:" -ForegroundColor Yellow
    foreach ($item in $missingType) {
        Write-Host "  Issue #$($item.Number): needs $($item.MissingLabels -join ', ')" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Export for fixing phase
$auditResults = @{
    BrokenDeps = $brokenDeps
    MissingPriority = $missingPriority
    MultiplePriority = $multiplePriority
    MissingType = $missingType
}

$auditResults | ConvertTo-Json -Depth 10 | Out-File "audit_results.json" -Encoding UTF8

Write-Host "Audit results saved to audit_results.json" -ForegroundColor Green
