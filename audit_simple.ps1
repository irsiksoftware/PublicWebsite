# Simple backlog audit - parse text output directly
Write-Host "=== BACKLOG HEALTH AUDIT ===" -ForegroundColor Cyan

$brokenDeps = @()
$missingPri = @()
$fixActions = @()

# Get issues as text
$issues = gh issue list --state open --limit 100

# Parse issue list - format: #NUMBER [STATE] [LABELS] Title
$issueLines = $issues -split "`n" | Where-Object { $_ -match '^\#(\d+)' }

Write-Host "Found $($issueLines.Count) issues to audit`n" -ForegroundColor Green

foreach ($line in $issueLines) {
    if ($line -match '^\#(\d+)\s+\[(\w+)\]\s+\[(.*?)\]\s+(.+)$') {
        $num = $matches[1]
        $state = $matches[2]
        $labelsRaw = $matches[3]
        $title = $matches[4]

        $labels = $labelsRaw -split ',\s*'

        Write-Host "#$num : $title" -ForegroundColor White
        Write-Host "  Labels: $labelsRaw" -ForegroundColor Gray

        # Check for dependency labels
        $depLabels = $labels | Where-Object { $_ -match '^d(\d+)$' }
        foreach ($depLabel in $depLabels) {
            $depNum = $depLabel -replace '^d', ''
            Write-Host "  Checking dependency: d$depNum -> #$depNum" -ForegroundColor Magenta

            # Verify dependency exists
            $checkResult = gh issue view $depNum 2>&1
            if ($LASTEXITCODE -ne 0 -or $checkResult -match 'Could not resolve|not found') {
                Write-Host "    BROKEN: #$depNum does not exist!" -ForegroundColor Red
                $brokenDeps += "Issue #$num has broken dependency #$depNum (label: $depLabel)"

                # Decision: remove if > 100, else flag for review
                if ([int]$depNum -gt 100) {
                    $fixActions += "gh issue edit $num --remove-label $depLabel  # Removing likely invalid dep"
                } else {
                    Write-Host "    ACTION NEEDED: Dependency #$depNum < 100, may need placeholder" -ForegroundColor Yellow
                }
            } else {
                Write-Host "    OK: #$depNum exists" -ForegroundColor Green
            }
        }

        # Check priority labels
        $priorityLabels = @('CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW')
        $hasPriority = $labels | Where-Object { $priorityLabels -contains $_ }

        if ($hasPriority.Count -eq 0) {
            Write-Host "  MISSING PRIORITY: Adding MEDIUM" -ForegroundColor Yellow
            $missingPri += "Issue #$num : $title"
            $fixActions += "gh issue edit $num --add-label MEDIUM  # Default priority"
        } elseif ($hasPriority.Count -gt 1) {
            Write-Host "  MULTIPLE PRIORITIES: $($hasPriority -join ', ')" -ForegroundColor Yellow
            # Keep highest, remove rest
            $priorityOrder = @{'CRITICAL'=1; 'URGENT'=2; 'HIGH'=3; 'MEDIUM'=4; 'LOW'=5}
            $highest = ($hasPriority | Sort-Object { $priorityOrder[$_] })[0]
            $toRemove = $hasPriority | Where-Object { $_ -ne $highest }
            foreach ($rem in $toRemove) {
                $fixActions += "gh issue edit $num --remove-label $rem  # Removing duplicate priority"
            }
        } else {
            Write-Host "  Priority: $hasPriority" -ForegroundColor Green
        }

        Write-Host ""
    }
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Broken dependencies: $($brokenDeps.Count)" -ForegroundColor $(if ($brokenDeps.Count -eq 0) { 'Green' } else { 'Red' })
Write-Host "Missing priority: $($missingPri.Count)" -ForegroundColor $(if ($missingPri.Count -eq 0) { 'Green' } else { 'Yellow' })
Write-Host "Fix actions needed: $($fixActions.Count)" -ForegroundColor White

if ($brokenDeps.Count -gt 0) {
    Write-Host "`n--- BROKEN DEPENDENCIES ---" -ForegroundColor Red
    $brokenDeps | ForEach-Object { Write-Host "  $_" }
}

if ($missingPri.Count -gt 0) {
    Write-Host "`n--- MISSING PRIORITY ---" -ForegroundColor Yellow
    $missingPri | ForEach-Object { Write-Host "  $_" }
}

if ($fixActions.Count -gt 0) {
    Write-Host "`n--- FIX COMMANDS ---" -ForegroundColor Cyan
    $fixActions | ForEach-Object { Write-Host "  $_" }

    # Export fix commands
    $fixActions | Out-File "fix_commands.txt" -Encoding UTF8
    Write-Host "`nFix commands exported to fix_commands.txt" -ForegroundColor Green
}

Write-Host "`n=== AUDIT COMPLETE ===" -ForegroundColor Cyan
