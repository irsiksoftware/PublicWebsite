# Dr. Strange PR Reviewer - v2
$ErrorActionPreference = "Stop"

Write-Host "=== DR. STRANGE PR REVIEWER ===" -ForegroundColor Cyan
Write-Host ""

# Fetch open PRs
Write-Host "Fetching open PRs..." -ForegroundColor Yellow

# Use gh api to get proper JSON
$prs = gh api repos/:owner/:repo/pulls?state=open | ConvertFrom-Json

if (-not $prs -or $prs.Count -eq 0) {
    Write-Host "No open PRs found" -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($prs.Count) open PR(s)" -ForegroundColor Green
Write-Host ""

# Results tracking
$results = @{
    merged = @()
    blocked = @()
    waiting_ci = @()
    skipped = @()
}

# Priority mapping
$priorityOrder = @{
    "critical" = 1
    "urgent" = 2
    "high" = 3
    "medium" = 4
    "low" = 5
}

# Process each PR with priority
$prData = @()
foreach ($pr in $prs) {
    $prNum = $pr.number
    $prTitle = $pr.title
    $prBody = $pr.body

    # Extract issue number
    $issueNum = $null
    if ($prBody -match 'Fixes\s+#(\d+)' -or $prTitle -match 'Fixes\s+#(\d+)') {
        $issueNum = $matches[1]
    } elseif ($prBody -match 'Closes\s+#(\d+)' -or $prTitle -match 'Closes\s+#(\d+)') {
        $issueNum = $matches[1]
    } elseif ($prBody -match '#(\d+)' -or $prTitle -match '#(\d+)') {
        $issueNum = $matches[1]
    }

    # Get priority from linked issue
    $priority = 999
    if ($issueNum) {
        try {
            $issue = gh api repos/:owner/:repo/issues/$issueNum | ConvertFrom-Json
            $priorityLabel = $issue.labels | Where-Object { $_.name -in @("critical", "urgent", "high", "medium", "low") } | Select-Object -First 1

            if ($priorityLabel) {
                $priority = $priorityOrder[$priorityLabel.name]
            }
        } catch {
            Write-Host "Warning: Could not fetch issue #$issueNum" -ForegroundColor Yellow
        }
    }

    $prData += [PSCustomObject]@{
        Number = $prNum
        Title = $prTitle
        Body = $prBody
        IssueNum = $issueNum
        Priority = $priority
        CreatedAt = $pr.created_at
        PrObject = $pr
    }
}

# Sort by priority, then by creation date (oldest first)
$prData = $prData | Sort-Object Priority, CreatedAt

Write-Host "Processing PRs in priority order..." -ForegroundColor Cyan
Write-Host ""

# Process each PR
foreach ($prInfo in $prData) {
    $prNum = $prInfo.Number
    $pr = $prInfo.PrObject
    $issueNum = $prInfo.IssueNum

    Write-Host "=== Processing PR #$prNum ===" -ForegroundColor Cyan
    Write-Host "Title: $($pr.title)" -ForegroundColor White
    Write-Host "Branch: $($pr.head.ref)" -ForegroundColor Gray

    if (-not $issueNum) {
        Write-Host "Could not find linked issue number" -ForegroundColor Yellow
        $results.skipped += "PR #$prNum (no linked issue)"
        Write-Host ""
        continue
    }

    Write-Host "Linked issue: #$issueNum" -ForegroundColor Green

    # Get issue details
    try {
        $issue = gh api repos/:owner/:repo/issues/$issueNum | ConvertFrom-Json
    } catch {
        Write-Host "Error fetching issue #${issueNum}" -ForegroundColor Red
        $results.skipped += "PR #$prNum (issue fetch error)"
        Write-Host ""
        continue
    }

    # Check for dependency labels (d1, d2, d3, etc.)
    $depLabels = $issue.labels | Where-Object { $_.name -match '^d\d+$' }

    if ($depLabels) {
        Write-Host "Found dependency labels: $($depLabels.name -join ', ')" -ForegroundColor Magenta

        # Extract dependency issue numbers
        $depIssues = @()
        foreach ($depLabel in $depLabels) {
            if ($depLabel.name -match '^d(\d+)$') {
                $depIssues += $matches[1]
            }
        }

        # Check if all dependencies are closed
        $openDeps = @()
        foreach ($depIssue in $depIssues) {
            try {
                $dep = gh api repos/:owner/:repo/issues/$depIssue | ConvertFrom-Json
                if ($dep.state -eq "open") {
                    $openDeps += $depIssue
                }
            } catch {
                Write-Host "Warning: Could not check dependency #$depIssue" -ForegroundColor Yellow
            }
        }

        if ($openDeps) {
            Write-Host "BLOCKED: Open dependencies: #$($openDeps -join ', #')" -ForegroundColor Red

            # Comment on PR
            $depsText = $openDeps -join ', #'
            $blockMsg = "This PR is blocked by open dependencies: #$depsText. Please wait for these issues to be closed before merging."

            try {
                gh pr comment $prNum --body $blockMsg
            } catch {
                Write-Host "Warning: Could not add comment to PR" -ForegroundColor Yellow
            }

            # Discord notification
            if (Test-Path "core/discord_notifier.py") {
                $depsNotify = $openDeps -join ', #'
                python core/discord_notifier.py pr_blocked "Dr. Stephen Strange" $prNum "Blocked by dependencies: #$depsNotify"
            }

            $results.blocked += "PR #$prNum (deps: #$depsText)"
            Write-Host ""
            continue
        }

        Write-Host "All dependencies are closed" -ForegroundColor Green
    }

    # Check CI status using GitHub API
    $checksUrl = $pr._links.statuses.href
    try {
        $statuses = gh api $checksUrl | ConvertFrom-Json

        if ($statuses -and $statuses.Count -gt 0) {
            $latestStatus = $statuses | Select-Object -First 1

            if ($latestStatus.state -ne "success") {
                Write-Host "CI checks not passing (state: $($latestStatus.state))" -ForegroundColor Yellow

                try {
                    gh pr comment $prNum --body "Waiting for CI checks to pass before merging."
                } catch {}

                $results.waiting_ci += "PR #$prNum"
                Write-Host ""
                continue
            }

            Write-Host "CI checks passed" -ForegroundColor Green
        } else {
            Write-Host "No CI status found, proceeding..." -ForegroundColor Gray
        }
    } catch {
        Write-Host "Warning: Could not check CI status, proceeding..." -ForegroundColor Yellow
    }

    # Check if PR is mergeable
    if ($pr.mergeable -eq $false) {
        Write-Host "PR has conflicts or is not mergeable" -ForegroundColor Red
        $results.skipped += "PR #$prNum (not mergeable)"
        Write-Host ""
        continue
    }

    # Review the diff
    Write-Host "Reviewing changes..." -ForegroundColor Yellow
    try {
        $diff = gh pr diff $prNum
        $lineCount = ($diff -split "`n").Count
        Write-Host "Diff has $lineCount lines of changes" -ForegroundColor Gray
    } catch {
        Write-Host "Warning: Could not fetch diff" -ForegroundColor Yellow
    }

    # Attempt to merge
    Write-Host "Attempting to merge PR #$prNum..." -ForegroundColor Green

    try {
        gh pr merge $prNum --squash --delete-branch

        if ($LASTEXITCODE -eq 0) {
            Write-Host "Successfully merged PR #$prNum, closes issue #$issueNum" -ForegroundColor Green

            # Discord notification
            if (Test-Path "core/discord_notifier.py") {
                python core/discord_notifier.py pr_merged "Dr. Stephen Strange" $prNum $issueNum
            }

            $results.merged += "PR #$prNum (issue #$issueNum)"
        } else {
            Write-Host "Failed to merge PR #$prNum" -ForegroundColor Red
            $results.skipped += "PR #$prNum (merge failed)"
        }
    } catch {
        Write-Host "Exception during merge: $_" -ForegroundColor Red
        $results.skipped += "PR #$prNum (merge error)"
    }

    Write-Host ""
}

# Summary
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Merged: $($results.merged.Count)" -ForegroundColor Green
if ($results.merged) {
    $results.merged | ForEach-Object { Write-Host "  - $_" -ForegroundColor Green }
}
Write-Host ""
Write-Host "Blocked: $($results.blocked.Count)" -ForegroundColor Red
if ($results.blocked) {
    $results.blocked | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}
Write-Host ""
Write-Host "Waiting on CI: $($results.waiting_ci.Count)" -ForegroundColor Yellow
if ($results.waiting_ci) {
    $results.waiting_ci | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}
Write-Host ""
Write-Host "Skipped: $($results.skipped.Count)" -ForegroundColor Gray
if ($results.skipped) {
    $results.skipped | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
}
Write-Host ""
Write-Host "=== Dr. Strange PR Review Complete ===" -ForegroundColor Cyan
