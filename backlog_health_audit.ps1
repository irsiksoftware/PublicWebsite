# BACKLOG HEALTH AUDIT - Final Version
# Audits all open issues for proper labels and dependencies

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   BACKLOG HEALTH AUDIT - Starting...     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Initialize results
$broken = @()
$noPriority = @()
$multiPriority = @()
$suggested = @()
$fixed = 0

# Get all open issues
Write-Host "[1/4] Fetching all open issues..." -ForegroundColor Yellow
$issueList = gh issue list --state open --limit 1000
$issueNumbers = $issueList | ForEach-Object {
    if ($_ -match '#(\d+)') { [int]$matches[1] }
}

Write-Host "      Found: $($issueNumbers.Count) issues" -ForegroundColor Green
Write-Host ""

# Priority and type label definitions
$priorities = @('CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW')
$types = @('feature', 'bug', 'testing', 'documentation', 'enhancement')

# Audit each issue
Write-Host "[2/4] Auditing all issues..." -ForegroundColor Yellow
$count = 0
foreach ($num in $issueNumbers) {
    $count++
    Write-Progress -Activity "Auditing Issues" -Status "Issue #$num" -PercentComplete (($count / $issueNumbers.Count) * 100)

    # Get issue via API
    $issueJson = gh api "repos/irsiksoftware/TestForAI/issues/$num" -ErrorAction SilentlyContinue
    if (-not $issueJson) { continue }

    $issue = $issueJson | ConvertFrom-Json
    $labels = $issue.labels.name

    # Check for dependency labels (d1, d2, d3, etc)
    $depLabels = $labels | Where-Object { $_ -match '^d(\d+)$' }
    foreach ($depLabel in $depLabels) {
        if ($depLabel -match '^d(\d+)$') {
            $depNum = [int]$matches[1]

            # Check if dependency exists
            $depCheck = gh api "repos/irsiksoftware/TestForAI/issues/$depNum" 2>&1
            if ($LASTEXITCODE -ne 0) {
                $broken += [PSCustomObject]@{
                    Issue = $num
                    DependsOn = $depNum
                    Label = $depLabel
                }
            }
        }
    }

    # Check priority labels
    $priorityLabels = $labels | Where-Object { $_ -in $priorities }

    if ($priorityLabels.Count -eq 0) {
        $noPriority += $num
    }
    elseif ($priorityLabels.Count -gt 1) {
        $multiPriority += [PSCustomObject]@{
            Issue = $num
            Priorities = ($priorityLabels -join ', ')
        }
    }

    # Check for suggested labels based on title
    $title = $issue.title.ToLower()
    if (($title -match '\btest') -and ($labels -notcontains 'testing')) {
        $suggested += [PSCustomObject]@{ Issue = $num; Label = 'testing'; Reason = 'Title contains "test"' }
    }
    if (($title -match '\b(bug|fix|error)\b') -and ($labels -notcontains 'bug')) {
        $suggested += [PSCustomObject]@{ Issue = $num; Label = 'bug'; Reason = 'Title suggests bug fix' }
    }
}

Write-Progress -Activity "Auditing Issues" -Completed
Write-Host "      Audit complete!" -ForegroundColor Green
Write-Host ""

# Display Results
Write-Host "[3/4] Audit Results:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Broken Dependencies: " -NoNewline
if ($broken.Count -eq 0) {
    Write-Host "$($broken.Count)" -ForegroundColor Green
} else {
    Write-Host "$($broken.Count)" -ForegroundColor Red
    foreach ($b in $broken) {
        Write-Host "    ⚠ Issue #$($b.Issue) → #$($b.DependsOn) [$($b.Label)]" -ForegroundColor Red
    }
}

Write-Host "  Missing Priority: " -NoNewline
if ($noPriority.Count -eq 0) {
    Write-Host "$($noPriority.Count)" -ForegroundColor Green
} else {
    Write-Host "$($noPriority.Count)" -ForegroundColor Yellow
    Write-Host "    Issues: #$($noPriority -join ', #')" -ForegroundColor Yellow
}

Write-Host "  Multiple Priorities: " -NoNewline
if ($multiPriority.Count -eq 0) {
    Write-Host "$($multiPriority.Count)" -ForegroundColor Green
} else {
    Write-Host "$($multiPriority.Count)" -ForegroundColor Magenta
    foreach ($m in $multiPriority) {
        Write-Host "    ⚠ Issue #$($m.Issue): [$($m.Priorities)]" -ForegroundColor Magenta
    }
}

Write-Host "  Suggested Labels: " -NoNewline
if ($suggested.Count -eq 0) {
    Write-Host "$($suggested.Count)" -ForegroundColor Green
} else {
    Write-Host "$($suggested.Count)" -ForegroundColor Yellow
}

Write-Host ""

# Save detailed results
$results = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    TotalIssues = $issueNumbers.Count
    BrokenDependencies = $broken
    MissingPriority = $noPriority
    MultiplePriorities = $multiPriority
    SuggestedLabels = $suggested
}

$results | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 "BACKLOG_HEALTH_REPORT.json"
Write-Host "  Detailed results saved to: BACKLOG_HEALTH_REPORT.json" -ForegroundColor Cyan
Write-Host ""

# Final Status
Write-Host "[4/4] Backlog Health Status:" -ForegroundColor Yellow
if ($broken.Count -eq 0 -and $noPriority.Count -eq 0 -and $multiPriority.Count -eq 0) {
    Write-Host ""
    Write-Host "  ✅ BACKLOG IS HEALTHY" -ForegroundColor Green
    Write-Host "     All issues have proper labels and valid dependencies" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  ⚠️  BACKLOG NEEDS ATTENTION" -ForegroundColor Yellow
    Write-Host "     Issues found that need to be fixed" -ForegroundColor Yellow
    Write-Host ""
}

exit 0
