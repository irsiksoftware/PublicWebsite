# BACKLOG HEALTH AUDIT SCRIPT
# Tracks broken dependencies, missing priority labels, and missing type labels

Write-Host "=== BACKLOG HEALTH AUDIT STARTED ===" -ForegroundColor Cyan

# Initialize tracking arrays
$brokenDependencies = @()
$missingPriority = @()
$missingType = @()
$multiplePriority = @()

# Priority labels (only one should be present)
$priorityLabels = @('CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW')

# Get all open issues
Write-Host "`nFetching all open issues..." -ForegroundColor Yellow
$issuesRaw = gh issue list --state open --limit 1000 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to fetch issues" -ForegroundColor Red
    exit 1
}

# Parse each issue line
$issueNumbers = @()
$issuesRaw -split "`n" | ForEach-Object {
    if ($_ -match '^#(\d+)') {
        $issueNumbers += $matches[1]
    }
}

Write-Host "Found $($issueNumbers.Count) open issues" -ForegroundColor Green

# Process each issue
$issueCount = 0
foreach ($issueNum in $issueNumbers) {
    $issueCount++
    Write-Host "`n[$issueCount/$($issueNumbers.Count)] Checking issue #$issueNum..." -ForegroundColor Cyan

    # Get issue details with labels
    $issueJson = gh issue view $issueNum --json number,title,labels,body 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  WARNING: Could not fetch issue #$issueNum" -ForegroundColor Yellow
        continue
    }

    $issue = $issueJson | ConvertFrom-Json
    $labelNames = $issue.labels | ForEach-Object { $_.name }

    Write-Host "  Title: $($issue.title)" -ForegroundColor Gray
    Write-Host "  Labels: $($labelNames -join ', ')" -ForegroundColor Gray

    # Check for dependency labels (d1, d2, d3, etc.)
    $depLabels = $labelNames | Where-Object { $_ -match '^d(\d+)$' }

    foreach ($depLabel in $depLabels) {
        $depNum = $depLabel -replace '^d', ''
        Write-Host "  Checking dependency: #$depNum" -ForegroundColor Magenta

        # Verify dependency exists
        $depCheck = gh issue view $depNum --json number,state 2>&1
        if ($LASTEXITCODE -ne 0 -or $depCheck -match 'Could not resolve') {
            Write-Host "    BROKEN: Dependency #$depNum does not exist!" -ForegroundColor Red
            $brokenDependencies += @{
                Issue = $issueNum
                Title = $issue.title
                BrokenDep = $depNum
                Label = $depLabel
            }
        } else {
            Write-Host "    OK: Dependency #$depNum exists" -ForegroundColor Green
        }
    }

    # Check priority labels
    $hasPriority = $labelNames | Where-Object { $priorityLabels -contains $_ }

    if ($hasPriority.Count -eq 0) {
        Write-Host "  MISSING: No priority label" -ForegroundColor Red
        $missingPriority += @{
            Issue = $issueNum
            Title = $issue.title
        }
    } elseif ($hasPriority.Count -gt 1) {
        Write-Host "  MULTIPLE: Has $($hasPriority.Count) priority labels: $($hasPriority -join ', ')" -ForegroundColor Yellow
        $multiplePriority += @{
            Issue = $issueNum
            Title = $issue.title
            Priorities = $hasPriority
        }
    } else {
        Write-Host "  Priority: $hasPriority" -ForegroundColor Green
    }

    # Check for type labels based on title keywords
    $titleLower = $issue.title.ToLower()
    $hasFeature = $labelNames -contains 'feature'
    $hasBug = $labelNames -contains 'bug'
    $hasTesting = $labelNames -contains 'testing'

    $needsFeature = $titleLower -match '\b(feature|add|create|build|implement|design)\b' -and -not $hasFeature
    $needsBug = $titleLower -match '\b(bug|fix|error|broken)\b' -and -not $hasBug
    $needsTesting = $titleLower -match '\b(test|testing)\b' -and -not $hasTesting

    if ($needsFeature) {
        Write-Host "  MISSING: Should have 'feature' label" -ForegroundColor Red
        $missingType += @{
            Issue = $issueNum
            Title = $issue.title
            NeededLabel = 'feature'
        }
    }
    if ($needsBug) {
        Write-Host "  MISSING: Should have 'bug' label" -ForegroundColor Red
        $missingType += @{
            Issue = $issueNum
            Title = $issue.title
            NeededLabel = 'bug'
        }
    }
    if ($needsTesting) {
        Write-Host "  MISSING: Should have 'testing' label" -ForegroundColor Red
        $missingType += @{
            Issue = $issueNum
            Title = $issue.title
            NeededLabel = 'testing'
        }
    }
}

# Summary Report
Write-Host "`n=== AUDIT SUMMARY ===" -ForegroundColor Cyan
Write-Host "Total issues checked: $($issueNumbers.Count)" -ForegroundColor White
Write-Host "Broken dependencies: $($brokenDependencies.Count)" -ForegroundColor $(if ($brokenDependencies.Count -eq 0) { 'Green' } else { 'Red' })
Write-Host "Missing priority labels: $($missingPriority.Count)" -ForegroundColor $(if ($missingPriority.Count -eq 0) { 'Green' } else { 'Red' })
Write-Host "Multiple priority labels: $($multiplePriority.Count)" -ForegroundColor $(if ($multiplePriority.Count -eq 0) { 'Green' } else { 'Yellow' })
Write-Host "Missing type labels: $($missingType.Count)" -ForegroundColor $(if ($missingType.Count -eq 0) { 'Green' } else { 'Red' })

# Detailed breakdown
if ($brokenDependencies.Count -gt 0) {
    Write-Host "`n--- BROKEN DEPENDENCIES ---" -ForegroundColor Red
    foreach ($item in $brokenDependencies) {
        Write-Host "  Issue #$($item.Issue): $($item.Title)"
        Write-Host "    Broken dependency: #$($item.BrokenDep) (label: $($item.Label))"
    }
}

if ($missingPriority.Count -gt 0) {
    Write-Host "`n--- MISSING PRIORITY LABELS ---" -ForegroundColor Red
    foreach ($item in $missingPriority) {
        Write-Host "  Issue #$($item.Issue): $($item.Title)"
    }
}

if ($multiplePriority.Count -gt 0) {
    Write-Host "`n--- MULTIPLE PRIORITY LABELS ---" -ForegroundColor Yellow
    foreach ($item in $multiplePriority) {
        Write-Host "  Issue #$($item.Issue): $($item.Title)"
        Write-Host "    Has: $($item.Priorities -join ', ')"
    }
}

if ($missingType.Count -gt 0) {
    Write-Host "`n--- MISSING TYPE LABELS ---" -ForegroundColor Red
    foreach ($item in $missingType) {
        Write-Host "  Issue #$($item.Issue): $($item.Title)"
        Write-Host "    Needs: $($item.NeededLabel)"
    }
}

# Export results for fix script
$results = @{
    BrokenDependencies = $brokenDependencies
    MissingPriority = $missingPriority
    MultiplePriority = $multiplePriority
    MissingType = $missingType
}

$results | ConvertTo-Json -Depth 10 | Out-File "audit_results.json" -Encoding UTF8
Write-Host "`nResults exported to audit_results.json" -ForegroundColor Green

Write-Host "`n=== AUDIT COMPLETE ===" -ForegroundColor Cyan
