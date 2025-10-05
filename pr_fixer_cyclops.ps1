# PR_FIXER - Cyclops Tactical Field Commander
# Fix merge conflicts and stale PRs

Write-Host "=== PR FIXER - Cyclops Tactical Commander ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Fetch all open PRs
Write-Host "[1/5] Fetching open PRs..." -ForegroundColor Yellow
$prs = gh pr list --state open --json number,title,mergeable,headRefName,isDraft,createdAt,commits | ConvertFrom-Json

if ($prs.Count -eq 0) {
    Write-Host "No open PRs found." -ForegroundColor Green
    exit 0
}

Write-Host "Found $($prs.Count) open PR(s)" -ForegroundColor Green
Write-Host ""

# Initialize tracking
$fixed = @()
$closed = @()
$skipped = @()

# Step 2: Process each PR
Write-Host "[2/5] Analyzing PRs for conflicts and staleness..." -ForegroundColor Yellow

foreach ($pr in $prs) {
    $prNum = $pr.number
    $title = $pr.title
    $mergeable = $pr.mergeable
    $headRef = $pr.headRefName
    $isDraft = $pr.isDraft
    $createdAt = [DateTime]$pr.createdAt
    $age = (Get-Date) - $createdAt

    Write-Host ""
    Write-Host "PR #$prNum : $title" -ForegroundColor Cyan
    Write-Host "  Branch: $headRef" -ForegroundColor Gray
    Write-Host "  Mergeable: $mergeable" -ForegroundColor Gray
    Write-Host "  Age: $([math]::Round($age.TotalHours, 1)) hours" -ForegroundColor Gray

    # Check merge status
    if ($mergeable -eq "CONFLICTING") {
        Write-Host "  [ACTION] Merge conflicts detected!" -ForegroundColor Red

        # Notify Discord
        Write-Host "  → Notifying Discord..." -ForegroundColor Yellow
        try {
            python core/discord_notifier.py pr_conflict "Scott Summers" $prNum "Merge conflicts detected, attempting rebase"
        } catch {
            Write-Host "    Warning: Discord notification failed" -ForegroundColor DarkYellow
        }

        # Perform rebase
        Write-Host "  → Starting rebase operation..." -ForegroundColor Yellow

        # Fetch latest
        git fetch origin 2>&1 | Out-Null

        # Checkout PR branch
        $checkoutResult = git checkout $headRef 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "    ERROR: Failed to checkout branch $headRef" -ForegroundColor Red
            $skipped += @{PR=$prNum; Reason="Checkout failed"}
            continue
        }

        # Attempt rebase
        $rebaseResult = git rebase origin/main 2>&1

        if ($LASTEXITCODE -ne 0) {
            # Conflicts detected - attempt intelligent resolution
            Write-Host "    Conflicts detected during rebase" -ForegroundColor Yellow
            Write-Host "    → Analyzing conflicts..." -ForegroundColor Yellow

            $conflictFiles = git diff --name-only --diff-filter=U

            if ($conflictFiles) {
                Write-Host "    Conflicting files: $($conflictFiles -join ', ')" -ForegroundColor DarkYellow
                Write-Host "    → Manual resolution required - aborting rebase" -ForegroundColor Red
                git rebase --abort 2>&1 | Out-Null

                # Notify Discord
                try {
                    python core/discord_notifier.py pr_conflict "Scott Summers" $prNum "Rebase failed: Manual conflict resolution required"
                } catch {
                    # Ignore Discord errors
                }

                $skipped += @{PR=$prNum; Reason="Manual conflict resolution required"}
            } else {
                Write-Host "    ERROR: Rebase failed for unknown reason" -ForegroundColor Red
                git rebase --abort 2>&1 | Out-Null
                $skipped += @{PR=$prNum; Reason="Rebase failed"}
            }

            # Return to main
            git checkout main 2>&1 | Out-Null
            continue
        }

        # Rebase successful - push
        Write-Host "    → Rebase successful, pushing..." -ForegroundColor Green
        $pushResult = git push --force-with-lease origin $headRef 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Host "    ERROR: Push failed" -ForegroundColor Red
            $skipped += @{PR=$prNum; Reason="Push failed"}
            git checkout main 2>&1 | Out-Null
            continue
        }

        # Verify merge status
        Write-Host "    → Verifying merge status..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        $verifyPR = gh pr view $prNum --json mergeable | ConvertFrom-Json

        if ($verifyPR.mergeable -eq "MERGEABLE") {
            Write-Host "    ✓ Conflicts resolved successfully!" -ForegroundColor Green

            # Notify Discord
            try {
                python core/discord_notifier.py pr_fixed "Scott Summers" $prNum "Conflicts resolved via rebase"
            } catch {
                # Ignore Discord errors
            }

            $fixed += $prNum
        } else {
            Write-Host "    WARNING: Status still shows $($verifyPR.mergeable)" -ForegroundColor Yellow
            $skipped += @{PR=$prNum; Reason="Status verification failed"}
        }

        # Return to main
        git checkout main 2>&1 | Out-Null

    } elseif ($mergeable -eq "UNKNOWN") {
        Write-Host "  [SKIP] Status checks pending" -ForegroundColor DarkYellow
        $skipped += @{PR=$prNum; Reason="Status checks pending"}

    } elseif ($mergeable -eq "MERGEABLE") {
        Write-Host "  [SKIP] Already mergeable - ready for review" -ForegroundColor Green

        # Check for staleness
        if ($age.TotalHours -gt 24 -and $pr.commits.Count -eq 0) {
            Write-Host "  [WARNING] PR is stale (>24h, no commits)" -ForegroundColor Yellow
            # Note: Not auto-closing mergeable PRs - just flagging
        }

        $skipped += @{PR=$prNum; Reason="Already mergeable"}

    } else {
        Write-Host "  [SKIP] Unknown merge status: $mergeable" -ForegroundColor DarkYellow
        $skipped += @{PR=$prNum; Reason="Unknown status: $mergeable"}
    }
}

Write-Host ""

# Step 3: Cleanup
Write-Host "[3/5] Cleanup..." -ForegroundColor Yellow
git checkout main 2>&1 | Out-Null
git pull origin main 2>&1 | Out-Null
Write-Host "  ✓ Returned to main branch" -ForegroundColor Green

# Step 4: Summary
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
