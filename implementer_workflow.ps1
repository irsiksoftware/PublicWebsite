# IMPLEMENTER: Find and work on ONE issue
$ErrorActionPreference = "Stop"

# Fetch all open issues with JSON output
$issuesJson = & "C:\Program Files\GitHub CLI\gh.bat" issue list --state open --json number,title,labels,createdAt --limit 100 | ConvertFrom-Json

# Priority mapping
$priorityMap = @{
    'CRITICAL' = 0
    'URGENT' = 1
    'HIGH' = 2
    'MEDIUM' = 3
    'LOW' = 4
}

# Filter and sort issues
$availableIssues = @()
foreach ($issue in $issuesJson) {
    $labels = $issue.labels.name | ForEach-Object { $_.ToLower() }

    # Skip if has wip label
    if ($labels -contains 'wip') {
        continue
    }

    # Determine priority
    $priority = 4  # Default to LOW
    $priorityName = 'LOW'
    foreach ($label in $issue.labels.name) {
        $labelUpper = $label.ToUpper()
        if ($priorityMap.ContainsKey($labelUpper)) {
            $priority = $priorityMap[$labelUpper]
            $priorityName = $labelUpper
            break
        }
    }

    # Extract dependency labels (d1, d2, etc.)
    $dependencies = @()
    foreach ($label in $issue.labels.name) {
        if ($label -match '^d(\d+)$') {
            $dependencies += $label
        }
    }

    $availableIssues += [PSCustomObject]@{
        Number = $issue.number
        Title = $issue.title
        Priority = $priority
        PriorityName = $priorityName
        CreatedAt = $issue.createdAt
        Dependencies = $dependencies
        Labels = $labels
    }
}

# Sort by priority (ascending), then by createdAt (oldest first)
$sortedIssues = $availableIssues | Sort-Object -Property @{Expression={$_.Priority}; Ascending=$true}, @{Expression={$_.CreatedAt}; Ascending=$true}

Write-Host "Found $($sortedIssues.Count) available issues (excluding WIP)" -ForegroundColor Cyan
Write-Host ""

# Try to find claimable issue
foreach ($issue in $sortedIssues) {
    Write-Host "Checking #$($issue.Number) [$($issue.PriorityName)] $($issue.Title)" -ForegroundColor Yellow

    # Check if has dependencies
    if ($issue.Dependencies.Count -gt 0) {
        $blocked = $false
        foreach ($dep in $issue.Dependencies) {
            # Extract dependency issue number
            $depNum = $dep -replace '^d', ''

            # Check if dependency is closed
            $depStatus = & "C:\Program Files\GitHub CLI\gh.bat" issue view $depNum --json state | ConvertFrom-Json

            if ($depStatus.state -eq 'OPEN') {
                Write-Host "  Skipping #$($issue.Number) - blocked by #$depNum" -ForegroundColor Red
                $blocked = $true
                break
            }
        }

        if ($blocked) {
            continue
        }
    }

    # Found claimable issue!
    Write-Host "Found claimable issue: #$($issue.Number)" -ForegroundColor Green

    # Save issue number to file for Python to use
    $issue.Number | Out-File -FilePath "claimable_issue.json" -Encoding utf8

    # Output issue details
    Write-Host ""
    Write-Host "CLAIMABLE ISSUE FOUND:" -ForegroundColor Green
    Write-Host "Number: $($issue.Number)"
    Write-Host "Title: $($issue.Title)"
    Write-Host "Priority: $($issue.PriorityName)"
    Write-Host "Dependencies: $(if ($issue.Dependencies.Count -gt 0) { $issue.Dependencies -join ', ' } else { 'none' })"

    exit 0
}

# No claimable issues found
Write-Host "No claimable issues found. All issues are either WIP or blocked by dependencies." -ForegroundColor Yellow
exit 1
