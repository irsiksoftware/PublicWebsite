# PR_FIXER - Cyclops Tactical Field Commander
Write-Host "=== PR FIXER - Cyclops Tactical Commander ===" -ForegroundColor Cyan
Write-Host ""

# Fetch all open PRs
Write-Host "[1/5] Fetching open PRs..." -ForegroundColor Yellow
$prsJson = gh pr list --state open --json number,title,mergeable,headRefName,isDraft,createdAt,commits
$prs = $prsJson | ConvertFrom-Json

if (-not $prs -or $prs.Count -eq 0) {
    Write-Host "No open PRs found." -ForegroundColor Green
    exit 0
}

Write-Host "Found $($prs.Count) open PR(s)" -ForegroundColor Green

# Initialize tracking
$fixed = @()
$closed = @()
$skipped = @()

# Process each PR
Write-Host ""
Write-Host "[2/5] Analyzing PRs..." -ForegroundColor Yellow

foreach ($pr in $prs) {
    $prNum = $pr.number
    $title = $pr.title
    $mergeable = $pr.mergeable
    $headRef = $pr.headRefName
    $createdAt = [DateTime]$pr.createdAt
    $age = (Get-Date) - $createdAt

    Write-Host ""
    Write-Host "PR #$prNum : $title" -ForegroundColor Cyan
    Write-Host "  Branch: $headRef | Mergeable: $mergeable | Age: $([math]::Round($age.TotalHours, 1))h" -ForegroundColor Gray

    # Process based on mergeable status
    switch ($mergeable) {
        "CONFLICTING" {
            Write-Host "  [ACTION] Merge conflicts detected!" -ForegroundColor Red

            # Notify Discord
            Write-Host "  → Notifying Discord..." -ForegroundColor Yellow
            try {
                python core/discord_notifier.py pr_conflict "Scott Summers" $prNum "Merge conflicts detected, attempting rebase" 2>&1 | Out-Null
            } catch {
                Write-Host "    Warning: Discord notification failed" -ForegroundColor DarkYellow
            }

            # Perform rebase
            Write-Host "  → Starting rebase operation..." -ForegroundColor Yellow

            # Fetch latest
            git fetch origin 2>&1 | Out-Null

            # Checkout PR branch
            Write-Host "    Checking out $headRef..." -ForegroundColor Gray
            git checkout $headRef 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Host "    ERROR: Failed to checkout branch" -ForegroundColor Red
                $skipped += @{PR=$prNum; Reason="Checkout failed"}
                continue
            }

            # Attempt rebase
            Write-Host "    Rebasing..." -ForegroundColor Gray
            git rebase origin/main 2>&1 | Out-Null
            $rebaseExitCode = $LASTEXITCODE

            if ($rebaseExitCode -ne 0) {
                # Conflicts detected
                Write-Host "    Conflicts detected during rebase" -ForegroundColor Yellow
                $conflictFiles = git diff --name-only --diff-filter=U

                if ($conflictFiles) {
                    Write-Host "    Conflicting files: $($conflictFiles -join ', ')" -ForegroundColor DarkYellow
                    Write-Host "    → Manual resolution required - aborting rebase" -ForegroundColor Red
                    git rebase --abort 2>&1 | Out-Null

                    try {
                        python core/discord_notifier.py pr_conflict "Scott Summers" $prNum "Rebase failed: Manual conflict resolution required" 2>&1 | Out-Null
                    } catch { }

                    $skipped += @{PR=$prNum; Reason="Manual conflict resolution required"}
                } else {
                    Write-Host "    ERROR: Rebase failed for unknown reason" -ForegroundColor Red
                    git rebase --abort 2>&1 | Out-Null
                    $skipped += @{PR=$prNum; Reason="Rebase failed"}
                }

                git checkout main 2>&1 | Out-Null
                continue
            }

            # Rebase successful - push
            Write-Host "    → Rebase successful, pushing..." -ForegroundColor Green
            git push --force-with-lease origin $headRef 2>&1 | Out-Null

            if ($LASTEXITCODE -ne 0) {
                Write-Host "    ERROR: Push failed" -ForegroundColor Red
                $skipped += @{PR=$prNum; Reason="Push failed"}
                git checkout main 2>&1 | Out-Null
                continue
            }

            # Verify merge status
            Write-Host "    → Verifying merge status..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
            $verifyJson = gh pr view $prNum --json mergeable
            $verifyPR = $verifyJson | ConvertFrom-Json

            if ($verifyPR.mergeable -eq "MERGEABLE") {
                Write-Host "    ✓ Conflicts resolved successfully!" -ForegroundColor Green

                try {
                    python core/discord_notifier.py pr_fixed "Scott Summers" $prNum "Conflicts resolved via rebase" 2>&1 | Out-Null
                } catch { }

                $fixed += $prNum
            } else {
                Write-Host "    WARNING: Status still shows $($verifyPR.mergeable)" -ForegroundColor Yellow
                $skipped += @{PR=$prNum; Reason="Status verification failed"}
            }

            git checkout main 2>&1 | Out-Null
        }

        "UNKNOWN" {
            Write-Host "  [SKIP] Status checks pending" -ForegroundColor DarkYellow
            $skipped += @{PR=$prNum; Reason="Status checks pending"}
        }

        "MERGEABLE" {
            Write-Host "  [SKIP] Already mergeable - ready for review" -ForegroundColor Green

            if ($age.TotalHours -gt 24 -and $pr.commits.Count -eq 0) {
                Write-Host "  [WARNING] PR is stale (>24h, no commits)" -ForegroundColor Yellow
            }

            $skipped += @{PR=$prNum; Reason="Already mergeable"}
        }

        default {
            Write-Host "  [SKIP] Unknown merge status: $mergeable" -ForegroundColor DarkYellow
            $skipped += @{PR=$prNum; Reason="Unknown status: $mergeable"}
        }
    }
}

# Cleanup
Write-Host ""
Write-Host "[3/5] Cleanup..." -ForegroundColor Yellow
git checkout main 2>&1 | Out-Null
git pull origin main 2>&1 | Out-Null
Write-Host "  ✓ Returned to main branch" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host ""

if ($fixed.Count -gt 0) {
    Write-Host "Fixed ($($fixed.Count)):" -ForegroundColor Green
    foreach ($prNum in $fixed) {
        Write-Host "  - PR #$prNum" -ForegroundColor Green
    }
    Write-Host ""
}

if ($closed.Count -gt 0) {
    Write-Host "Closed ($($closed.Count)):" -ForegroundColor Yellow
    foreach ($prNum in $closed) {
        Write-Host "  - PR #$prNum" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($skipped.Count -gt 0) {
    Write-Host "Skipped ($($skipped.Count)):" -ForegroundColor DarkYellow
    foreach ($item in $skipped) {
        Write-Host "  - PR #$($item.PR): $($item.Reason)" -ForegroundColor DarkYellow
    }
    Write-Host ""
}

Write-Host "=== OPERATION COMPLETE ===" -ForegroundColor Cyan
