# Get all open issues using gh API
$issues = gh issue list --state open --limit 200 | ForEach-Object {
    if ($_ -match '#(\d+)\s+\[OPEN\]\s+\[(.*?)\]\s+(.*)') {
        $number = [int]$matches[1]
        $labels = $matches[2] -split ',\s*'
        $title = $matches[3]

        @{
            number = $number
            title = $title
            labels = $labels
        }
    }
}

# Priority mapping
$priorityOrder = @{
    'CRITICAL' = 0
    'URGENT' = 1
    'HIGH' = 2
    'MEDIUM' = 3
    'LOW' = 4
}

# Filter out WIP issues and sort by priority
$availableIssues = $issues | Where-Object {
    $_.labels -notcontains 'wip'
} | ForEach-Object {
    $priority = 5  # default
    foreach ($label in $_.labels) {
        if ($priorityOrder.ContainsKey($label)) {
            $priority = $priorityOrder[$label]
            break
        }
    }
    $_ | Add-Member -NotePropertyName priority -NotePropertyValue $priority -PassThru
} | Sort-Object priority, number

# Find first issue without open dependencies
foreach ($issue in $availableIssues) {
    # Check for WIP dependencies mentioned in description
    $description = (gh issue view $($issue.number) --json body | ConvertFrom-Json).body
    if ($description -match '(?:Depends on|depends on).*?#(\d+)') {
        $descDep = [int]$matches[1]
        try {
            $depData = gh issue view $descDep --json state,labels 2>&1 | ConvertFrom-Json
            if ($depData.state -ne 'CLOSED') {
                $isWip = $depData.labels | Where-Object { $_.name -eq 'wip' }
                if ($isWip) {
                    Write-Host "Skipping #$($issue.number) - blocked by WIP issue #$descDep"
                    continue
                }
            }
        } catch {
            Write-Host "Skipping #$($issue.number) - dependency #$descDep not found"
            continue
        }
    }

    $deps = $issue.labels | Where-Object { $_ -match '^d(\d+)$' } | ForEach-Object {
        [int]($_ -replace 'd', '')
    }

    if ($deps.Count -gt 0) {
        $allClosed = $true
        foreach ($dep in $deps) {
            $depState = (gh issue view $dep --json state | ConvertFrom-Json).state
            if ($depState -ne 'CLOSED') {
                Write-Host "Skipping #$($issue.number) - blocked by #$dep"
                $allClosed = $false
                break
            }
        }
        if (-not $allClosed) {
            continue
        }
    }

    # Found claimable issue
    $issue | ConvertTo-Json
    exit 0
}

Write-Host "No available issues found"
exit 1
