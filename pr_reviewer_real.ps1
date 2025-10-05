# PR Reviewer - Reviews and merges ready PRs following dependency rules
# Priority order: CRITICAL > URGENT > HIGH > MEDIUM > LOW

Write-Host "=== PR REVIEWER STARTING ===" -ForegroundColor Cyan

# Step 1: Fetch all open PRs
Write-Host "`n[1/5] Fetching open PRs..." -ForegroundColor Yellow
$prsJson = gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body,createdAt
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to fetch PRs" -ForegroundColor Red
    exit 1
}

$prs = $prsJson | ConvertFrom-Json
Write-Host "Found $($prs.Count) open PR(s)" -ForegroundColor Green

if ($prs.Count -eq 0) {
    Write-Host "`nNo open PRs to review." -ForegroundColor Yellow
    exit 0
}

# Step 2: Sort PRs by priority
Write-Host "`n[2/5] Sorting PRs by priority and age..." -ForegroundColor Yellow

$priorityMap = @{
    'critical' = 1
    'urgent' = 2
    'high' = 3
    'medium' = 4
    'low' = 5
}

# Enrich PRs with priority and issue number
$enrichedPrs = foreach ($pr in $prs) {
    # Extract issue number from PR body or title
    $issueNum = $null
    if ($pr.body -match '#(\d+)' -or $pr.title -match '#(\d+)') {
        $issueNum = [int]$matches[1]
    }

    # Determine priority from labels
    $priority = 999  # Default to lowest
    foreach ($label in $pr.labels) {
        $labelName = $label.name.ToLower()
        foreach ($key in $priorityMap.Keys) {
            if ($labelName -like "*$key*") {
                if ($priorityMap[$key] -lt $priority) {
                    $priority = $priorityMap[$key]
                }
            }
        }
    }

    [PSCustomObject]@{
        Number = $pr.number
        Title = $pr.title
        HeadRefName = $pr.headRefName
        Labels = $pr.labels
        StatusCheckRollup = $pr.statusCheckRollup
        Body = $pr.body
        CreatedAt = [DateTime]$pr.createdAt
        IssueNumber = $issueNum
        Priority = $priority
    }
}

# Sort by priority (ascending), then by creation date (oldest first)
$sortedPrs = $enrichedPrs | Sort-Object Priority, CreatedAt

Write-Host "PRs sorted by priority:" -ForegroundColor Green
foreach ($pr in $sortedPrs) {
    $priorityName = ($priorityMap.GetEnumerator() | Where-Object { $_.Value -eq $pr.Priority }).Name
    if (-not $priorityName) { $priorityName = "NONE" }
    Write-Host "  PR #$($pr.Number): [$($priorityName.ToUpper())] $($pr.Title)" -ForegroundColor Cyan
}

# Step 3: Review each PR
Write-Host "`n[3/5] Reviewing PRs in priority order..." -ForegroundColor Yellow

$merged = @()
$blocked = @()
$waitingCI = @()

foreach ($pr in $sortedPrs) {
    Write-Host "`n--- Reviewing PR #$($pr.Number): $($pr.Title) ---" -ForegroundColor Magenta

    # Check if PR has linked issue
    if (-not $pr.IssueNumber) {
        Write-Host "  WARNING: No linked issue found in PR body/title" -ForegroundColor Yellow
        $blocked += @{PR = $pr.Number; Reason = "No linked issue"}
        continue
    }

    Write-Host "  Linked to issue #$($pr.IssueNumber)" -ForegroundColor Cyan

    # Fetch issue details
    $issueJson = gh issue view $pr.IssueNumber --json labels,state 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Failed to fetch issue #$($pr.IssueNumber)" -ForegroundColor Red
        $blocked += @{PR = $pr.Number; Reason = "Issue fetch failed"}
        continue
    }

    $issue = $issueJson | ConvertFrom-Json

    # Check for dependency labels (d1, d2, etc.)
    $depLabels = $issue.labels | Where-Object { $_.name -match '^d\d+$' }

    if ($depLabels.Count -gt 0) {
        Write-Host "  Found $($depLabels.Count) dependency label(s): $($depLabels.name -join ', ')" -ForegroundColor Cyan

        # Extract dependency issue numbers
        $openDeps = @()
        foreach ($depLabel in $depLabels) {
            $depNum = [int]($depLabel.name -replace 'd', '')

            # Check if dependency issue is closed
            $depIssueJson = gh issue view $depNum --json state 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  WARNING: Could not check dependency issue #$depNum" -ForegroundColor Yellow
                continue
            }

            $depIssue = $depIssueJson | ConvertFrom-Json
            if ($depIssue.state -ne 'CLOSED') {
                $openDeps += $depNum
            }
        }

        if ($openDeps.Count -gt 0) {
            $depList = ($openDeps | ForEach-Object { "#$_" }) -join ', '
            Write-Host "  BLOCKED: Open dependencies: $depList" -ForegroundColor Red

            # Notify Discord
            python core/discord_notifier.py pr_blocked 'Thor Odinson' $pr.Number "Blocked by dependencies: $depList"

            # Comment on PR
            gh pr comment $pr.Number --body "Blocked by open dependencies: $depList"

            $blocked += @{PR = $pr.Number; Reason = "Dependencies: $depList"}
            continue
        }

        Write-Host "  All dependencies are CLOSED" -ForegroundColor Green
    }

    # Check CI status
    if ($pr.StatusCheckRollup) {
        $failedChecks = $pr.StatusCheckRollup | Where-Object { $_.conclusion -ne 'SUCCESS' -and $_.conclusion -ne 'SKIPPED' }

        if ($failedChecks.Count -gt 0) {
            Write-Host "  CI CHECKS FAILING: Waiting for CI to pass" -ForegroundColor Yellow
            gh pr comment $pr.Number --body "Waiting for CI checks to pass."
            $waitingCI += $pr.Number
            continue
        }
    }

    # Verify tests passed
    Write-Host "  Checking PR test status..." -ForegroundColor Cyan
    $checksJson = gh pr checks $pr.Number --json name,conclusion 2>&1
    if ($LASTEXITCODE -eq 0) {
        $checks = $checksJson | ConvertFrom-Json
        $failedTests = $checks | Where-Object { $_.conclusion -ne 'SUCCESS' -and $_.conclusion -ne 'SKIPPED' -and $_.conclusion -ne 'NEUTRAL' }

        if ($failedTests.Count -gt 0) {
            Write-Host "  TESTS FAILING: $($failedTests.Count) check(s) failed" -ForegroundColor Red
            $waitingCI += $pr.Number
            continue
        }
    }

    # All checks passed - MERGE
    Write-Host "  All checks PASSED - Proceeding to merge" -ForegroundColor Green

    # Merge PR
    Write-Host "  Merging PR #$($pr.Number)..." -ForegroundColor Cyan
    gh pr merge $pr.Number --squash --delete-branch

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Successfully merged PR #$($pr.Number)" -ForegroundColor Green

        # Notify Discord
        python core/discord_notifier.py pr_merged 'Thor Odinson' $pr.Number $pr.IssueNumber

        Write-Host "  Merged PR #$($pr.Number), closes issue #$($pr.IssueNumber)" -ForegroundColor Green
        $merged += $pr.Number
    } else {
        Write-Host "  ERROR: Failed to merge PR #$($pr.Number)" -ForegroundColor Red
        $blocked += @{PR = $pr.Number; Reason = "Merge failed"}
    }
}

# Step 4: Output Summary
Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Merged: $($merged.Count) PR(s)" -ForegroundColor Green
if ($merged.Count -gt 0) {
    Write-Host "  - #$($merged -join ', #')" -ForegroundColor Green
}

Write-Host "Blocked: $($blocked.Count) PR(s)" -ForegroundColor Red
if ($blocked.Count -gt 0) {
    foreach ($b in $blocked) {
        Write-Host "  - PR #$($b.PR): $($b.Reason)" -ForegroundColor Red
    }
}

Write-Host "Waiting on CI: $($waitingCI.Count) PR(s)" -ForegroundColor Yellow
if ($waitingCI.Count -gt 0) {
    Write-Host "  - #$($waitingCI -join ', #')" -ForegroundColor Yellow
}

Write-Host "`n=== PR REVIEWER COMPLETED ===" -ForegroundColor Cyan
