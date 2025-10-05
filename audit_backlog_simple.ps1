# Backlog Health Audit Script
$ErrorActionPreference = "Continue"
$gh = "C:\Program Files\GitHub CLI\gh-real.exe"

Write-Host "Fetching open issues..."
$issuesJson = & $gh issue list --state open --limit 200 --json number,title,labels
$issues = $issuesJson | ConvertFrom-Json

Write-Host "Found $($issues.Count) open issues"

$brokenDeps = @()
$missingPriority = @()
$missingType = @()

$priorityLabels = @("CRITICAL", "URGENT", "HIGH", "MEDIUM", "LOW")

foreach ($issue in $issues) {
    $issueNum = $issue.number
    $title = $issue.title
    $labels = $issue.labels | ForEach-Object { $_.name }

    Write-Host "Processing #$issueNum..."

    # Check dependency labels
    $depLabels = $labels | Where-Object { $_ -match '^d\d+$' }

    foreach ($depLabel in $depLabels) {
        $depNumber = $depLabel -replace '^d', ''
        Write-Host "  Checking dependency: #$depNumber"

        $checkResult = & $gh issue view $depNumber --json number 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "    BROKEN: #$depNumber missing!" -ForegroundColor Red
            $brokenDeps += @{ Issue = $issueNum; BrokenDep = $depNumber; DepLabel = $depLabel }
        }
    }

    # Check priority
    $issuePriorities = $labels | Where-Object { $priorityLabels -contains $_ }
    if ($issuePriorities.Count -eq 0) {
        Write-Host "  Missing priority" -ForegroundColor Yellow
        $missingPriority += $issueNum
    }

    # Check type
    $needsFeature = $title -match '\b(feature|add|create|implement|build)\b'
    $hasFeature = $labels -contains "feature"
    if ($needsFeature -and -not $hasFeature) {
        $missingType += @{ Issue = $issueNum; Type = "feature" }
    }
}

$results = @{
    TotalIssues = $issues.Count
    BrokenDependencies = $brokenDeps
    MissingPriority = $missingPriority
    MissingType = $missingType
}

$results | ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 "audit_results.json"

Write-Host "`nAUDIT COMPLETE"
Write-Host "Broken Dependencies: $($brokenDeps.Count)"
Write-Host "Missing Priority: $($missingPriority.Count)"
Write-Host "Missing Type: $($missingType.Count)"
