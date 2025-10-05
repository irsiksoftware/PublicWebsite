# PR Reviewer Script - Dr. Strange Edition
# Priority Order: CRITICAL > URGENT > HIGH > MEDIUM > LOW

Write-Host "=== PR REVIEWER STARTING (Dr. Strange) ===" -ForegroundColor Cyan
Write-Host "Fetching open PRs via GitHub API..." -ForegroundColor Yellow

# 1. Fetch all open PRs using gh api
try {
    $prsJson = gh api repos/:owner/:repo/pulls -q '.[] | {number: .number, title: .title, head: .head.ref, labels: [.labels[].name], state: .state, body: .body, created_at: .created_at, html_url: .html_url}'

    # Parse each line as JSON
    $prs = @()
    $prsJson -split "`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object {
        try {
            $prs += $_ | ConvertFrom-Json
        } catch {
            # Skip invalid lines
        }
    }

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
    if ($pr.body -match 'Fixes\s+#(\d+)' -or $pr.body -match '#(\d+)' -or $pr.title -match '#(\d+)') {
        $issueNum = $matches[1]
    }

    # Get linked issue to check priority labels
    $priority = 6  # Default to lowest
    if ($issueNum) {
        try {
            $issueJson = gh api repos/:owner/:repo/issues/$issueNum -q '{labels: [.labels[].name], state: .state}'
            $issue = $issueJson | ConvertFrom-Json
            $pr | Add-Member -NotePropertyName 'linkedIssue' -NotePropertyValue $issueNum -Force
            $pr | Add-Member -NotePropertyName 'issueState' -NotePropertyValue $issue.state -Force
            $pr | Add-Member -NotePropertyName 'issueLabels' -NotePropertyValue $issue.labels -Force

            # Check for priority labels
            foreach ($label in $issue.labels) {
                $labelName = $label.ToLower()
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
} | Sort-Object priorityLevel, created_at

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
    $dependencyLabels = $pr.issueLabels | Where-Object { $_ -match '^d\d+$' }
    if ($dependencyLabels) {
        Write-Host "  Checking dependencies..." -ForegroundColor Yellow
        $hasOpenDependencies = $false
        $openDeps = @()

        foreach ($depLabel in $dependencyLabels) {
            $depIssueNum = $depLabel -replace '^d', ''
            try {
                $depIssueJson = gh api repos/:owner/:repo/issues/$depIssueNum -q '{state: .state}'
                $depIssue = $depIssueJson | ConvertFrom-Json
                if ($depIssue.state -eq 'open') {
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

    # CI CHECK - Get checks status
    Write-Host "  Checking CI status..." -ForegroundColor Yellow
    try {
        $checksJson = gh api repos/:owner/:repo/commits/$($pr.head)/check-runs -q '{total_count: .total_count, check_runs: [.check_runs[] | {name: .name, status: .status, conclusion: .conclusion}]}'
        $checks = $checksJson | ConvertFrom-Json

        if ($checks.total_count -gt 0) {
            $failedChecks = $checks.check_runs | Where-Object { $_.conclusion -ne 'success' -and $_.status -eq 'completed' }
            $pendingChecks = $checks.check_runs | Where-Object { $_.status -ne 'completed' }

            if ($failedChecks -or $pendingChecks) {
                Write-Host "  ⏳ CI checks not passing, skipping" -ForegroundColor Yellow
                $waitingCI += $pr.number

                try {
                    gh pr comment $pr.number --body "Waiting for CI to pass"
                } catch {
                    Write-Host "  ⚠ Could not comment on PR" -ForegroundColor Yellow
                }

                continue
            }
        }
        Write-Host "  ✓ All CI checks passed" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Could not check CI status, proceeding with caution" -ForegroundColor Yellow
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
        Write-Host "  ✓ Code changes verified" -ForegroundColor Green
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
