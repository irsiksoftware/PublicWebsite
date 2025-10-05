# Get all open issues with full JSON data
$issues = & "C:\Program Files\GitHub CLI\gh.bat" issue list --state open --json number,title,labels,createdAt --limit 100 | ConvertFrom-Json

# Filter out WIP issues
$availableIssues = $issues | Where-Object {
    $_.labels.name -notcontains "wip"
}

# Sort by priority (CRITICAL > URGENT > HIGH > MEDIUM > LOW), then by createdAt (oldest first)
$priorityOrder = @{
    "CRITICAL" = 1
    "URGENT" = 2
    "HIGH" = 3
    "MEDIUM" = 4
    "LOW" = 5
}

$sortedIssues = $availableIssues | Sort-Object {
    $priority = $_.labels.name | Where-Object { $priorityOrder.ContainsKey($_) } | Select-Object -First 1
    if ($priority) { $priorityOrder[$priority] } else { 999 }
}, createdAt

# Output as JSON
$sortedIssues | ConvertTo-Json -Depth 10
