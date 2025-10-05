$ErrorActionPreference = "Stop"

# Fetch all open issues with JSON output
$rawJson = & gh issue list --state open --json number,title,labels,createdAt --limit 200
$issues = $rawJson | ConvertFrom-Json

# Filter out WIP issues
$availableIssues = $issues | Where-Object {
    $hasWip = $false
    foreach ($label in $_.labels) {
        if ($label.name -eq "wip") {
            $hasWip = $true
            break
        }
    }
    -not $hasWip
}

# Function to get priority value
function Get-PriorityValue($labels) {
    foreach ($label in $labels) {
        switch ($label.name.ToUpper()) {
            "CRITICAL" { return 5 }
            "URGENT" { return 4 }
            "HIGH" { return 3 }
            "MEDIUM" { return 2 }
            "LOW" { return 1 }
        }
    }
    return 0
}

# Sort by priority (desc) then by createdAt (asc - oldest first)
$sorted = $availableIssues | Sort-Object -Property @{
    Expression = { Get-PriorityValue $_.labels }
    Descending = $true
}, @{
    Expression = { $_.createdAt }
    Descending = $false
}

# Output as JSON
$sorted | ConvertTo-Json -Depth 10
