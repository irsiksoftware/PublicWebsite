# Get all open issues without WIP label
$issues = & "C:\Program Files\GitHub CLI\gh.bat" issue list --state open --json number,title,labels,createdAt | ConvertFrom-Json

# Filter out issues with 'wip' label
$availableIssues = $issues | Where-Object {
    $_.labels.name -notcontains 'wip'
}

# Sort by priority (CRITICAL > URGENT > HIGH > MEDIUM > LOW) and then by createdAt (oldest first)
$priorityMap = @{
    'CRITICAL' = 5
    'URGENT' = 4
    'HIGH' = 3
    'MEDIUM' = 2
    'LOW' = 1
}

$sortedIssues = $availableIssues | ForEach-Object {
    $priority = 0
    foreach ($label in $_.labels) {
        if ($priorityMap.ContainsKey($label.name.ToUpper())) {
            $p = $priorityMap[$label.name.ToUpper()]
            if ($p -gt $priority) {
                $priority = $p
            }
        }
    }
    $_ | Add-Member -NotePropertyName 'Priority' -NotePropertyValue $priority -PassThru
} | Sort-Object -Property @{Expression='Priority'; Descending=$true}, @{Expression='createdAt'; Descending=$false}

# Output the sorted list
$sortedIssues | ForEach-Object {
    $labels = ($_.labels | ForEach-Object { $_.name }) -join ','
    Write-Output "$($_.number)|$($_.title)|$labels"
}
