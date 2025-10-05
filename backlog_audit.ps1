# BACKLOG AUDIT SCRIPT
$gh = "C:\Program Files\GitHub CLI\gh.bat"

# Get all open issues
Write-Host "=== FETCHING ALL OPEN ISSUES ===" -ForegroundColor Cyan
$issueNumbers = & $gh issue list --state open --limit 1000 | ForEach-Object {
    if ($_ -match "^#(\d+)") {
        $matches[1]
    }
}

Write-Host "Found $($issueNumbers.Count) open issues" -ForegroundColor Green

# Audit results
$brokenDeps = @()
$missingPriority = @()
$missingType = @()
$multiplePriority = @()

$priorityLabels = @('CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW')
$typeKeywords = @{
    'test' = 'testing'
    'testing' = 'testing'
    'bug' = 'bug'
    'fix' = 'bug'
    'error' = 'bug'
    'feature' = 'feature'
    'add' = 'feature'
    'create' = 'feature'
}

Write-Host "`n=== AUDITING ISSUES ===" -ForegroundColor Cyan

foreach ($num in $issueNumbers) {
    Write-Host "Checking issue #$num..." -ForegroundColor Gray

    # Get issue details
    $output = & $gh issue view $num --json number,title,labels,body 2>&1
    $issueText = $output -join "`n"

    # Extract labels from output
    $labels = @()
    if ($issueText -match 'Labels: (.+)') {
        $labels = $matches[1] -split ', ' | ForEach-Object { $_.Trim() }
    }

    # Extract title
    $title = ""
    if ($issueText -match 'Issue #\d+: (.+)') {
        $title = $matches[1]
    }

    # Extract body/description
    $body = ""
    if ($issueText -match '--- Description ---\s+(.+)') {
        $body = $matches[1]
    }

    # Check for dependency labels (d1, d2, d3, etc.)
    $depLabels = $labels | Where-Object { $_ -match '^d(\d+)$' }

    foreach ($depLabel in $depLabels) {
        if ($depLabel -match '^d(\d+)$') {
            $depNum = $matches[1]

            # Verify dependency exists
            $depCheck = & $gh issue view $depNum --json number,state 2>&1
            $depCheckText = $depCheck -join "`n"

            if ($depCheckText -match 'Could not resolve') {
                $brokenDeps += [PSCustomObject]@{
                    Issue = $num
                    DependsOn = $depNum
                    Label = $depLabel
                }
                Write-Host "  ❌ BROKEN: Issue #$num depends on non-existent #$depNum" -ForegroundColor Red
            }
        }
    }

    # Check dependencies in body text
    if ($body -match 'Depends on.*?#(\d+)' -or $body -match 'depends on.*?#(\d+)') {
        $bodyDepNum = $matches[1]
        $expectedLabel = "d$bodyDepNum"

        if ($expectedLabel -notin $labels) {
            Write-Host "  ⚠️  Issue #$num mentions dependency #$bodyDepNum but missing label $expectedLabel" -ForegroundColor Yellow
        }
    }

    # Check priority labels
    $foundPriority = $labels | Where-Object { $_ -in $priorityLabels }

    if ($foundPriority.Count -eq 0) {
        $missingPriority += $num
        Write-Host "  ⚠️  Missing priority label" -ForegroundColor Yellow
    }
    elseif ($foundPriority.Count -gt 1) {
        $multiplePriority += [PSCustomObject]@{
            Issue = $num
            Labels = $foundPriority
        }
        Write-Host "  ⚠️  Multiple priority labels: $($foundPriority -join ', ')" -ForegroundColor Yellow
    }

    # Check for type labels based on title keywords
    $titleLower = $title.ToLower()
    $hasTypeLabel = $false

    foreach ($keyword in $typeKeywords.Keys) {
        if ($titleLower -match $keyword) {
            $expectedType = $typeKeywords[$keyword]
            if ($expectedType -notin $labels) {
                $missingType += [PSCustomObject]@{
                    Issue = $num
                    Title = $title
                    MissingLabel = $expectedType
                }
                Write-Host "  ⚠️  Title suggests '$expectedType' label but it's missing" -ForegroundColor Yellow
            }
            break
        }
    }
}

# Summary
Write-Host "`n=== AUDIT SUMMARY ===" -ForegroundColor Cyan
Write-Host "Broken dependencies: $($brokenDeps.Count)" -ForegroundColor $(if ($brokenDeps.Count -gt 0) { 'Red' } else { 'Green' })
Write-Host "Missing priority labels: $($missingPriority.Count)" -ForegroundColor $(if ($missingPriority.Count -gt 0) { 'Yellow' } else { 'Green' })
Write-Host "Multiple priority labels: $($multiplePriority.Count)" -ForegroundColor $(if ($multiplePriority.Count -gt 0) { 'Yellow' } else { 'Green' })
Write-Host "Missing type labels: $($missingType.Count)" -ForegroundColor $(if ($missingType.Count -gt 0) { 'Yellow' } else { 'Green' })

# Export results
$results = @{
    BrokenDependencies = $brokenDeps
    MissingPriority = $missingPriority
    MultiplePriority = $multiplePriority
    MissingType = $missingType
}

$results | ConvertTo-Json -Depth 10 | Out-File "audit_results.json"
Write-Host "`nResults saved to audit_results.json" -ForegroundColor Green
