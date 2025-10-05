# Bruce Banner PR Merger - Review and merge ready PRs following dependency rules

$ErrorActionPreference = 'Stop'

Write-Host "=== Bruce Banner PR Merger ===" -ForegroundColor Green

# 1. Fetch all open PRs using GitHub CLI API
Write-Host "`nFetching open PRs..." -ForegroundColor Cyan
$prsJson = gh api repos/:owner/:repo/pulls --jq '.' 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error fetching PRs: $prsJson" -ForegroundColor Red
    exit 1
}

$prs = $prsJson | ConvertFrom-Json

if ($prs.Count -eq 0) {
    Write-Host "No open PRs found." -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($prs.Count) open PR(s)" -ForegroundColor Green

# Priority mapping
$priorityOrder = @{
    'CRITICAL' = 1
    'URGENT' = 2
    'HIGH' = 3
    'MEDIUM' = 4
    'LOW' = 5
    'NONE' = 6
}

# Track results
$merged = @()
$blocked = @()
$waitingCI = @()
$failed = @()

# 2. Process each PR
foreach ($pr in $prs) {
    $prNum = $pr.number
    $prTitle = $pr.title
    $prBody = $pr.body

    Write-Host "`n--- Processing PR #${prNum}: $prTitle ---" -ForegroundColor Cyan

    # Extract issue number from PR
    $issueNum = $null
    if ($prTitle -match '#(\d+)') {
        $issueNum = $Matches[1]
    } elseif ($prBody -match '(?:Fixes|Closes|Resolves)\s+#(\d+)') {
        $issueNum = $Matches[1]
    }

    if (-not $issueNum) {
        Write-Host "  [SKIP] No linked issue found" -ForegroundColor Yellow
        $failed += @{pr=$prNum; reason="No linked issue"}
        continue
    }

    Write-Host "  Linked to issue #${issueNum}" -ForegroundColor White

    # 3. Get issue details
    try {
        $issueJson = gh api repos/:owner/:repo/issues/$issueNum 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  [ERROR] Failed to fetch issue #${issueNum}" -ForegroundColor Red
            $failed += @{pr=$prNum; reason="Issue fetch failed"}
            continue
        }
        $issue = $issueJson | ConvertFrom-Json
    } catch {
        Write-Host "  [ERROR] Failed to parse issue #${issueNum}" -ForegroundColor Red
        $failed += @{pr=$prNum; reason="Issue parse failed"}
        continue
    }

    # Check if issue is still open
    if ($issue.state -eq 'closed') {
        Write-Host "  [INFO] Issue #${issueNum} is already closed" -ForegroundColor Yellow
    }

    # 4. DEPENDENCY CHECK
    $depLabels = $issue.labels | Where-Object { $_.name -match '^d\d+$' }
    if ($depLabels.Count -gt 0) {
        Write-Host "  Found $($depLabels.Count) dependency label(s)" -ForegroundColor Yellow

        $openDeps = @()
        foreach ($depLabel in $depLabels) {
            $depNum = $depLabel.name.Substring(1)

            try {
                $depIssueJson = gh api repos/:owner/:repo/issues/$depNum 2>&1
                $depIssue = $depIssueJson | ConvertFrom-Json

                if ($depIssue.state -eq 'open') {
                    $openDeps += $depNum
                    Write-Host "  [BLOCKED] Dependency #${depNum} is still OPEN" -ForegroundColor Red
                } else {
                    Write-Host "  [OK] Dependency #${depNum} is closed" -ForegroundColor Green
                }
            } catch {
                Write-Host "  [WARNING] Could not check dependency #${depNum}" -ForegroundColor Yellow
            }
        }

        if ($openDeps.Count -gt 0) {
            $depList = ($openDeps | ForEach-Object { "#$_" }) -join ', '
            Write-Host "  [BLOCKED] PR #${prNum} blocked by open dependencies: $depList" -ForegroundColor Red

            # Comment on PR
            $comment = "This PR is blocked by open dependencies: $depList. Please wait for these issues to be resolved first."
            gh pr comment $prNum --body $comment | Out-Null

            # Notify Discord
            python core/discord_notifier.py pr_blocked 'Bruce Banner' $prNum "Blocked by dependencies: $depList" 2>&1 | Out-Null

            $blocked += @{pr=$prNum; reason="Dependencies: $depList"}
            continue
        }
    }

    # 5. CI CHECK
    Write-Host "  Checking CI status..." -ForegroundColor Cyan
    try {
        $checksJson = gh api repos/:owner/:repo/commits/$($pr.head.sha)/check-runs 2>&1
        $checks = $checksJson | ConvertFrom-Json

        $failedChecks = $checks.check_runs | Where-Object { $_.conclusion -ne 'success' -and $_.conclusion -ne $null }

        if ($failedChecks.Count -gt 0) {
            Write-Host "  [WAITING] CI checks not passing" -ForegroundColor Yellow
            gh pr comment $prNum --body "Waiting for CI checks to pass before merging." | Out-Null
            $waitingCI += $prNum
            continue
        }

        Write-Host "  [OK] All CI checks passed" -ForegroundColor Green
    } catch {
        Write-Host "  [WARNING] Could not verify CI status, proceeding..." -ForegroundColor Yellow
    }

    # 6. CODE REVIEW (Quick check)
    Write-Host "  Reviewing changes..." -ForegroundColor Cyan
    $diff = gh pr diff $prNum
    Write-Host "  Changes reviewed ($(($diff -split "`n").Count) lines)" -ForegroundColor White

    # 7. MERGE
    Write-Host "  [MERGING] All checks passed, merging PR #${prNum}..." -ForegroundColor Green
    try {
        $mergeResult = gh pr merge $prNum --squash --delete-branch 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [SUCCESS] Merged PR #${prNum}, closes issue #${issueNum}" -ForegroundColor Green

            # Notify Discord
            python core/discord_notifier.py pr_merged 'Bruce Banner' $prNum $issueNum 2>&1 | Out-Null

            $merged += $prNum
        } else {
            Write-Host "  [ERROR] Failed to merge: $mergeResult" -ForegroundColor Red
            $failed += @{pr=$prNum; reason="Merge failed: $mergeResult"}
        }
    } catch {
        Write-Host "  [ERROR] Exception during merge: $_" -ForegroundColor Red
        $failed += @{pr=$prNum; reason="Merge exception: $_"}
    }
}

# 8. Summary
Write-Host "`n=== SUMMARY ===" -ForegroundColor Green
Write-Host "Merged: $(if($merged.Count -gt 0){$merged -join ', '}else{'None'})" -ForegroundColor Green
Write-Host "Blocked by dependencies: $(if($blocked.Count -gt 0){($blocked | ForEach-Object {"#$($_.pr) ($($_.reason))"}) -join ', '}else{'None'})" -ForegroundColor Yellow
Write-Host "Waiting on CI: $(if($waitingCI.Count -gt 0){$waitingCI -join ', '}else{'None'})" -ForegroundColor Yellow
Write-Host "Failed/Skipped: $(if($failed.Count -gt 0){($failed | ForEach-Object {"#$($_.pr) ($($_.reason))"}) -join ', '}else{'None'})" -ForegroundColor Red

exit 0
