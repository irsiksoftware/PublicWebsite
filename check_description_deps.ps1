# Check for dependencies mentioned in issue descriptions
$ErrorActionPreference = "Continue"

Write-Host "=== CHECKING DESCRIPTION DEPENDENCIES ===" -ForegroundColor Cyan
Write-Host ""

# Get all open issues
$issuesRaw = & gh issue list --state open --limit 1000
$issues = @()

foreach ($line in $issuesRaw) {
    if ($line -match '^#(\d+)') {
        $number = [int]$matches[1]
        $issues += $number
    }
}

Write-Host "Checking $($issues.Count) issues for dependencies in descriptions..." -ForegroundColor Yellow
Write-Host ""

$brokenDescriptionDeps = @()

foreach ($issueNum in $issues) {
    # Get the issue body
    $bodyRaw = & gh issue view $issueNum --json body 2>&1 | Out-String

    # Look for "Depends on: #XX" or similar patterns
    if ($bodyRaw -match 'Depends on.*?#(\d+)') {
        $depNum = [int]$matches[1]

        Write-Host "Issue #$issueNum mentions dependency on #$depNum..." -NoNewline

        # Check if that issue exists
        $depCheck = & gh issue view $depNum --json number 2>&1 | Out-String

        if ($depCheck -match 'Could not resolve') {
            Write-Host " BROKEN" -ForegroundColor Red
            $brokenDescriptionDeps += @{
                Issue = $issueNum
                DependsOn = $depNum
            }
        } else {
            Write-Host " OK" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "=== RESULTS ===" -ForegroundColor Cyan
Write-Host "Broken description dependencies: $($brokenDescriptionDeps.Count)" -ForegroundColor $(if ($brokenDescriptionDeps.Count -gt 0) { 'Red' } else { 'Green' })

if ($brokenDescriptionDeps.Count -gt 0) {
    Write-Host ""
    Write-Host "BROKEN:" -ForegroundColor Red
    foreach ($dep in $brokenDescriptionDeps) {
        Write-Host "  Issue #$($dep.Issue) -> #$($dep.DependsOn)" -ForegroundColor Red
    }
}

$brokenDescriptionDeps | ConvertTo-Json -Depth 10 | Out-File "broken_description_deps.json" -Encoding UTF8
