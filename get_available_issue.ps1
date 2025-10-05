# Get all open issues without WIP label
$issues = & "C:\Program Files\GitHub CLI\gh.bat" issue list --label '!wip' --state open --json number,title,labels,createdAt | ConvertFrom-Json

# Define priority order
$priorityOrder = @{
    'CRITICAL' = 1
    'URGENT' = 2
    'HIGH' = 3
    'MEDIUM' = 4
    'LOW' = 5
}

# Filter out issues with 'wip' label and sort by priority then creation date
$sortedIssues = $issues | Where-Object {
    $_.labels.name -notcontains 'wip'
} | Sort-Object {
    $priority = $_.labels.name | Where-Object { $priorityOrder.ContainsKey($_) } | Select-Object -First 1
    if ($priority) { $priorityOrder[$priority] } else { 99 }
}, createdAt

# Output sorted issues
$sortedIssues | ConvertTo-Json -Depth 10
