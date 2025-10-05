# IMPLEMENTER Workflow - Find and claim one issue
# Priority: CRITICAL > URGENT > HIGH > MEDIUM > LOW (oldest first)

$ErrorActionPreference = "Stop"

Write-Host "Fetching open issues..." -ForegroundColor Cyan

# Fetch issues using GitHub API
$issues = gh api 'repos/irsiksoftware/TestForAI/issues?state=open&per_page=100' | ConvertFrom-Json

# Filter out pull requests and WIP issues
$availableIssues = $issues | Where-Object {
    -not $_.pull_request -and
    (-not ($_.labels | Where-Object { $_.name -eq 'wip' }))
}

if ($availableIssues.Count -eq 0) {
    Write-Host "No available issues (all have WIP label)" -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($availableIssues.Count) available issues" -ForegroundColor Green

# Define priority order
$priorityOrder = @{
    'CRITICAL' = 0
    'URGENT' = 1
    'HIGH' = 2
    'MEDIUM' = 3
    'LOW' = 4
}

# Sort by priority and creation date
$sortedIssues = $availableIssues | ForEach-Object {
    $priority = ($_.labels | Where-Object { $priorityOrder.ContainsKey($_.name.ToUpper()) } | Select-Object -First 1).name.ToUpper()
    if (-not $priority) { $priority = 'LOW' }

    [PSCustomObject]@{
        Number = $_.number
        Title = $_.title
        Priority = $priority
        PriorityValue = $priorityOrder[$priority]
        CreatedAt = [DateTime]::Parse($_.created_at)
        Labels = $_.labels
        Body = $_.body
    }
} | Sort-Object PriorityValue, CreatedAt

# Find first claimable issue (no open dependencies)
foreach ($issue in $sortedIssues) {
    Write-Host "`nChecking #$($issue.Number): $($issue.Title) [$($issue.Priority)]" -ForegroundColor Cyan

    # Extract dependency labels (d1, d2, etc.)
    $deps = $issue.Labels | Where-Object { $_.name -match '^d\d+$' } | ForEach-Object {
        [int]($_.name.Substring(1))
    }

    if ($deps) {
        $blocked = $false
        foreach ($depNum in $deps) {
            $depIssue = gh api "repos/irsiksoftware/TestForAI/issues/$depNum" | ConvertFrom-Json
            if ($depIssue.state -ne 'closed') {
                Write-Host "  Skipping - blocked by #$depNum" -ForegroundColor Yellow
                $blocked = $true
                break
            }
        }

        if ($blocked) { continue }
    }

    # Found claimable issue!
    Write-Host "`n✓ FOUND CLAIMABLE ISSUE:" -ForegroundColor Green
    Write-Host "  #$($issue.Number): $($issue.Title)" -ForegroundColor White
    Write-Host "  Priority: $($issue.Priority)" -ForegroundColor Yellow

    # Save to file for use
    @{
        number = $issue.Number
        title = $issue.Title
        priority = $issue.Priority
        body = $issue.Body
    } | ConvertTo-Json | Out-File -FilePath "claimable_issue_work.json" -Encoding UTF8

    exit 0
}

Write-Host "`nAll available issues are blocked by dependencies" -ForegroundColor Yellow
exit 0
