# Get all open issues without WIP
$issues = & "C:\Program Files\GitHub CLI\gh.bat" issue list --state open --limit 100 --json number,title,labels,createdAt | ConvertFrom-Json

# Filter out issues with 'wip' label
$available = $issues | Where-Object {
    $_.labels.name -notcontains 'wip'
}

# Priority mapping
$priorityMap = @{
    'CRITICAL' = 1
    'URGENT' = 2
    'HIGH' = 3
    'MEDIUM' = 4
    'LOW' = 5
}

# Sort by priority (lowest number = highest priority), then by createdAt (oldest first)
$sorted = $available | ForEach-Object {
    $priority = 6  # Default if no priority label
    foreach ($label in $_.labels) {
        if ($priorityMap.ContainsKey($label.name)) {
            $priority = $priorityMap[$label.name]
            break
        }
    }
    [PSCustomObject]@{
        Number = $_.number
        Title = $_.title
        Priority = $priority
        Labels = ($_.labels.name -join ', ')
        CreatedAt = [DateTime]$_.createdAt
    }
} | Sort-Object Priority, CreatedAt

# Output as JSON
$sorted | ConvertTo-Json -Depth 10
