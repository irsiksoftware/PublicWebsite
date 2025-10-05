$issues = & "C:\Program Files\GitHub CLI\gh.bat" issue list --state open --json number,title,labels,createdAt --limit 100 | ConvertFrom-Json

# Filter out WIP issues
$available = $issues | Where-Object {
    $hasWip = $false
    foreach ($label in $_.labels) {
        if ($label.name -eq 'wip') {
            $hasWip = $true
            break
        }
    }
    -not $hasWip
}

# Sort by priority
$priorityOrder = @{
    'CRITICAL' = 1
    'URGENT' = 2
    'HIGH' = 3
    'MEDIUM' = 4
    'LOW' = 5
}

$sorted = $available | ForEach-Object {
    $priority = 'LOW'
    foreach ($label in $_.labels) {
        if ($priorityOrder.ContainsKey($label.name)) {
            $priority = $label.name
            break
        }
    }
    [PSCustomObject]@{
        Number = $_.number
        Title = $_.title
        Priority = $priority
        PriorityValue = $priorityOrder[$priority]
        CreatedAt = $_.createdAt
        Labels = $_.labels
    }
} | Sort-Object PriorityValue, CreatedAt

$sorted | ConvertTo-Json -Depth 10
