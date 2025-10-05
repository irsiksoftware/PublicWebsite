$ErrorActionPreference = "Stop"

# Get issue list as text
$output = & gh issue list --state open --limit 100 2>&1 | Out-String

# Parse the text output
$lines = $output -split "`n" | Where-Object { $_ -match "^#\d+" }

$issues = @()
foreach ($line in $lines) {
    # Parse: #138 [OPEN] [LOW, feature, testing] Create comprehensive...
    if ($line -match "^#(\d+)\s+\[OPEN\]\s+\[(.*?)\]\s+(.+)$") {
        $number = [int]$matches[1]
        $labelsStr = $matches[2]
        $title = $matches[3].Trim()

        $labels = $labelsStr -split ",\s*"

        # Skip WIP
        if ($labels -contains "wip") {continue        }

        # Get priority
        $priority = "NONE"
        $deps = @()
        foreach ($lbl in $labels) {
            if ($lbl -match "^(CRITICAL|URGENT|HIGH|MEDIUM|LOW)$") {
                $priority = $lbl.ToUpper()
            }
            if ($lbl -match "^d\d+$") {
                $deps += $lbl
            }
        }

        $issues += @{
            number = $number
            title = $title
            priority = $priority
            dependencies = $deps
        }
    }
}

# Priority mapping for sorting
$priorityMap = @{
    "CRITICAL" = 5
    "URGENT" = 4
    "HIGH" = 3
    "MEDIUM" = 2
    "LOW" = 1
    "NONE" = 0
}

# Sort by priority (desc) then by number (asc - oldest first)
$sorted = $issues | Sort-Object -Property @{
    Expression = { $priorityMap[$_.priority] }
    Descending = $true
}, @{
    Expression = { $_.number }
    Descending = $false
}

# Output top 10
Write-Host "=== Available Issues (Priority Order) ===" -ForegroundColor Cyan
$sorted | Select-Object -First 10 | ForEach-Object {
    $depStr = if ($_.dependencies.Count -gt 0) { " [Deps: $($_.dependencies -join ', ')]" } else { "" }
    Write-Host "#$($_.number) [$($_.priority)]$depStr $($_.title)"
}

# Return first one as JSON for scripting
$sorted | Select-Object -First 1 | ConvertTo-Json
