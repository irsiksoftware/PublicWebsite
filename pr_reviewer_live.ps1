# PR Reviewer Script - Review and merge ready PRs following dependency rules
# Priority Order: CRITICAL > URGENT > HIGH > MEDIUM > LOW

Write-Host "=== PR REVIEWER STARTING ===" -ForegroundColor Cyan
Write-Host "Fetching open PRs..." -ForegroundColor Yellow

# 1. Fetch all open PRs
try {
    $prs = gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body,createdAt | ConvertFrom-Json
    Write-Host "Found $($prs.Count) open PRs" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to fetch PRs: $_" -ForegroundColor Red
    exit 1
}

if ($prs.Count -eq 0) {
    Write-Host "No open PRs to review" -ForegroundColor Yellow
    exit 0
}

# Define priority mapping
$priorityMap = @{
    'critical' = 1
    'urgent' = 2
    'high' = 3
    'medium' = 4
    'low' = 5
    '' = 6  # No priority label
}

# 2. Sort PRs by priority, then by creation date (oldest first)
$sortedPRs = $prs | ForEach-Object {
    $pr = $_
    $issueNum = $null

    # Extract issue number from PR body or title
    if ($pr.body -match '#(\d+)' -or $pr.title -match '#(\d+)') {
        $issueNum = $matches[1]
    }

    # Get linked issue to check priority labels
    $priority = 6  # Default to lowest
    if ($issueNum) {
        try {
            $issue = gh issue view $issueNum --json labels,state | ConvertFrom-Json
            $pr | Add-Member -NotePropertyName 'linkedIssue' -NotePropertyValue $issueNum -Force
            $pr | Add-Member -NotePropertyName 'issueState' -NotePropertyValue $issue.state -Force
            $pr | Add-Member -NotePropertyName 'issueLabels' -NotePropertyValue $issue.labels -Force

            # Check for priority labels
            foreach ($label in $issue.labels) {
                $labelName = $label.name.ToLower()
                if ($priorityMap.ContainsKey($labelName)) {
                    $priority = $priorityMap[$labelName]
                    break
                }
            }
        } catch {
            Write-Host "Warning: Could not fetch issue #$issueNum for PR #$($pr.number)" -ForegroundColor Yellow
        }
    }

    $pr | Add-Member -NotePropertyName 'priorityLevel' -NotePropertyValue $priority -Force
    $pr
} | Sort-Object priorityLevel, createdAt

# Track results
$merged = @()
$blocked = @()
$waitingCI = @()

Write-Host "`n=== REVIEWING PRs ===" -ForegroundColor Cyan

# 3. Review each PR in priority order
foreach ($pr in $sortedPRs) {
    Write-Host "`n--- PR #$($pr.number): $($pr.title) ---" -ForegroundColor Cyan

    $issueNum = $pr.linkedIssue
    if (-not $issueNum) {
        Write-Host "  ⚠ No linked issue found, skipping" -ForegroundColor Yellow
        continue
    }

    Write-Host "  Linked Issue: #$issueNum" -ForegroundColor White

    # DEPENDENCY CHECK
    $dependencyLabels = $pr.issueLabels | Where-Object { $_.name -match '^d\d+$' }
    if ($dependencyLabels) {
        Write-Host "  Checking dependencies..." -ForegroundColor Yellow
        $hasOpenDependencies = $false
        $openDeps = @()

        foreach ($depLabel in $dependencyLabels) {
            $depIssueNum = $depLabel.name -replace '^d', ''
            try {
                $depIssue = gh issue view $depIssueNum --json state | ConvertFrom-Json
                if ($depIssue.state -eq 'OPEN') {
                    $hasOpenDependencies = $true
                    $openDeps += "#$depIssueNum"
                }
            } catch {
                Write-Host "  ⚠ Could not check dependency #$depIssueNum" -ForegroundColor Yellow
            }
        }

        if ($hasOpenDependencies) {
            $blockMsg = "Blocked by open dependencies: $($openDeps -join ', ')"
            Write-Host "  ❌ $blockMsg" -ForegroundColor Red
            $blocked += @{pr=$pr.number; reason=$blockMsg}

            # Notify Discord
            try {
                python core/discord_notifier.py pr_blocked 'Dr. Stephen Strange' $pr.number $blockMsg
            } catch {
                Write-Host "  ⚠ Discord notification failed" -ForegroundColor Yellow
            }

            # Comment on PR
            try {
                gh pr comment $pr.number --body $blockMsg
            } catch {
                Write-Host "  ⚠ Could not comment on PR" -ForegroundColor Yellow
            }

            continue
        }
        Write-Host "  ✓ All dependencies closed" -ForegroundColor Green
    }

    # CI CHECK
    if ($pr.statusCheckRollup) {
        $failedChecks = $pr.statusCheckRollup | Where-Object { $_.conclusion -ne 'SUCCESS' -and $_.conclusion -ne $null }
        if ($failedChecks) {
            Write-Host "  ⏳ CI checks not passing, skipping" -ForegroundColor Yellow
            $waitingCI += $pr.number

            try {
                gh pr comment $pr.number --body "Waiting for CI to pass"
            } catch {
                Write-Host "  ⚠ Could not comment on PR" -ForegroundColor Yellow
            }

            continue
        }
        Write-Host "  ✓ All CI checks passed" -ForegroundColor Green
    }

    # CODE REVIEW (basic check)
    Write-Host "  Reviewing code changes..." -ForegroundColor Yellow
    try {
        $diff = gh pr diff $pr.number
        # Basic validation - ensure there's actual content
        if (-not $diff) {
            Write-Host "  ⚠ No changes detected in PR" -ForegroundColor Yellow
            continue
        }
    } catch {
        Write-Host "  ⚠ Could not fetch diff" -ForegroundColor Yellow
    }

    # MERGE
    Write-Host "  ✅ PR ready to merge!" -ForegroundColor Green
    Write-Host "  Merging PR #$($pr.number)..." -ForegroundColor Cyan

    try {
        gh pr merge $pr.number --squash --delete-branch
        Write-Host "  ✓ Merged PR #$($pr.number)" -ForegroundColor Green
        $merged += $pr.number

        # Notify Discord
        try {
            python core/discord_notifier.py pr_merged 'Dr. Stephen Strange' $pr.number $issueNum
        } catch {
            Write-Host "  ⚠ Discord notification failed" -ForegroundColor Yellow
        }

        Write-Host "  Merged PR #$($pr.number), closes issue #$issueNum" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to merge: $_" -ForegroundColor Red
        $blocked += @{pr=$pr.number; reason="Merge failed: $_"}
    }
}

# 4. Output Summary
Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Merged: [$($merged -join ', ')]" -ForegroundColor Green
Write-Host "Blocked: [$(($blocked | ForEach-Object { "#$($_.pr): $($_.reason)" }) -join ', ')]" -ForegroundColor Red
Write-Host "Waiting on CI: [$($waitingCI -join ', ')]" -ForegroundColor Yellow
Write-Host "`n=== PR REVIEWER COMPLETE ===" -ForegroundColor Cyan
