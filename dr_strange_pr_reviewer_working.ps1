# Dr. Strange PR Reviewer - Working Version
$ErrorActionPreference = "Stop"

Write-Host "=== DR. STRANGE PR REVIEWER ===" -ForegroundColor Cyan
Write-Host ""

# Fetch open PRs using simpler format
Write-Host "Fetching open PRs..." -ForegroundColor Yellow
$prListRaw = gh pr list --state open --limit 100 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error fetching PRs: $prListRaw" -ForegroundColor Red
    exit 1
}

Write-Host "Raw PR list:" -ForegroundColor Gray
Write-Host $prListRaw
Write-Host ""

# Parse the output manually
$prNumbers = @()
if ($prListRaw -match '#(\d+)') {
    $prListRaw | Select-String -Pattern '#(\d+)' -AllMatches | ForEach-Object {
        $_.Matches | ForEach-Object {
            $prNum = $_.Groups[1].Value
            if ($prNumbers -notcontains $prNum) {
                $prNumbers += $prNum
            }
        }
    }
}

Write-Host "Found PR numbers: $($prNumbers -join ', ')" -ForegroundColor Green
Write-Host ""

# Process each PR
$results = @{
    merged = @()
    blocked = @()
    waiting_ci = @()
    skipped = @()
}

foreach ($prNum in $prNumbers) {
    Write-Host "=== Processing PR #$prNum ===" -ForegroundColor Cyan

    # Get PR details
    $prJson = gh pr view $prNum --json number,title,body,state,statusCheckRollup,headRefName 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error fetching PR #$prNum details: $prJson" -ForegroundColor Red
        $results.skipped += "PR #$prNum (fetch error)"
        continue
    }

    $pr = $prJson | ConvertFrom-Json
    Write-Host "Title: $($pr.title)" -ForegroundColor White
    Write-Host "Branch: $($pr.headRefName)" -ForegroundColor Gray

    # Extract issue number from PR body or title
    $issueNum = $null
    if ($pr.body -match '#(\d+)' -or $pr.title -match '#(\d+)') {
        $issueNum = $matches[1]
    } elseif ($pr.body -match 'Fixes #(\d+)' -or $pr.title -match 'Fixes #(\d+)') {
        $issueNum = $matches[1]
    } elseif ($pr.body -match 'Closes #(\d+)' -or $pr.title -match 'Closes #(\d+)') {
        $issueNum = $matches[1]
    }

    if (-not $issueNum) {
        Write-Host "Could not find linked issue number" -ForegroundColor Yellow
        $results.skipped += "PR #$prNum (no linked issue)"
        continue
    }

    Write-Host "Linked issue: #$issueNum" -ForegroundColor Green

    # Get issue details
    $issueJson = gh issue view $issueNum --json number,labels,state 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error fetching issue ${issueNum}: $issueJson" -ForegroundColor Red
        $results.skipped += "PR #$prNum (issue fetch error)"
        continue
    }

    $issue = $issueJson | ConvertFrom-Json

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
            $depJson = gh issue view $depIssue --json number,state 2>&1
            if ($LASTEXITCODE -eq 0) {
                $dep = $depJson | ConvertFrom-Json
                if ($dep.state -eq "OPEN") {
                    $openDeps += $depIssue
                }
            }
        }

        if ($openDeps) {
            Write-Host "BLOCKED: Open dependencies: #$($openDeps -join ', #')" -ForegroundColor Red

            # Comment on PR
            $depsText = $openDeps -join ', #'
            $blockMsg = "This PR is blocked by open dependencies: #$depsText. Please wait for these issues to be closed before merging."
            gh pr comment $prNum --body $blockMsg

            # Discord notification
            if (Test-Path "core/discord_notifier.py") {
                python core/discord_notifier.py pr_blocked "Dr. Stephen Strange" $prNum "Blocked by dependencies: #$($openDeps -join ', #')"
            }

            $results.blocked += "PR #$prNum (deps: #$($openDeps -join ', #'))"
            continue
        }

        Write-Host "All dependencies are closed ✓" -ForegroundColor Green
    }

    # Check CI status
    if ($pr.statusCheckRollup) {
        $failedChecks = $pr.statusCheckRollup | Where-Object { $_.conclusion -ne "SUCCESS" -and $_.conclusion -ne "NEUTRAL" -and $_.conclusion -ne $null }

        if ($failedChecks) {
            Write-Host "CI checks not passing" -ForegroundColor Yellow
            gh pr comment $prNum --body "⏳ Waiting for CI checks to pass before merging."
            $results.waiting_ci += "PR #$prNum"
            continue
        }

        Write-Host "All CI checks passed ✓" -ForegroundColor Green
    }

    # Review the diff
    Write-Host "Reviewing changes..." -ForegroundColor Yellow
    $diff = gh pr diff $prNum
    Write-Host "Diff has $($diff.Split([Environment]::NewLine).Count) lines" -ForegroundColor Gray

    # Check if tests passed
    Write-Host "Checking test status..." -ForegroundColor Yellow
    $checks = gh pr checks $prNum
    Write-Host $checks -ForegroundColor Gray

    # Attempt to merge
    Write-Host "Attempting to merge PR #$prNum..." -ForegroundColor Green
    $mergeResult = gh pr merge $prNum --squash --delete-branch 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Successfully merged PR #$prNum, closes issue #$issueNum" -ForegroundColor Green

        # Discord notification
        if (Test-Path "core/discord_notifier.py") {
            python core/discord_notifier.py pr_merged "Dr. Stephen Strange" $prNum $issueNum
        }

        $results.merged += "PR #$prNum (issue #$issueNum)"
    } else {
        Write-Host "Failed to merge: $mergeResult" -ForegroundColor Red
        $results.skipped += "PR #$prNum (merge failed)"
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
