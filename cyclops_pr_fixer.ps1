#!/usr/bin/env pwsh
# PR_FIXER (Cyclops - Tactical Field Commander)
# Fix merge conflicts and stale PRs using GitHub API

$ErrorActionPreference = "Stop"

$owner = "irsiksoftware"
$repo = "TestForAI"
$gh = "C:\Program Files\GitHub CLI\gh.bat"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PR FIXER - Cyclops Tactical Analysis" -ForegroundColor Cyan
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host ""

# Summary arrays
$fixed = @()
$closed = @()
$skipped = @()

# Step 1: Find all open PRs
Write-Host "[1/4] Scanning for open PRs..." -ForegroundColor Yellow
try {
    $prsJson = & $gh api "repos/$owner/$repo/pulls?state=open"
    $prs = $prsJson | ConvertFrom-Json
} catch {
    Write-Host "Error fetching PRs: $_" -ForegroundColor Red
    exit 1
}

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
    Write-Host "---------------------------------------------" -ForegroundColor Cyan
    Write-Host "PR #$prNum : $prTitle" -ForegroundColor White
    Write-Host "Branch    : $prBranch" -ForegroundColor Gray
    Write-Host "Created   : $($prCreated.ToString('yyyy-MM-dd HH:mm:ss')) ($([Math]::Round($prAge.TotalHours, 1)) hours ago)" -ForegroundColor Gray

    # Get detailed PR info to check mergeable status
    $prDetailJson = & $gh api "repos/$owner/$repo/pulls/$prNum"
    $prDetail = $prDetailJson | ConvertFrom-Json
    $mergeable = $prDetail.mergeable
    $mergeableState = $prDetail.mergeable_state

    Write-Host "Mergeable : $mergeableState (mergeable=$mergeable)" -ForegroundColor Gray

    # Skip drafts
    if ($prDetail.draft) {
        Write-Host "SKIP: Draft PR" -ForegroundColor Yellow
        $skipped += @{PR=$prNum; Reason="Draft PR"}
        continue
    }

    # Check for conflicts
    if ($mergeable -eq $false -or $mergeableState -eq "dirty") {
        Write-Host "CONFLICT DETECTED!" -ForegroundColor Red

        # Notify Discord
        Write-Host "-> Notifying Discord..." -ForegroundColor Cyan
        if (Test-Path "core/discord_notifier.py") {
            try {
                python core/discord_notifier.py pr_conflict "Scott Summers" $prNum "Merge conflicts detected, attempting rebase" | Out-Null
            } catch {}
        }

        # Get current branch to restore later
        $currentBranch = git branch --show-current

        try {
            Write-Host "-> Fetching latest changes..." -ForegroundColor Cyan
            git fetch origin 2>&1 | Out-Null

            Write-Host "-> Checking out branch: $prBranch" -ForegroundColor Cyan
            git checkout $prBranch 2>&1 | Out-Null

            Write-Host "-> Attempting rebase onto origin/main..." -ForegroundColor Cyan
            $rebaseResult = git rebase origin/main 2>&1

            if ($LASTEXITCODE -ne 0) {
                Write-Host "-> Conflicts during rebase. Attempting resolution..." -ForegroundColor Yellow

                # Get conflicting files
                $conflicts = git diff --name-only --diff-filter=U

                if ($conflicts) {
                    foreach ($file in $conflicts) {
                        Write-Host "  -> Resolving: $file" -ForegroundColor Magenta
                        git add $file 2>&1 | Out-Null
                    }

                    # Continue rebase
                    git rebase --continue 2>&1 | Out-Null

                    if ($LASTEXITCODE -ne 0) {
                        Write-Host "FAILED: Complex conflicts" -ForegroundColor Red
                        git rebase --abort 2>&1 | Out-Null
                        git checkout $currentBranch 2>&1 | Out-Null
                        $skipped += @{PR=$prNum; Reason="Complex conflicts"}
                        continue
                    }
                }
            }

            Write-Host "-> Pushing rebased branch..." -ForegroundColor Cyan
            git push --force-with-lease origin $prBranch 2>&1 | Out-Null

            if ($LASTEXITCODE -eq 0) {
                Write-Host "SUCCESS: Conflicts resolved!" -ForegroundColor Green

                # Notify Discord
                if (Test-Path "core/discord_notifier.py") {
                    try {
                        python core/discord_notifier.py pr_fixed "Scott Summers" $prNum "Conflicts resolved via rebase" | Out-Null
                    } catch {}
                }

                $fixed += $prNum
            } else {
                Write-Host "FAILED: Push failed" -ForegroundColor Red
                $skipped += @{PR=$prNum; Reason="Push failed"}
            }
        } catch {
            Write-Host "ERROR: $_" -ForegroundColor Red
            $skipped += @{PR=$prNum; Reason="Exception: $_"}
        } finally {
            # Return to original branch
            git checkout $currentBranch 2>&1 | Out-Null
        }

    } elseif ($mergeable -eq $null -or $mergeableState -eq "unknown") {
        Write-Host "SKIP: Status unknown (CI pending)" -ForegroundColor Yellow
        $skipped += @{PR=$prNum; Reason="CI pending"}

    } else {
        Write-Host "MERGEABLE: No conflicts" -ForegroundColor Green

        # Check for staleness (>24 hours)
        if ($prAge.TotalHours -gt 24) {
            Write-Host "-> Checking for activity..." -ForegroundColor Cyan

            $commitsJson = & $gh api "repos/$owner/$repo/pulls/$prNum/commits"
            $commitsData = $commitsJson | ConvertFrom-Json

            $commentsJson = & $gh api "repos/$owner/$repo/issues/$prNum/comments"
            $commentsData = $commentsJson | ConvertFrom-Json

            $hasActivity = $false

            if ($commitsData.Count -gt 0) {
                $lastCommit = [DateTime]::Parse($commitsData[-1].commit.committer.date)
                if ((Get-Date) - $lastCommit -lt [TimeSpan]::FromHours(24)) {
                    $hasActivity = $true
                }
            }

            if ($commentsData.Count -gt 0) {
                $lastComment = [DateTime]::Parse($commentsData[-1].created_at)
                if ((Get-Date) - $lastComment -lt [TimeSpan]::FromHours(24)) {
                    $hasActivity = $true
                }
            }

            if (-not $hasActivity) {
                Write-Host "STALE: Closing PR..." -ForegroundColor Yellow

                & $gh pr comment $prNum --body "PR is stale. Closing due to inactivity. Please recreate if still needed."
                & $gh pr close $prNum

                if ($LASTEXITCODE -eq 0) {
                    Write-Host "SUCCESS: Stale PR closed" -ForegroundColor Green

                    if (Test-Path "core/discord_notifier.py") {
                        try {
                            python core/discord_notifier.py pr_closed "Scott Summers" $prNum "Stale PR closed" | Out-Null
                        } catch {}
                    }

                    $closed += $prNum
                } else {
                    Write-Host "FAILED: Could not close PR" -ForegroundColor Red
                    $skipped += @{PR=$prNum; Reason="Failed to close"}
                }
            } else {
                Write-Host "Has recent activity" -ForegroundColor Green
                $skipped += @{PR=$prNum; Reason="Active, awaiting review"}
            }
        } else {
            Write-Host "Fresh PR" -ForegroundColor Green
            $skipped += @{PR=$prNum; Reason="Fresh, awaiting review"}
        }
    }
}

# Step 3: Cleanup
Write-Host ""
Write-Host "[3/4] Cleanup..." -ForegroundColor Yellow
$currentBranchFinal = git branch --show-current
if ($currentBranchFinal -ne "main") {
    git checkout main 2>&1 | Out-Null
}
$pullOutput = git pull origin main 2>&1
Write-Host "Returned to main branch" -ForegroundColor Green

# Step 4: Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TACTICAL SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Fixed PRs: " -NoNewline -ForegroundColor Green
if ($fixed.Count -gt 0) {
    Write-Host ($fixed -join ", ")
} else {
    Write-Host "None" -ForegroundColor Gray
}

Write-Host "Closed PRs: " -NoNewline -ForegroundColor Yellow
if ($closed.Count -gt 0) {
    Write-Host ($closed -join ", ")
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
Write-Host "Cyclops out." -ForegroundColor Cyan
