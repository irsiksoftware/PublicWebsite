# MARIA HILL - BACKLOG COORDINATOR (Simplified Direct Approach)
# Parse human-readable gh output and manually check each issue

Write-Host "=== MARIA HILL BACKLOG AUDIT ===" -ForegroundColor Cyan
Write-Host ""

# Fetch issue list (human readable format)
Write-Host "[PHASE 1] Fetching issue numbers..." -ForegroundColor Yellow
$rawList = gh issue list --state open --limit 1000

# Extract issue numbers using regex
$issueNumbers = @()
$rawList | ForEach-Object {
    if ($_ -match '#(\d+)') {
        $issueNumbers += [int]$Matches[1]
    }
}

Write-Host "Found $($issueNumbers.Count) open issues" -ForegroundColor Green
Write-Host ""

# Trackers
$brokenDeps = @()
$missingPriority = @()
$multiplePriority = @()
$missingType = @()
$fixesApplied = @()

$priorities = @('CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW')

# Audit each issue
Write-Host "[PHASE 2] Auditing each issue..." -ForegroundColor Yellow

$counter = 0
foreach ($num in $issueNumbers) {
    $counter++
    Write-Progress -Activity "Auditing issues" -Status "Issue #$num" -PercentComplete (($counter / $issueNumbers.Count) * 100)

    # Fetch full issue details
    $tempFile = [System.IO.Path]::GetTempFileName()
    gh issue view $num --json number,title,labels > $tempFile 2>&1
    $issueJson = Get-Content $tempFile -Raw
    Remove-Item $tempFile

    try {
        $issue = $issueJson | ConvertFrom-Json
        $title = $issue.title
        $labels = $issue.labels | ForEach-Object { $_.name }

        # Check dependencies
        $depLabels = $labels | Where-Object { $_ -match '^d(\d+)$' }

        foreach ($depLabel in $depLabels) {
            if ($depLabel -match '^d(\d+)$') {
                $depNum = [int]$Matches[1]

                # Check if dependency exists
                $depCheck = gh issue view $depNum --json number 2>&1

                if ($LASTEXITCODE -ne 0) {
                    $brokenDeps += [PSCustomObject]@{
                        IssueNumber = $num
                        DependsOn = $depNum
                        Title = $title
                        Label = $depLabel
                    }
                    Write-Host "  Issue #${num}: BROKEN dependency on #${depNum}" -ForegroundColor Red
                }
            }
        }

        # Check priority
        $priorityLabels = $labels | Where-Object { $priorities -contains $_.ToUpper() }

        if ($priorityLabels.Count -eq 0) {
            $missingPriority += [PSCustomObject]@{
                IssueNumber = $num
                Title = $title
            }
            Write-Host "  Issue #${num}: Missing priority" -ForegroundColor Yellow
        }
        elseif ($priorityLabels.Count -gt 1) {
            $multiplePriority += [PSCustomObject]@{
                IssueNumber = $num
                Priorities = ($priorityLabels -join ", ")
                Title = $title
            }
            Write-Host "  Issue #${num}: Multiple priorities ($($priorityLabels -join ', '))" -ForegroundColor Magenta
        }

        # Check type labels
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
            Write-Host "  Issue #${num}: Missing type: $($typeIssues -join ', ')" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "  Issue #${num}: Failed to parse issue data" -ForegroundColor Red
    }
}

Write-Progress -Activity "Auditing issues" -Completed

Write-Host ""
Write-Host "=== AUDIT RESULTS ===" -ForegroundColor Cyan
Write-Host "Broken Dependencies: $($brokenDeps.Count)" -ForegroundColor $(if ($brokenDeps.Count -gt 0) { 'Red' } else { 'Green' })
Write-Host "Missing Priority: $($missingPriority.Count)" -ForegroundColor $(if ($missingPriority.Count -gt 0) { 'Yellow' } else { 'Green' })
Write-Host "Multiple Priority: $($multiplePriority.Count)" -ForegroundColor $(if ($multiplePriority.Count -gt 0) { 'Magenta' } else { 'Green' })
Write-Host "Missing Type Labels: $($missingType.Count)" -ForegroundColor $(if ($missingType.Count -gt 0) { 'Yellow' } else { 'Green' })
Write-Host ""

# FIX PHASE
Write-Host "[PHASE 3] Applying fixes..." -ForegroundColor Yellow
Write-Host ""

# Fix broken dependencies
if ($brokenDeps.Count -gt 0) {
    Write-Host "Fixing broken dependencies..." -ForegroundColor Cyan

    foreach ($broken in $brokenDeps) {
        $depNum = [int]$broken.DependsOn

        if ($depNum -gt 100) {
            Write-Host "  Issue #$($broken.IssueNumber): Removing label '$($broken.Label)' (dep #${depNum} > 100, likely deleted)" -ForegroundColor Yellow
            gh issue edit $broken.IssueNumber --remove-label $broken.Label 2>&1 | Out-Null

            if ($LASTEXITCODE -eq 0) {
                $fixesApplied += "Removed broken dependency label '$($broken.Label)' from #$($broken.IssueNumber)"
                Write-Host "    [OK] SUCCESS" -ForegroundColor Green
            }
            else {
                Write-Host "    [X] FAILED" -ForegroundColor Red
            }
        }
        else {
            Write-Host "  Issue #$($broken.IssueNumber): Dep #${depNum} < 100 - MANUAL REVIEW NEEDED" -ForegroundColor Magenta
            $fixesApplied += "MANUAL: Issue #$($broken.IssueNumber) depends on #$depNum (needs review)"
        }
    }
    Write-Host ""
}

# Fix missing priority
if ($missingPriority.Count -gt 0) {
    Write-Host "Adding MEDIUM priority to issues missing priority..." -ForegroundColor Cyan

    foreach ($missing in $missingPriority) {
        Write-Host "  Issue #$($missing.IssueNumber): Adding MEDIUM" -ForegroundColor Yellow
        gh issue edit $missing.IssueNumber --add-label MEDIUM 2>&1 | Out-Null

        if ($LASTEXITCODE -eq 0) {
            $fixesApplied += "Added MEDIUM priority to #$($missing.IssueNumber)"
            Write-Host "    âœ" SUCCESS" -ForegroundColor Green
        }
        else {
            Write-Host "    âœ— FAILED" -ForegroundColor Red
        }
    }
    Write-Host ""
}

# Fix multiple priorities
if ($multiplePriority.Count -gt 0) {
    Write-Host "Fixing multiple priority labels..." -ForegroundColor Cyan

    foreach ($multi in $multiplePriority) {
        $prioList = $multi.Priorities -split ", "

        # Find highest priority
        $highest = $null
        foreach ($p in $priorities) {
            if ($prioList -contains $p) {
                $highest = $p
                break
            }
        }

        # Remove duplicates
        foreach ($p in $prioList) {
            if ($p -ne $highest) {
                Write-Host "  Issue #$($multi.IssueNumber): Removing '$p' (keeping $highest)" -ForegroundColor Yellow
                gh issue edit $multi.IssueNumber --remove-label $p 2>&1 | Out-Null

                if ($LASTEXITCODE -eq 0) {
                    $fixesApplied += "Removed duplicate '$p' from #$($multi.IssueNumber) (kept $highest)"
                    Write-Host "    [OK] SUCCESS" -ForegroundColor Green
                }
            }
        }
    }
    Write-Host ""
}

# Fix missing type labels
if ($missingType.Count -gt 0) {
    Write-Host "Adding missing type labels..." -ForegroundColor Cyan

    foreach ($missing in $missingType) {
        $labelsToAdd = $missing.MissingLabels -split ", "

        foreach ($label in $labelsToAdd) {
            Write-Host "  Issue #$($missing.IssueNumber): Adding '$label'" -ForegroundColor Yellow
            gh issue edit $missing.IssueNumber --add-label $label 2>&1 | Out-Null

            if ($LASTEXITCODE -eq 0) {
                $fixesApplied += "Added '$label' to #$($missing.IssueNumber)"
                Write-Host "    [OK] SUCCESS" -ForegroundColor Green
            }
            else {
                Write-Host "    [X] FAILED" -ForegroundColor Red
            }
        }
    }
    Write-Host ""
}

# FINAL REPORT
Write-Host "=== FINAL REPORT ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Issues Audited: $($issueNumbers.Count)" -ForegroundColor White
Write-Host "Fixes Applied: $($fixesApplied.Count)" -ForegroundColor Green
Write-Host ""

if ($fixesApplied.Count -gt 0) {
    Write-Host "Changes Made:" -ForegroundColor Cyan
    foreach ($fix in $fixesApplied) {
        Write-Host "  - $fix" -ForegroundColor Gray
    }
    Write-Host ""
}

# Determine status
$manualReviewNeeded = $fixesApplied | Where-Object { $_ -match "^MANUAL:" }

if ($manualReviewNeeded.Count -gt 0) {
    Write-Host "BACKLOG STATUS: NEEDS HUMAN INTERVENTION" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual Review Required:" -ForegroundColor Yellow
    foreach ($review in $manualReviewNeeded) {
        Write-Host "  - $review" -ForegroundColor Yellow
    }
}
else {
    Write-Host "BACKLOG STATUS: UNBLOCKED [OK]" -ForegroundColor Green
    Write-Host "All issues are workable. Swarm is ready to deploy!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== MARIA HILL - MISSION COMPLETE ===" -ForegroundColor Cyan
