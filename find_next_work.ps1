#!/usr/bin/env pwsh
# Find next available issue following priority and dependency rules

$issues = & 'C:\Program Files\GitHub CLI\gh.bat' issue list --state open --json number,title,labels,createdAt --limit 100 | ConvertFrom-Json

# Filter out WIP issues
$availableIssues = $issues | Where-Object {
    $_.labels.name -notcontains 'wip'
}

# Sort by priority (CRITICAL > URGENT > HIGH > MEDIUM > LOW), then by created date (oldest first)
$priorityOrder = @{
    'CRITICAL' = 0
    'URGENT' = 1
    'HIGH' = 2
    'MEDIUM' = 3
    'LOW' = 4
}

$sorted = $availableIssues | Sort-Object {
    $priority = 4  # Default to LOW
    foreach ($label in $_.labels) {
        if ($priorityOrder.ContainsKey($label.name.ToUpper())) {
            $priority = $priorityOrder[$label.name.ToUpper()]
            break
        }
    }
    $priority
}, createdAt

# Output the sorted list
foreach ($issue in $sorted) {
    $priorityLabel = 'LOW'
    foreach ($label in $issue.labels) {
        if ($priorityOrder.ContainsKey($label.name.ToUpper())) {
            $priorityLabel = $label.name.ToUpper()
            break
        }
    }

    $depLabels = ($issue.labels | Where-Object { $_.name -match '^d\d+$' }).name -join ','

    Write-Output "$($issue.number)|$priorityLabel|$($issue.createdAt)|$depLabels|$($issue.title)"
}
