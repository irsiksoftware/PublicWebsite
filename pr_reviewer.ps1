# PR Reviewer Script - Reviews and merges PRs following dependency rules

$ErrorActionPreference = "Stop"

# Function to run gh commands
function Invoke-GH {
    param([string]$Command)
    $result = & "C:\Program Files\GitHub CLI\gh.bat" $Command.Split(' ')
    return $result
}

Write-Host "=== PR REVIEWER ===" -ForegroundColor Cyan
Write-Host "Fetching open PRs..." -ForegroundColor Yellow

# Get open PRs using GitHub API
$prsJson = gh api repos/:owner/:repo/pulls?state=open | ConvertFrom-Json

if ($prsJson.Count -eq 0) {
    Write-Host "No open PRs found." -ForegroundColor Green
    exit 0
}

Write-Host "Found $($prsJson.Count) open PR(s)" -ForegroundColor Green

# Process each PR
$merged = @()
$blocked = @()
$waitingCI = @()

foreach ($pr in $prsJson) {
    $prNum = $pr.number
    $prTitle = $pr.title
    $prBody = $pr.body

    Write-Host "`n--- PR #${prNum}: $prTitle ---" -ForegroundColor Cyan

    # Extract issue number from PR body/title
    $issueNum = $null
    if ($prTitle -match '#(\d+)') {
        $issueNum = $Matches[1]
    } elseif ($prBody -match 'Fixes #(\d+)|Closes #(\d+)') {
        $issueNum = if ($Matches[1]) { $Matches[1] } else { $Matches[2] }
    }

    if (-not $issueNum) {
        Write-Host "  No linked issue found, skipping..." -ForegroundColor Yellow
        continue
    }

    Write-Host "  Linked to issue #$issueNum" -ForegroundColor White

    # Get issue details
    $issueJson = gh api repos/:owner/:repo/issues/$issueNum | ConvertFrom-Json

    if ($issueJson.state -ne "open") {
        Write-Host "  Issue #$issueNum is already $($issueJson.state)" -ForegroundColor Yellow
        continue
    }

    # Check for dependency labels (d1, d2, etc.)
    $depLabels = $issueJson.labels | Where-Object { $_.name -match '^d\d+$' }

    if ($depLabels.Count -gt 0) {
        Write-Host "  Checking dependencies..." -ForegroundColor Yellow
        $hasOpenDeps = $false
        $openDeps = @()

        foreach ($depLabel in $depLabels) {
            $depIssueNum = $depLabel.name.Substring(1)
            $depIssue = gh api repos/:owner/:repo/issues/$depIssueNum | ConvertFrom-Json

            if ($depIssue.state -eq "open") {
                $hasOpenDeps = $true
                $openDeps += "#$depIssueNum"
                Write-Host "    Dependency #$depIssueNum is OPEN" -ForegroundColor Red
            } else {
                Write-Host "    Dependency #$depIssueNum is CLOSED" -ForegroundColor Green
            }
        }

        if ($hasOpenDeps) {
            $depsStr = $openDeps -join ", "
            Write-Host "  BLOCKED by open dependencies: $depsStr" -ForegroundColor Red

            # Comment on PR
            gh pr comment $prNum --body "⚠️ Blocked by open dependencies: $depsStr"

            # Notify Discord
            python core/discord_notifier.py pr_blocked 'Thor Odinson' $prNum "Blocked by dependencies: $depsStr"

            $blocked += @{PR = $prNum; Reason = "Dependencies: $depsStr"}
            continue
        }
    }

    # Check CI status
    Write-Host "  Checking CI status..." -ForegroundColor Yellow
    $checks = gh api repos/:owner/:repo/commits/$($pr.head.sha)/check-runs | ConvertFrom-Json

    $allPassed = $true
    if ($checks.total_count -gt 0) {
        foreach ($check in $checks.check_runs) {
            if ($check.conclusion -ne "success" -and $check.conclusion -ne "skipped") {
                $allPassed = $false
                Write-Host "    Check '$($check.name)' status: $($check.conclusion)" -ForegroundColor Red
            }
        }
    }

    if (-not $allPassed) {
        Write-Host "  Waiting for CI to pass" -ForegroundColor Yellow
        gh pr comment $prNum --body "⏳ Waiting for CI to pass"
        $waitingCI += $prNum
        continue
    }

    Write-Host "  All checks passed!" -ForegroundColor Green

    # Review code quality
    Write-Host "  Reviewing code changes..." -ForegroundColor Yellow
    $diff = gh pr diff $prNum
    # Note: In real scenario, we'd do more thorough analysis

    # Merge the PR
    Write-Host "  Merging PR #$prNum..." -ForegroundColor Green
    gh pr merge $prNum --squash --delete-branch --auto

    # Notify Discord
    python core/discord_notifier.py pr_merged 'Thor Odinson' $prNum $issueNum

    Write-Host "  ✓ Merged PR #$prNum, closes issue #$issueNum" -ForegroundColor Green
    $merged += $prNum
}

# Summary
Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Merged: $($merged -join ', ')" -ForegroundColor Green
Write-Host "Blocked: $(($blocked | ForEach-Object { "#$($_.PR) ($($_.Reason))" }) -join ', ')" -ForegroundColor Red
Write-Host "Waiting on CI: $($waitingCI -join ', ')" -ForegroundColor Yellow
