# Elite Issue Selector - Black Widow Protocol
$issues = & "C:\Program Files\GitHub CLI\gh.bat" issue list --label '!wip' --state open --json number,title,labels,createdAt --limit 100 | ConvertFrom-Json

# Filter out issues with 'wip' label
$availableIssues = $issues | Where-Object {
    $hasWip = $false
    foreach ($label in $_.labels) {
        if ($label.name -eq 'wip') {
            $hasWip = $true
            break
        }
    }
    return -not $hasWip
}

# Categorize by priority
$priorityMap = @{
    'CRITICAL' = 1
    'URGENT' = 2
    'HIGH' = 3
    'MEDIUM' = 4
    'LOW' = 5
}

$categorized = $availableIssues | ForEach-Object {
    $priority = 'LOW'
    foreach ($label in $_.labels) {
        if ($priorityMap.ContainsKey($label.name.ToUpper())) {
            if ($priorityMap[$label.name.ToUpper()] -lt $priorityMap[$priority]) {
                $priority = $label.name.ToUpper()
            }
        }
    }

    [PSCustomObject]@{
        Number = $_.number
        Title = $_.title
        Priority = $priority
        PriorityValue = $priorityMap[$priority]
        CreatedAt = [DateTime]$_.createdAt
        Labels = ($_.labels | ForEach-Object { $_.name }) -join ', '
    }
}

# Sort: first by priority (ascending), then by age (oldest first)
$sorted = $categorized | Sort-Object PriorityValue, CreatedAt

# Output sorted list
$sorted | Format-Table -AutoSize

# Output first issue as JSON for processing
if ($sorted.Count -gt 0) {
    $sorted[0] | ConvertTo-Json
}
