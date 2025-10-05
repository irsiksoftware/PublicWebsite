# Find next available issue by priority
$issues = & "C:\Program Files\GitHub CLI\gh.bat" issue list --state open --json number,title,labels,createdAt --limit 100 | ConvertFrom-Json

# Filter out WIP issues
$available = $issues | Where-Object {
    $wip = $false
    foreach ($label in $_.labels) {
        if ($label.name -eq 'wip') {
            $wip = $true
            break
        }
    }
    -not $wip
}

# Sort by priority (CRITICAL > URGENT > HIGH > MEDIUM > LOW), then by creation date (oldest first)
$sorted = $available | Sort-Object -Property @{
    Expression = {
        $priority = 999
        foreach ($label in $_.labels) {
            if ($label.name -eq 'CRITICAL') { $priority = 0; break }
            elseif ($label.name -eq 'URGENT') { if ($priority -gt 1) { $priority = 1 } }
            elseif ($label.name -eq 'HIGH') { if ($priority -gt 2) { $priority = 2 } }
            elseif ($label.name -eq 'MEDIUM') { if ($priority -gt 3) { $priority = 3 } }
            elseif ($label.name -eq 'LOW') { if ($priority -gt 4) { $priority = 4 } }
        }
        $priority
    }
}, createdAt

# Output first 5 for inspection
$sorted | Select-Object -First 5 | ForEach-Object {
    $labelNames = ($_.labels | ForEach-Object { $_.name }) -join ','
    Write-Host "#$($_.number): $($_.title) [$labelNames]"
}

# Output the first one as JSON for processing
$sorted | Select-Object -First 1 | ConvertTo-Json -Depth 5
