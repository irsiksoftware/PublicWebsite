# Define priority order
$priorityOrder = @{
    'CRITICAL' = 1
    'URGENT' = 2
    'HIGH' = 3
    'MEDIUM' = 4
    'LOW' = 5
}

# Get issues manually based on the earlier list
# HIGH priority issues without WIP (oldest first based on issue numbers)
$highIssues = @(80, 81, 86, 88, 94, 101, 104, 112, 113, 115, 117, 119, 122, 124, 125, 129, 133)

Write-Host "Checking HIGH priority issues for availability..."

foreach ($issueNum in $highIssues) {
    Write-Host "`nChecking issue #$issueNum..."

    # Get issue details
    $issueJson = gh issue view $issueNum --json number,title,labels,body,state 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Error fetching issue #$issueNum"
        continue
    }

    $issue = $issueJson | ConvertFrom-Json

    # Check if has WIP label (safety check)
    $hasWip = $issue.labels | Where-Object { $_.name -eq 'wip' }
    if ($hasWip) {
        Write-Host "  SKIP: Has WIP label"
        continue
    }

    # Check for dependencies in body
    if ($issue.body -match 'Depends on.*#(\d+)') {
        $depNum = $matches[1]
        Write-Host "  Found dependency: #$depNum"

        # Check if dependency is closed
        $depCheck = gh issue view $depNum --json state 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dep = $depCheck | ConvertFrom-Json
            if ($dep.state -eq 'OPEN') {
                Write-Host "  SKIP: Blocked by open issue #$depNum"
                continue
            } else {
                Write-Host "  Dependency #$depNum is CLOSED - OK"
            }
        } else {
            Write-Host "  Dependency #$depNum not found (may be deleted/closed) - OK to proceed"
        }
    }

    # This issue is available!
    Write-Host "`n=== FOUND AVAILABLE ISSUE ==="
    Write-Host "Issue #$($issue.number): $($issue.title)"
    Write-Host "Labels: $($issue.labels.name -join ', ')"
    Write-Host "=============================="
    Write-Output $issue.number
    exit 0
}

Write-Host "`nNo available HIGH priority issues found. Check MEDIUM priority..."

# MEDIUM priority issues without WIP
$mediumIssues = @(82, 83, 84, 85, 87, 89, 91, 93, 96, 97, 99, 102, 103, 105, 106, 109, 110, 114, 116, 118, 120, 121, 126, 127, 130, 131, 132)

foreach ($issueNum in $mediumIssues) {
    Write-Host "`nChecking issue #$issueNum..."

    $issueJson = gh issue view $issueNum --json number,title,labels,body,state 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Error fetching issue #$issueNum"
        continue
    }

    $issue = $issueJson | ConvertFrom-Json

    $hasWip = $issue.labels | Where-Object { $_.name -eq 'wip' }
    if ($hasWip) {
        Write-Host "  SKIP: Has WIP label"
        continue
    }

    if ($issue.body -match 'Depends on.*#(\d+)') {
        $depNum = $matches[1]
        Write-Host "  Found dependency: #$depNum"

        $depCheck = gh issue view $depNum --json state 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dep = $depCheck | ConvertFrom-Json
            if ($dep.state -eq 'OPEN') {
                Write-Host "  SKIP: Blocked by open issue #$depNum"
                continue
            } else {
                Write-Host "  Dependency #$depNum is CLOSED - OK"
            }
        } else {
            Write-Host "  Dependency #$depNum not found (may be deleted) - OK to proceed"
        }
    }

    Write-Host "`n=== FOUND AVAILABLE ISSUE ==="
    Write-Host "Issue #$($issue.number): $($issue.title)"
    Write-Host "Labels: $($issue.labels.name -join ', ')"
    Write-Host "=============================="
    Write-Output $issue.number
    exit 0
}

Write-Host "`nNo available issues found."
exit 1
