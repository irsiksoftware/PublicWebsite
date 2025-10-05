# CYCLOPS PR FIXER - Tactical Field Commander
# Fix merge conflicts and stale PRs

Write-Host "=== CYCLOPS PR FIXER - TACTICAL ANALYSIS ===" -ForegroundColor Cyan
Write-Host ""

# Get current PRs
Write-Host "[RECON] Scanning for open PRs..." -ForegroundColor Yellow
$prListOutput = & "C:\Program Files\GitHub CLI\gh.bat" pr list --state open --limit 100 2>&1
Write-Host $prListOutput

# Extract PR number from output like "#168 [OPEN]..."
$prNumbers = @()
$prListOutput -split "`n" | ForEach-Object {
    if ($_ -match '^\s*\#(\d+)') {
        $prNumbers += $matches[1]
    }
}

Write-Host "`n[TACTICAL] Found $($prNumbers.Count) open PR(s): $($prNumbers -join ', ')" -ForegroundColor Green

if ($prNumbers.Count -eq 0) {
    Write-Host "[STATUS] No open PRs to process. Mission complete." -ForegroundColor Green
    exit 0
}

$fixed = @()
$closed = @()
$skipped = @()

foreach ($prNum in $prNumbers) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "[ANALYZING] PR #$prNum" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    # Get PR details using gh pr view
    $prViewOutput = & "C:\Program Files\GitHub CLI\gh.bat" pr view $prNum 2>&1
    Write-Host $prViewOutput

    # Extract key information from the output
    $title = ""
    $branch = ""
    $state = ""
    $mergeable = "UNKNOWN"

    $prViewOutput -split "`n" | ForEach-Object {
        if ($_ -match '^title:\s+(.+)$') { $title = $matches[1] }
        if ($_ -match '^state:\s+(\w+)$') { $state = $matches[1] }
        if ($_ -match '^\s*(\S+)\s+wants to merge') { $branch = $matches[1] }
    }

    # Check if PR has conflicts by looking for conflict indicators
    $hasConflicts = $prViewOutput -match 'conflict' -or $prViewOutput -match 'Merging is blocked'

    Write-Host "`n[DATA] Branch: $branch" -ForegroundColor White
    Write-Host "[DATA] Title: $title" -ForegroundColor White
    Write-Host "[DATA] Conflicts detected: $hasConflicts" -ForegroundColor White

    if ($hasConflicts) {
        Write-Host "`n[CONFLICT DETECTED] PR #$prNum has merge conflicts" -ForegroundColor Red

        # Notify Discord
        Write-Host "[NOTIFY] Alerting command via Discord..." -ForegroundColor Yellow
        & python core/discord_notifier.py pr_conflict "Scott Summers" $prNum "Merge conflicts detected, attempting rebase" 2>&1 | Out-Null

        # Attempt to fix conflicts
        Write-Host "[TACTICAL] Attempting to resolve conflicts on PR #$prNum..." -ForegroundColor Yellow

        # Fetch latest
        & git fetch origin 2>&1 | Out-Null

        # Checkout the PR branch
        Write-Host "[ACTION] Checking out branch: $branch" -ForegroundColor Yellow
        $checkoutResult = & git checkout $branch 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Failed to checkout branch $branch" -ForegroundColor Red
            Write-Host $checkoutResult
            $skipped += @{PR=$prNum; Reason="Failed to checkout branch"}
            continue
        }

        # Attempt rebase
        Write-Host "[ACTION] Rebasing $branch onto origin/main..." -ForegroundColor Yellow
        $rebaseResult = & git rebase origin/main 2>&1

        if ($rebaseResult -match 'conflict' -or $LASTEXITCODE -ne 0) {
            Write-Host "[CONFLICT] Rebase has conflicts. Analyzing..." -ForegroundColor Red

            # Check for conflict markers
            $conflictFiles = & git diff --name-only --diff-filter=U 2>&1
            Write-Host "[CONFLICT FILES] $conflictFiles" -ForegroundColor Red

            # For now, abort - human intervention needed for complex conflicts
            Write-Host "[DECISION] Complex conflicts detected. Aborting rebase - requires human review." -ForegroundColor Yellow
            & git rebase --abort 2>&1 | Out-Null

            # Notify that manual intervention is needed
            & python core/discord_notifier.py pr_conflict "Scott Summers" $prNum "Complex merge conflicts - manual review required" 2>&1 | Out-Null

            $skipped += @{PR=$prNum; Reason="Complex conflicts - manual review needed"}
        } else {
            Write-Host "[SUCCESS] Rebase successful!" -ForegroundColor Green

            # Push with force-with-lease
            Write-Host "[ACTION] Pushing rebased branch..." -ForegroundColor Yellow
            $pushResult = & git push --force-with-lease origin $branch 2>&1

            if ($LASTEXITCODE -eq 0) {
                Write-Host "[SUCCESS] PR #$prNum conflicts resolved!" -ForegroundColor Green
                & python core/discord_notifier.py pr_fixed "Scott Summers" $prNum "Conflicts resolved via rebase" 2>&1 | Out-Null
                $fixed += $prNum
            } else {
                Write-Host "[ERROR] Failed to push: $pushResult" -ForegroundColor Red
                $skipped += @{PR=$prNum; Reason="Failed to push rebased branch"}
            }
        }

        # Return to main
        & git checkout main 2>&1 | Out-Null
    } else {
        Write-Host "[STATUS] PR #$prNum is MERGEABLE or has no conflicts - skipping" -ForegroundColor Green
        $skipped += @{PR=$prNum; Reason="No conflicts detected"}
    }
}

# Cleanup
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "[CLEANUP] Returning to main branch..." -ForegroundColor Yellow
& git checkout main 2>&1 | Out-Null
& git pull origin main 2>&1 | Out-Null

# Summary Report
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "=== CYCLOPS TACTICAL SUMMARY ===" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[FIXED] $($fixed.Count) PR(s): $($fixed -join ', ')" -ForegroundColor Green
Write-Host "[CLOSED] $($closed.Count) PR(s): $($closed -join ', ')" -ForegroundColor Yellow
Write-Host "[SKIPPED] $($skipped.Count) PR(s)" -ForegroundColor Blue
$skipped | ForEach-Object { Write-Host "  - PR #$($_.PR): $($_.Reason)" -ForegroundColor Blue }
Write-Host "`n[CYCLOPS] Mission complete. All PRs analyzed." -ForegroundColor Green
