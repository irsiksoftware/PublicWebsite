$issues = & "C:\Program Files\GitHub CLI\gh.bat" issue list --state open --json number,title,labels,createdAt --limit 100 | ConvertFrom-Json

# Filter out issues with 'wip' label
$available = $issues | Where-Object {
    -not ($_.labels | Where-Object { $_.name -eq 'wip' })
}

# Add priority info
$withPriority = $available | ForEach-Object {
    $priorityLabel = $_.labels | Where-Object { $_.name -in @('CRITICAL','URGENT','HIGH','MEDIUM','LOW') } | Select-Object -First 1
    $priorityValue = switch ($priorityLabel.name) {
        'CRITICAL' { 0 }
        'URGENT' { 1 }
        'HIGH' { 2 }
        'MEDIUM' { 3 }
        'LOW' { 4 }
        default { 5 }
    }
    [PSCustomObject]@{
        number = $_.number
        title = $_.title
        priority = $priorityValue
        priorityName = $priorityLabel.name
        createdAt = $_.createdAt
        labels = $_.labels
    }
}

# Sort by priority then by creation date (oldest first)
$sorted = $withPriority | Sort-Object priority, createdAt

# Output top 10
$sorted | Select-Object -First 10 | ConvertTo-Json
