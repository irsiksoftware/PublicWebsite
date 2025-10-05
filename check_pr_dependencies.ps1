# PR Review and Merge Script
$prs = @(
    @{Number=148; Issue=81; Title="Design Avengers roster grid with modern CSS Grid"},
    @{Number=147; Issue=80; Title="Implement sticky header with glassmorphism effect"},
    @{Number=146; Issue=77; Title="Design hero section with CSS Grid and diagonal gradient"}
)

$merged = @()
$blocked = @()
$waiting = @()

foreach ($pr in $prs) {
    Write-Host "`n=== Processing PR #$($pr.Number) for Issue #$($pr.Issue) ===" -ForegroundColor Cyan

    # Get issue details with labels
    $issueJson = gh issue view $($pr.Issue) --json labels,state,number 2>&1

    # Parse labels from output
    if ($issueJson -match '"state":"(\w+)"') {
        $state = $matches[1]
        Write-Host "Issue #$($pr.Issue) state: $state" -ForegroundColor Yellow

        if ($state -eq "CLOSED") {
            Write-Host "Issue already closed, skipping PR #$($pr.Number)" -ForegroundColor Yellow
            continue
        }
    }

    # Check for dependency labels (d1, d2, d76, etc.)
    $depLabels = @()
    if ($issueJson -match '"labels":\[(.*?)\]') {
        $labelsSection = $matches[1]
        # Extract all label names
        $labelMatches = [regex]::Matches($labelsSection, '"name":"(d\d+)"')
        foreach ($match in $labelMatches) {
            $depLabels += $match.Groups[1].Value
        }
    }

    if ($depLabels.Count -gt 0) {
        Write-Host "Found dependency labels: $($depLabels -join ', ')" -ForegroundColor Magenta

        # Check each dependency
        $blockedByOpen = @()
        foreach ($depLabel in $depLabels) {
            # Extract issue number from label (e.g., "d76" -> 76)
            $depIssueNum = $depLabel -replace 'd', ''
            $depIssueJson = gh issue view $depIssueNum --json state 2>&1

            if ($depIssueJson -match '"state":"(\w+)"') {
                $depState = $matches[1]
                if ($depState -eq "OPEN") {
                    $blockedByOpen += "#$depIssueNum"
                    Write-Host "  Dependency #$depIssueNum is OPEN - BLOCKING" -ForegroundColor Red
                } else {
                    Write-Host "  Dependency #$depIssueNum is CLOSED - OK" -ForegroundColor Green
                }
            }
        }

        if ($blockedByOpen.Count -gt 0) {
            $blockMsg = "Blocked by open dependencies: $($blockedByOpen -join ', ')"
            Write-Host $blockMsg -ForegroundColor Red
            $blocked += @{PR=$pr.Number; Reason=$blockMsg}

            # Notify and comment
            python core/discord_notifier.py pr_blocked 'Bruce Banner' $($pr.Number) $blockMsg
            gh pr comment $($pr.Number) --body "⚠️ $blockMsg"
            continue
        }
    } else {
        Write-Host "No dependency labels found" -ForegroundColor Green
    }

    # Check CI status
    Write-Host "Checking CI status..." -ForegroundColor Yellow
    $prChecks = gh pr view $($pr.Number) --json statusCheckRollup 2>&1

    $allPassed = $true
    if ($prChecks -match '"conclusion":"(\w+)"') {
        # Check for any failures
        if ($prChecks -match '"conclusion":"FAILURE"') {
            Write-Host "CI checks failing" -ForegroundColor Red
            $waiting += $pr.Number
            gh pr comment $($pr.Number) --body "⏳ Waiting for CI checks to pass"
            continue
        }
    }

    Write-Host "All checks passed! Ready to merge PR #$($pr.Number)" -ForegroundColor Green

    # Merge the PR
    Write-Host "Merging PR #$($pr.Number)..." -ForegroundColor Green
    gh pr merge $($pr.Number) --squash --delete-branch

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Merged PR #$($pr.Number), closes issue #$($pr.Issue)" -ForegroundColor Green
        $merged += $pr.Number

        # Notify Discord
        python core/discord_notifier.py pr_merged 'Bruce Banner' $($pr.Number) $($pr.Issue)
    } else {
        Write-Host "Failed to merge PR #$($pr.Number)" -ForegroundColor Red
        $blocked += @{PR=$pr.Number; Reason="Merge failed"}
    }
}

# Summary
Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Merged PRs: $($merged -join ', ')" -ForegroundColor Green
if ($blocked.Count -gt 0) {
    Write-Host "Blocked PRs:" -ForegroundColor Red
    foreach ($b in $blocked) {
        Write-Host "  PR #$($b.PR): $($b.Reason)" -ForegroundColor Red
    }
}
if ($waiting.Count -gt 0) {
    Write-Host "Waiting on CI: $($waiting -join ', ')" -ForegroundColor Yellow
}
