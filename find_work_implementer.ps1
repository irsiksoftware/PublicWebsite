# Priority order
$PRIORITY_ORDER = @{
    'CRITICAL' = 0
    'URGENT' = 1
    'HIGH' = 2
    'MEDIUM' = 3
    'LOW' = 4
}

function Get-Priority($issue) {
    $labelNames = $issue.labels | ForEach-Object { $_.name.ToUpper() }
    foreach ($priority in $PRIORITY_ORDER.Keys | Sort-Object { $PRIORITY_ORDER[$_] }) {
        if ($labelNames -contains $priority) {
            return $priority
        }
    }
    return 'LOW'
}

function Get-DependencyLabels($issue) {
    $deps = @()
    $labelNames = $issue.labels | ForEach-Object { $_.name.ToLower() }
    foreach ($label in $labelNames) {
        if ($label -match '^d(\d+)$') {
            $deps += [int]$matches[1]
        }
    }
    return $deps
}

function Check-IssueState($issueNumber) {
    $result = gh issue view $issueNumber --json state | ConvertFrom-Json
    return $result.state.ToUpper()
}

Write-Host "Fetching open issues..."
$allIssues = gh issue list --state open --json number,title,labels,createdAt --limit 100 | ConvertFrom-Json
Write-Host "Total issues: $($allIssues.Count)"

# Filter out WIP issues
$availableIssues = $allIssues | Where-Object {
    $labelNames = $_.labels | ForEach-Object { $_.name.ToLower() }
    'wip' -notin $labelNames
}
Write-Host "Issues without WIP: $($availableIssues.Count)"

if ($availableIssues.Count -eq 0) {
    Write-Host "No available issues found (all have WIP label or are blocked)"
    exit 0
}

# Sort by priority and age
$sortedIssues = $availableIssues | Sort-Object {
    $priority = Get-Priority $_
    $priorityRank = $PRIORITY_ORDER[$priority]
    $createdAt = [DateTime]::Parse($_.createdAt)
    return @($priorityRank, $createdAt)
}

Write-Host "`nSorted available issues:"
foreach ($issue in $sortedIssues) {
    $priority = Get-Priority $issue
    $deps = Get-DependencyLabels $issue
    $depStr = if ($deps.Count -gt 0) { " [deps: $($deps -join ', ')]" } else { "" }
    Write-Host "  #$($issue.number) [$priority]$depStr - $($issue.title)"
}

# Find first claimable issue
foreach ($issue in $sortedIssues) {
    $issueNum = $issue.number
    $deps = Get-DependencyLabels $issue

    if ($deps.Count -eq 0) {
        # No dependencies, this is claimable
        Write-Host "`nFound claimable issue: #$issueNum"
        $issue | ConvertTo-Json -Depth 10
        exit 0
    }

    # Check if all dependencies are closed
    $allDepsClosed = $true
    foreach ($depNum in $deps) {
        $state = Check-IssueState $depNum
        if ($state -ne 'CLOSED') {
            Write-Host "Skipping #$issueNum - blocked by #$depNum (state: $state)"
            $allDepsClosed = $false
            break
        }
    }

    if ($allDepsClosed) {
        Write-Host "`nFound claimable issue: #$issueNum (all dependencies closed)"
        $issue | ConvertTo-Json -Depth 10
        exit 0
    }
}

Write-Host "`nNo claimable issues found (all are blocked or have WIP)"
exit 0
