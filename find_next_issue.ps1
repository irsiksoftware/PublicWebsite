# Get all open issues with JSON data
$issues = gh issue list --state open --json number,title,labels,createdAt | ConvertFrom-Json

# Filter out issues with 'wip' label
$filtered = $issues | Where-Object {
    ($_.labels | Where-Object { $_.name -eq 'wip' }).Count -eq 0
}

# Sort by priority (CRITICAL > URGENT > HIGH > MEDIUM > LOW), then by createdAt (oldest first)
$sorted = $filtered | Sort-Object {
    $priority = 999
    if ($_.labels.name -contains 'CRITICAL') { $priority = 1 }
    elseif ($_.labels.name -contains 'URGENT') { $priority = 2 }
    elseif ($_.labels.name -contains 'HIGH') { $priority = 3 }
    elseif ($_.labels.name -contains 'MEDIUM') { $priority = 4 }
    elseif ($_.labels.name -contains 'LOW') { $priority = 5 }
    $priority
}, createdAt

# Output the sorted list
$sorted | Select-Object -First 20 number, title, @{Name='labels';Expression={($_.labels.name | Sort-Object) -join ','}} | Format-Table -AutoSize
