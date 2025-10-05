# Fetch and sort issues by priority and dependencies
$issues = & 'C:\Program Files\GitHub CLI\gh.bat' issue list --state open --json number,title,labels,createdAt --limit 100 | ConvertFrom-Json

# Filter out WIP issues
$availableIssues = $issues | Where-Object { $_.labels.name -notcontains 'wip' }

# Add priority field and sort
$sortedIssues = $availableIssues | ForEach-Object {
    $priority = if ($_.labels.name -contains 'CRITICAL') { 1 }
                elseif ($_.labels.name -contains 'URGENT') { 2 }
                elseif ($_.labels.name -contains 'HIGH') { 3 }
                elseif ($_.labels.name -contains 'MEDIUM') { 4 }
                else { 5 }

    # Get dependency labels (d1, d2, etc)
    $deps = $_.labels.name | Where-Object { $_ -match '^d\d+$' }

    $_ | Add-Member -NotePropertyName 'priority' -NotePropertyValue $priority -PassThru |
         Add-Member -NotePropertyName 'dependencies' -NotePropertyValue $deps -PassThru
} | Sort-Object priority, createdAt

# Output sorted issues
$sortedIssues | ConvertTo-Json -Depth 10
