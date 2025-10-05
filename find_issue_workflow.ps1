# Find available issue following priority and dependency rules

# Fetch all open issues
$issues = gh issue list --state open --json number,title,labels,createdAt --limit 100 | ConvertFrom-Json

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

# Function to get priority rank
function Get-PriorityRank {
    param($labels)
    $priorityMap = @{
        'CRITICAL' = 1
        'URGENT' = 2
        'HIGH' = 3
        'MEDIUM' = 4
        'LOW' = 5
    }

    $rank = 6 # default (no priority label)
    foreach ($label in $labels) {
        $name = $label.name.ToUpper()
        if ($priorityMap.ContainsKey($name)) {
            $rank = $priorityMap[$name]
            break
        }
    }
    return $rank
}

# Function to get dependency numbers
function Get-DependencyNumbers {
    param($labels)
    $deps = @()
    foreach ($label in $labels) {
        if ($label.name -match '^d(\d+)$') {
            $deps += [int]$matches[1]
        }
    }
    return $deps
}

# Function to check if issue is closed
function Is-IssueClosed {
    param([int]$issueNum)
    $state = gh issue view $issueNum --json state | ConvertFrom-Json
    return $state.state -eq 'CLOSED'
}

# Sort by priority, then by created date
$sorted = $available | Sort-Object {
    $priority = Get-PriorityRank $_.labels
    return "$priority|$($_.createdAt)"
}

Write-Host "Checking $($sorted.Count) available issues by priority..."

# Find first claimable issue
foreach ($issue in $sorted) {
    $num = $issue.number
    $title = $issue.title

    # Get priority label
    $priorityLabel = 'NONE'
    foreach ($label in $issue.labels) {
        if ($label.name -match '^(CRITICAL|URGENT|HIGH|MEDIUM|LOW)$') {
            $priorityLabel = $label.name
            break
        }
    }

    # Check for WIP again (safety check)
    $hasWip = $false
    foreach ($label in $issue.labels) {
        if ($label.name -eq 'wip') {
            $hasWip = $true
            break
        }
    }
    if ($hasWip) {
        Write-Host "Skipping #$num - has WIP label (safety check)"
        continue
    }

    # Check dependencies
    $deps = Get-DependencyNumbers $issue.labels
    $blocked = $false
    if ($deps.Count -gt 0) {
        foreach ($dep in $deps) {
            if (-not (Is-IssueClosed $dep)) {
                Write-Host "Skipping #$num [$priorityLabel] - blocked by #$dep"
                $blocked = $true
                break
            }
        }
    }

    if ($blocked) {
        continue
    }

    # Found it!
    Write-Host "`n[OK] Found available issue: #$num [$priorityLabel]"
    Write-Host "  Title: $title"

    # Output as JSON for easy parsing
    $result = @{
        number = $num
        title = $title
        labels = @($issue.labels | ForEach-Object { $_.name })
    } | ConvertTo-Json

    Write-Output $result
    exit 0
}

Write-Host "`nAll issues are either WIP or blocked by dependencies."
exit 1
