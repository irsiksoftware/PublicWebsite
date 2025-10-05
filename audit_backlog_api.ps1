# Backlog Health Audit Script - Using GitHub API
# Checks all open issues for dependencies, priorities, and labels

$auditResults = @{
    brokenDependencies = @()
    missingPriority = @()
    missingTypeLabels = @()
    multiplePriorities = @()
    allIssues = @()
    issuesChecked = 0
}

Write-Host "=== BACKLOG HEALTH AUDIT ===" -ForegroundColor Cyan
Write-Host "Fetching all open issues via GitHub API..." -ForegroundColor Yellow
Write-Host ""

# Get all open issue numbers (still need gh for this)
$openIssues = gh issue list --state open --limit 1000 | ForEach-Object {
    if ($_ -match '#(\d+)') {
        [int]$matches[1]
    }
}

Write-Host "Found $($openIssues.Count) open issues to audit" -ForegroundColor Green
Write-Host ""

$priorityLabels = @('CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW')
$typeLabels = @('feature', 'bug', 'testing', 'documentation', 'enhancement')

foreach ($issueNum in $openIssues) {
    Write-Host "Auditing issue #$issueNum... " -NoNewline

    try {
        # Get issue details via API
        $issue = gh api "repos/irsiksoftware/TestForAI/issues/$issueNum" | ConvertFrom-Json

        $labels = $issue.labels.name
        $title = $issue.title
        $body = $issue.body

        $issueData = @{
            number = $issueNum
            title = $title
            labels = $labels
            body = $body
            dependencies = @()
            priorityLabels = @()
            typeLabels = @()
            hasPriority = $false
            hasType = $false
        }

        # Check for dependency labels (d1, d2, d3, etc)
        $depLabels = $labels | Where-Object { $_ -match '^d(\d+)$' }
        foreach ($depLabel in $depLabels) {
            if ($depLabel -match '^d(\d+)$') {
                $depNum = [int]$matches[1]

                # Check if dependency exists
                try {
                    $depIssue = gh api "repos/irsiksoftware/TestForAI/issues/$depNum" 2>&1 | ConvertFrom-Json
                    $depExists = $true
                } catch {
                    $depExists = $false
                }

                $issueData.dependencies += @{
                    label = $depLabel
                    number = $depNum
                    exists = $depExists
                }

                if (-not $depExists) {
                    $auditResults.brokenDependencies += @{
                        issue = $issueNum
                        dependency = $depNum
                        label = $depLabel
                    }
                    Write-Host "" # New line for warning
                    Write-Host "  ⚠️  BROKEN DEPENDENCY: #$issueNum depends on non-existent #$depNum" -ForegroundColor Red
                    Write-Host "Auditing issue #$issueNum (cont)... " -NoNewline
                }
            }
        }

        # Check priority labels
        $issuePriorities = $labels | Where-Object { $_ -in $priorityLabels }
        $issueData.priorityLabels = $issuePriorities
        $issueData.hasPriority = $issuePriorities.Count -gt 0

        if ($issuePriorities.Count -eq 0) {
            $auditResults.missingPriority += $issueNum
            Write-Host "" # New line for warning
            Write-Host "  ⚠️  MISSING PRIORITY: #$issueNum" -ForegroundColor Yellow
            Write-Host "Auditing issue #$issueNum (cont)... " -NoNewline
        } elseif ($issuePriorities.Count -gt 1) {
            $auditResults.multiplePriorities += @{
                issue = $issueNum
                priorities = $issuePriorities
            }
            Write-Host "" # New line for warning
            Write-Host "  ⚠️  MULTIPLE PRIORITIES: #$issueNum has [$($issuePriorities -join ', ')]" -ForegroundColor Magenta
            Write-Host "Auditing issue #$issueNum (cont)... " -NoNewline
        }

        # Check type labels
        $issueTypes = $labels | Where-Object { $_ -in $typeLabels }
        $issueData.typeLabels = $issueTypes
        $issueData.hasType = $issueTypes.Count -gt 0

        # Check if title keywords suggest missing labels
        $titleLower = $title.ToLower()

        if (($titleLower -match 'test|testing') -and ($labels -notcontains 'testing')) {
            $auditResults.missingTypeLabels += @{
                issue = $issueNum
                missingLabel = 'testing'
                reason = 'title contains test/testing'
            }
            Write-Host "" # New line for warning
            Write-Host "  ⚠️  SUGGESTED LABEL: #$issueNum should have 'testing' label" -ForegroundColor Yellow
            Write-Host "Auditing issue #$issueNum (cont)... " -NoNewline
        }

        if (($titleLower -match '\b(bug|fix|error|broken)\b') -and ($labels -notcontains 'bug')) {
            $auditResults.missingTypeLabels += @{
                issue = $issueNum
                missingLabel = 'bug'
                reason = 'title contains bug/fix/error'
            }
            Write-Host "" # New line for warning
            Write-Host "  ⚠️  SUGGESTED LABEL: #$issueNum should have 'bug' label" -ForegroundColor Yellow
            Write-Host "Auditing issue #$issueNum (cont)... " -NoNewline
        }

        $auditResults.allIssues += $issueData
        $auditResults.issuesChecked++

        Write-Host "✓" -ForegroundColor Green

    } catch {
        Write-Host "✗ ERROR: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== AUDIT SUMMARY ===" -ForegroundColor Cyan
Write-Host "Issues Checked: $($auditResults.issuesChecked)/$($openIssues.Count)" -ForegroundColor White
Write-Host ""
Write-Host "Broken Dependencies: $($auditResults.brokenDependencies.Count)" -ForegroundColor $(if ($auditResults.brokenDependencies.Count -eq 0) { 'Green' } else { 'Red' })
Write-Host "Missing Priority Labels: $($auditResults.missingPriority.Count)" -ForegroundColor $(if ($auditResults.missingPriority.Count -eq 0) { 'Green' } else { 'Yellow' })
Write-Host "Multiple Priorities: $($auditResults.multiplePriorities.Count)" -ForegroundColor $(if ($auditResults.multiplePriorities.Count -eq 0) { 'Green' } else { 'Magenta' })
Write-Host "Suggested Type Labels: $($auditResults.missingTypeLabels.Count)" -ForegroundColor $(if ($auditResults.missingTypeLabels.Count -eq 0) { 'Green' } else { 'Yellow' })
Write-Host ""

if ($auditResults.brokenDependencies.Count -gt 0) {
    Write-Host "Broken Dependencies Detail:" -ForegroundColor Red
    foreach ($dep in $auditResults.brokenDependencies) {
        Write-Host "  - Issue #$($dep.issue) → #$($dep.dependency) [$($dep.label)]" -ForegroundColor Red
    }
    Write-Host ""
}

if ($auditResults.multiplePriorities.Count -gt 0) {
    Write-Host "Multiple Priorities Detail:" -ForegroundColor Magenta
    foreach ($multi in $auditResults.multiplePriorities) {
        Write-Host "  - Issue #$($multi.issue): [$($multi.priorities -join ', ')]" -ForegroundColor Magenta
    }
    Write-Host ""
}

# Save results
$auditResults | ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 "backlog_audit_final.json"

Write-Host "Detailed results saved to: backlog_audit_final.json" -ForegroundColor Cyan
Write-Host ""

# Return status code
if ($auditResults.brokenDependencies.Count -eq 0 -and
    $auditResults.missingPriority.Count -eq 0 -and
    $auditResults.multiplePriorities.Count -eq 0) {
    Write-Host "✅ BACKLOG HEALTH: GOOD" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  BACKLOG HEALTH: NEEDS ATTENTION" -ForegroundColor Yellow
    exit 1
}
