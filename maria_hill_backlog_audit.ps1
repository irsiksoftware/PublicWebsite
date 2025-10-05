# MARIA HILL - BACKLOG COORDINATOR
# Mission: Audit and fix backlog health

Write-Host "=== MARIA HILL BACKLOG AUDIT ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Fetch all open issues
Write-Host "[PHASE 1] Fetching all open issues..." -ForegroundColor Yellow

# Write to temp file to capture actual JSON output
$tempFile = [System.IO.Path]::GetTempFileName()
& gh issue list --state open --json number,title,labels,state --limit 1000 > $tempFile 2>&1

# Read the file
$issuesRaw = Get-Content $tempFile -Raw
Remove-Item $tempFile

# Check if we got output
if ([string]::IsNullOrWhiteSpace($issuesRaw)) {
    Write-Host "ERROR: No output from gh command" -ForegroundColor Red
    exit 1
}

# Convert from JSON
try {
    $issues = $issuesRaw | ConvertFrom-Json
}
catch {
    Write-Host "ERROR: Failed to parse JSON" -ForegroundColor Red
    Write-Host "Raw output (first 500 chars): $($issuesRaw.Substring(0, [Math]::Min(500, $issuesRaw.Length)))" -ForegroundColor Gray
    exit 1
}

Write-Host "Found $($issues.Count) open issues" -ForegroundColor Green
Write-Host ""

# Initialize trackers
$brokenDeps = @()
$missingPriority = @()
$multiplePriority = @()
$missingType = @()
$fixesApplied = @()

# Priority labels
$priorities = @('CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW')

# Step 2: Audit each issue
Write-Host "[PHASE 2] Auditing issues..." -ForegroundColor Yellow

foreach ($issue in $issues) {
    $num = $issue.number
    $title = $issue.title
    $labels = $issue.labels | ForEach-Object { $_.name }

    Write-Host "  Checking issue #$num..." -ForegroundColor DarkGray

    # Check dependencies (d1, d2, d3, etc.)
    $depLabels = $labels | Where-Object { $_ -match '^d(\d+)$' }

    foreach ($depLabel in $depLabels) {
        if ($depLabel -match '^d(\d+)$') {
            $depNum = $Matches[1]

            # Try to fetch the dependency
            $depCheck = gh issue view $depNum --json number,state 2>&1

            if ($LASTEXITCODE -ne 0 -or $depCheck -match "Could not resolve") {
                $brokenDeps += [PSCustomObject]@{
                    IssueNumber = $num
                    DependsOn = $depNum
                    Title = $title
                    Label = $depLabel
                }
                Write-Host "    BROKEN: Issue #$num depends on non-existent #$depNum" -ForegroundColor Red
            }
        }
    }

    # Check priority labels
    $priorityLabels = $labels | Where-Object { $priorities -contains $_.ToUpper() }

    if ($priorityLabels.Count -eq 0) {
        $missingPriority += [PSCustomObject]@{
            IssueNumber = $num
            Title = $title
        }
        Write-Host "    MISSING: Priority label" -ForegroundColor Yellow
    }
    elseif ($priorityLabels.Count -gt 1) {
        $multiplePriority += [PSCustomObject]@{
            IssueNumber = $num
            Priorities = ($priorityLabels -join ", ")
            Title = $title
        }
        Write-Host "    MULTIPLE: Priority labels ($($priorityLabels -join ', '))" -ForegroundColor Magenta
    }

    # Check type labels based on title keywords
    $titleLower = $title.ToLower()
    $labelNames = $labels | ForEach-Object { $_.ToLower() }

    $typeIssues = @()

    if ($titleLower -match 'test|testing' -and $labelNames -notcontains 'testing') {
        $typeIssues += 'testing'
    }

    if ($titleLower -match 'bug|fix|error' -and $labelNames -notcontains 'bug') {
        $typeIssues += 'bug'
    }

    if ($titleLower -match 'feature|add|create|implement|build|design' -and $labelNames -notcontains 'feature') {
        $typeIssues += 'feature'
    }

    if ($typeIssues.Count -gt 0) {
        $missingType += [PSCustomObject]@{
            IssueNumber = $num
            MissingLabels = ($typeIssues -join ", ")
            Title = $title
        }
        Write-Host "    MISSING: Type label(s): $($typeIssues -join ', ')" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== AUDIT RESULTS ===" -ForegroundColor Cyan
Write-Host "Broken Dependencies: $($brokenDeps.Count)" -ForegroundColor $(if ($brokenDeps.Count -gt 0) { 'Red' } else { 'Green' })
Write-Host "Missing Priority: $($missingPriority.Count)" -ForegroundColor $(if ($missingPriority.Count -gt 0) { 'Yellow' } else { 'Green' })
Write-Host "Multiple Priority: $($multiplePriority.Count)" -ForegroundColor $(if ($multiplePriority.Count -gt 0) { 'Magenta' } else { 'Green' })
Write-Host "Missing Type Labels: $($missingType.Count)" -ForegroundColor $(if ($missingType.Count -gt 0) { 'Yellow' } else { 'Green' })
Write-Host ""

# Step 3: FIX PHASE
Write-Host "[PHASE 3] Applying fixes..." -ForegroundColor Yellow
Write-Host ""

# Fix broken dependencies
if ($brokenDeps.Count -gt 0) {
    Write-Host "Fixing broken dependencies..." -ForegroundColor Cyan

    foreach ($broken in $brokenDeps) {
        $depNum = [int]$broken.DependsOn

        if ($depNum -gt 100) {
            # Likely deleted/invalid - remove label
            Write-Host "  Issue #$($broken.IssueNumber): Removing dependency label '$($broken.Label)' (dep #$depNum likely deleted)" -ForegroundColor Yellow
            gh issue edit $broken.IssueNumber --remove-label $broken.Label

            if ($LASTEXITCODE -eq 0) {
                $fixesApplied += "Removed broken dependency label '$($broken.Label)' from issue #$($broken.IssueNumber)"
                Write-Host "    SUCCESS" -ForegroundColor Green
            }
        }
        else {
            # May be needed - report for manual review
            Write-Host "  Issue #$($broken.IssueNumber): Dependency #$depNum < 100 - needs manual review" -ForegroundColor Magenta
            $fixesApplied += "MANUAL REVIEW NEEDED: Issue #$($broken.IssueNumber) depends on #$depNum"
        }
    }
}

# Fix missing priority labels
if ($missingPriority.Count -gt 0) {
    Write-Host ""
    Write-Host "Adding missing priority labels..." -ForegroundColor Cyan

    foreach ($missing in $missingPriority) {
        Write-Host "  Issue #$($missing.IssueNumber): Adding 'MEDIUM' label" -ForegroundColor Yellow
        gh issue edit $missing.IssueNumber --add-label MEDIUM

        if ($LASTEXITCODE -eq 0) {
            $fixesApplied += "Added MEDIUM priority to issue #$($missing.IssueNumber)"
            Write-Host "    SUCCESS" -ForegroundColor Green
        }
    }
}

# Fix multiple priority labels
if ($multiplePriority.Count -gt 0) {
    Write-Host ""
    Write-Host "Fixing multiple priority labels..." -ForegroundColor Cyan

    foreach ($multi in $multiplePriority) {
        $prioList = $multi.Priorities -split ", "

        # Determine highest priority
        $highest = $null
        foreach ($p in $priorities) {
            if ($prioList -contains $p) {
                $highest = $p
                break
            }
        }

        # Remove others
        foreach ($p in $prioList) {
            if ($p -ne $highest) {
                Write-Host "  Issue #$($multi.IssueNumber): Removing '$p' (keeping $highest)" -ForegroundColor Yellow
                gh issue edit $multi.IssueNumber --remove-label $p

                if ($LASTEXITCODE -eq 0) {
                    $fixesApplied += "Removed duplicate priority '$p' from issue #$($multi.IssueNumber) (kept $highest)"
                }
            }
        }
    }
}

# Fix missing type labels
if ($missingType.Count -gt 0) {
    Write-Host ""
    Write-Host "Adding missing type labels..." -ForegroundColor Cyan

    foreach ($missing in $missingType) {
        $labelsToAdd = $missing.MissingLabels -split ", "

        foreach ($label in $labelsToAdd) {
            Write-Host "  Issue #$($missing.IssueNumber): Adding '$label' label" -ForegroundColor Yellow
            gh issue edit $missing.IssueNumber --add-label $label

            if ($LASTEXITCODE -eq 0) {
                $fixesApplied += "Added '$label' type label to issue #$($missing.IssueNumber)"
                Write-Host "    SUCCESS" -ForegroundColor Green
            }
        }
    }
}

Write-Host ""
Write-Host "=== FINAL REPORT ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Issues Audited: $($issues.Count)" -ForegroundColor White
Write-Host "Fixes Applied: $($fixesApplied.Count)" -ForegroundColor Green
Write-Host ""

if ($fixesApplied.Count -gt 0) {
    Write-Host "Changes made:" -ForegroundColor Cyan
    foreach ($fix in $fixesApplied) {
        Write-Host "  - $fix" -ForegroundColor Gray
    }
    Write-Host ""
}

# Determine backlog status
$manualReviewNeeded = $fixesApplied | Where-Object { $_ -match "MANUAL REVIEW" }

if ($manualReviewNeeded.Count -gt 0) {
    Write-Host "BACKLOG STATUS: NEEDS HUMAN INTERVENTION" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual review required for:" -ForegroundColor Yellow
    foreach ($review in $manualReviewNeeded) {
        Write-Host "  - $review" -ForegroundColor Yellow
    }
}
else {
    Write-Host "BACKLOG STATUS: UNBLOCKED" -ForegroundColor Green
    Write-Host "All issues are now workable!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== MARIA HILL OUT ===" -ForegroundColor Cyan
