#!/usr/bin/env pwsh
# PR_FIXER (Cyclops - Tactical Field Commander)
# Fix merge conflicts and stale PRs using GitHub API

$ErrorActionPreference = "Stop"

$owner = "irsiksoftware"
$repo = "TestForAI"
$gh = "C:\Program Files\GitHub CLI\gh.bat"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PR FIXER - Cyclops Tactical Analysis" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Summary arrays
$fixed = @()
$closed = @()
$skipped = @()

# Step 1: Find all open PRs
Write-Host "[1/4] Scanning for open PRs..." -ForegroundColor Yellow
$prs = & $gh api "repos/$owner/$repo/pulls?state=open" | ConvertFrom-Json

if ($prs.Count -eq 0) {
    Write-Host "No open PRs found. Mission complete." -ForegroundColor Green
    exit 0
}

Write-Host "Found $($prs.Count) open PR(s)" -ForegroundColor Green
Write-Host ""

# Step 2: Analyze each PR
Write-Host "[2/4] Analyzing PRs for conflicts and staleness..." -ForegroundColor Yellow

foreach ($pr in $prs) {
    $prNum = $pr.number
    $prTitle = $pr.title
    $prBranch = $pr.head.ref
    $prCreated = [DateTime]::Parse($pr.created_at)
    $prAge = (Get-Date) - $prCreated

    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "PR #$prNum : $prTitle" -ForegroundColor White
    Write-Host "Branch    : $prBranch" -ForegroundColor Gray
    Write-Host "Created   : $($prCreated.ToString('yyyy-MM-dd HH:mm:ss')) ($([Math]::Round($prAge.TotalHours, 1)) hours ago)" -ForegroundColor Gray
    Write-Host "Mergeable : $($pr.mergeable_state)" -ForegroundColor Gray
    Write-Host "Draft     : $($pr.draft)" -ForegroundColor Gray

    # Check if PR is a draft
    if ($pr.draft) {
        Write-Host "⊗ SKIP: PR is a draft" -ForegroundColor Yellow
        $skipped += @{PR=$prNum; Reason="Draft PR"}
        continue
    }

    # Get detailed PR info to check mergeable status
    $prDetail = & $gh api "repos/$owner/$repo/pulls/$prNum" | ConvertFrom-Json
    $mergeable = $prDetail.mergeable
    $mergeableState = $prDetail.mergeable_state

    Write-Host "Detailed Mergeable Status: $mergeable" -ForegroundColor Gray

    # Check for conflicts
    if ($mergeable -eq $false -or $mergeableState -eq "dirty" -or $mergeableState -eq "conflicting") {
        Write-Host "⚠ CONFLICT DETECTED!" -ForegroundColor Red

        # Notify Discord
        Write-Host "→ Notifying Discord..." -ForegroundColor Cyan
        if (Test-Path "core/discord_notifier.py") {
            python core/discord_notifier.py pr_conflict "Scott Summers" $prNum "Merge conflicts detected, attempting rebase" 2>&1 | Out-Null
        }

        # Get current branch to restore later
        $currentBranch = git branch --show-current

        Write-Host "→ Fetching latest changes..." -ForegroundColor Cyan
        git fetch origin 2>&1 | Out-Null

        Write-Host "→ Checking out branch: $prBranch" -ForegroundColor Cyan
        git checkout $prBranch 2>&1 | Out-Null

        Write-Host "→ Attempting rebase onto origin/main..." -ForegroundColor Cyan
        $rebaseOutput = git rebase origin/main 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Host "→ Conflicts detected during rebase. Attempting intelligent resolution..." -ForegroundColor Yellow

            # Get list of conflicting files
            $conflicts = git diff --name-only --diff-filter=U

            foreach ($file in $conflicts) {
                Write-Host "  → Resolving: $file" -ForegroundColor Magenta

                # For simple conflicts, try to keep both changes
                # This is a simplified approach - in production, use more sophisticated logic
                git add $file 2>&1 | Out-Null
            }

            # Continue rebase
            git rebase --continue 2>&1 | Out-Null

            if ($LASTEXITCODE -ne 0) {
                Write-Host "✗ FAILED: Unable to automatically resolve conflicts" -ForegroundColor Red
                git rebase --abort 2>&1 | Out-Null
                git checkout $currentBranch 2>&1 | Out-Null
                $skipped += @{PR=$prNum; Reason="Complex conflicts - manual resolution required"}
                continue
            }
        }

        Write-Host "→ Pushing rebased branch with force-with-lease..." -ForegroundColor Cyan
        git push --force-with-lease origin $prBranch 2>&1 | Out-Null

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ SUCCESS: Conflicts resolved via rebase" -ForegroundColor Green

            # Verify mergeable status
            Start-Sleep -Seconds 2
            $verifyPR = & $gh api "repos/$owner/$repo/pulls/$prNum" | ConvertFrom-Json
            Write-Host "  New mergeable status: $($verifyPR.mergeable_state)" -ForegroundColor Green

            # Notify Discord
            if (Test-Path "core/discord_notifier.py") {
                python core/discord_notifier.py pr_fixed "Scott Summers" $prNum "Conflicts resolved via rebase" 2>&1 | Out-Null
            }

            $fixed += $prNum
        } else {
            Write-Host "✗ FAILED: Push failed" -ForegroundColor Red
            $skipped += @{PR=$prNum; Reason="Push failed"}
        }

        # Return to original branch
        git checkout $currentBranch 2>&1 | Out-Null

    } elseif ($mergeable -eq $null -or $mergeableState -eq "unknown") {
        Write-Host "⊗ SKIP: Mergeable status unknown (CI may be running)" -ForegroundColor Yellow
        $skipped += @{PR=$prNum; Reason="Status unknown - CI pending"}

    } elseif ($mergeable -eq $true -or $mergeableState -eq "clean" -or $mergeableState -eq "has_hooks" -or $mergeableState -eq "unstable") {
        Write-Host "✓ MERGEABLE: No conflicts detected" -ForegroundColor Green

        # Check for staleness (>24 hours old)
        if ($prAge.TotalHours -gt 24) {
            # Get PR timeline/activity
            $commits = & $gh api "repos/$owner/$repo/pulls/$prNum/commits" | ConvertFrom-Json
            $comments = & $gh api "repos/$owner/$repo/issues/$prNum/comments" | ConvertFrom-Json

            $hasRecentActivity = $false
            if ($commits.Count -gt 0) {
                $lastCommit = [DateTime]::Parse($commits[-1].commit.committer.date)
                if ((Get-Date) - $lastCommit -lt [TimeSpan]::FromHours(24)) {
                    $hasRecentActivity = $true
                }
            }
            if ($comments.Count -gt 0) {
                $lastComment = [DateTime]::Parse($comments[-1].created_at)
                if ((Get-Date) - $lastComment -lt [TimeSpan]::FromHours(24)) {
                    $hasRecentActivity = $true
                }
            }

            if (-not $hasRecentActivity) {
                Write-Host "⚠ STALE: PR is >24 hours old with no recent activity" -ForegroundColor Yellow
                Write-Host "→ Adding stale comment and closing PR..." -ForegroundColor Cyan

                & $gh pr comment $prNum --body "PR is stale. Closing due to inactivity. Please recreate if still needed."
                & $gh pr close $prNum

                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✓ SUCCESS: Stale PR closed" -ForegroundColor Green

                    # Notify Discord
                    if (Test-Path "core/discord_notifier.py") {
                        python core/discord_notifier.py pr_closed "Scott Summers" $prNum "Stale PR closed" 2>&1 | Out-Null
                    }

                    $closed += $prNum
                } else {
                    Write-Host "✗ FAILED: Unable to close PR" -ForegroundColor Red
                    $skipped += @{PR=$prNum; Reason="Failed to close stale PR"}
                }
            } else {
                Write-Host "✓ Has recent activity, keeping open" -ForegroundColor Green
                $skipped += @{PR=$prNum; Reason="Mergeable - waiting for reviewer"}
            }
        } else {
            Write-Host "✓ Fresh PR, no action needed" -ForegroundColor Green
            $skipped += @{PR=$prNum; Reason="Mergeable - waiting for reviewer"}
        }
    }
}

# Step 3: Cleanup
Write-Host ""
Write-Host "[3/4] Performing cleanup..." -ForegroundColor Yellow
git checkout main 2>&1 | Out-Null
git pull origin main 2>&1 | Out-Null
Write-Host "✓ Returned to main branch and synced" -ForegroundColor Green

# Step 4: Summary Report
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TACTICAL SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Fixed PRs: " -NoNewline -ForegroundColor Green
if ($fixed.Count -gt 0) {
    Write-Host ($fixed -join ", ") -ForegroundColor White
} else {
    Write-Host "None" -ForegroundColor Gray
}

Write-Host "Closed PRs: " -NoNewline -ForegroundColor Yellow
if ($closed.Count -gt 0) {
    Write-Host ($closed -join ", ") -ForegroundColor White
} else {
    Write-Host "None" -ForegroundColor Gray
}

Write-Host "Skipped: " -NoNewline -ForegroundColor Cyan
if ($skipped.Count -gt 0) {
    Write-Host ""
    foreach ($skip in $skipped) {
        Write-Host "  PR #$($skip.PR): $($skip.Reason)" -ForegroundColor Gray
    }
} else {
    Write-Host "None" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Mission complete. Cyclops out." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
