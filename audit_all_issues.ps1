# Backlog Health Audit Script
# Checks all open issues for dependencies, priorities, and labels

$auditResults = @{
    brokenDependencies = @()
    missingPriority = @()
    missingTypeLabels = @()
    multiplePriorities = @()
    allIssues = @()
}

Write-Host "=== AUDIT PHASE ==="
Write-Host "Fetching all open issues..."

# Get all open issue numbers
$openIssues = gh issue list --state open --limit 1000 | ForEach-Object {
    if ($_ -match '#(\d+)') {
        [int]$matches[1]
    }
}

Write-Host "Found $($openIssues.Count) open issues"
Write-Host ""

foreach ($issueNum in $openIssues) {
    Write-Host "Checking issue #$issueNum..."

    # Get full issue details
    $issueJson = gh issue view $issueNum --json number,title,labels,body,state | ConvertFrom-Json

    $issueData = @{
        number = $issueNum
        title = $issueJson.title
        labels = $issueJson.labels.name
        body = $issueJson.body
        dependencies = @()
        priorityLabels = @()
        typeLabels = @()
    }

    # Extract dependency labels (d1, d2, d3, etc)
    $depLabels = $issueJson.labels | Where-Object { $_.name -match '^d(\d+)$' }
    foreach ($depLabel in $depLabels) {
        if ($depLabel.name -match '^d(\d+)$') {
            $depNum = [int]$matches[1]
            $issueData.dependencies += @{
                label = $depLabel.name
                number = $depNum
                exists = $false
            }
        }
    }

    # Check if dependencies exist
    foreach ($dep in $issueData.dependencies) {
        try {
            $depIssue = gh issue view $dep.number --json number,state 2>&1
            if ($LASTEXITCODE -eq 0) {
                $dep.exists = $true
            } else {
                $dep.exists = $false
                $auditResults.brokenDependencies += @{
                    issue = $issueNum
                    dependency = $dep.number
                    label = $dep.label
                }
                Write-Host "  ⚠️  BROKEN DEPENDENCY: #$issueNum depends on non-existent #$($dep.number)"
            }
        } catch {
            $dep.exists = $false
            $auditResults.brokenDependencies += @{
                issue = $issueNum
                dependency = $dep.number
                label = $dep.label
            }
            Write-Host "  ⚠️  BROKEN DEPENDENCY: #$issueNum depends on non-existent #$($dep.number)"
        }
    }

    # Check priority labels
    $priorityLabels = @('CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW')
    $issuePriorities = $issueJson.labels | Where-Object { $_.name -in $priorityLabels }
    $issueData.priorityLabels = $issuePriorities.name

    if ($issuePriorities.Count -eq 0) {
        $auditResults.missingPriority += $issueNum
        Write-Host "  ⚠️  MISSING PRIORITY: #$issueNum has no priority label"
    } elseif ($issuePriorities.Count -gt 1) {
        $auditResults.multiplePriorities += @{
            issue = $issueNum
            priorities = $issuePriorities.name
        }
        Write-Host "  ⚠️  MULTIPLE PRIORITIES: #$issueNum has $($issuePriorities.Count) priority labels"
    }

    # Check type labels based on title keywords
    $title = $issueJson.title.ToLower()
    $hasTestingLabel = $issueJson.labels.name -contains 'testing'
    $hasBugLabel = $issueJson.labels.name -contains 'bug'
    $hasFeatureLabel = $issueJson.labels.name -contains 'feature'

    if (($title -match 'test|testing') -and -not $hasTestingLabel) {
        $auditResults.missingTypeLabels += @{
            issue = $issueNum
            missingLabel = 'testing'
        }
        Write-Host "  ⚠️  MISSING LABEL: #$issueNum should have 'testing' label"
    }

    if (($title -match 'bug|fix|error') -and -not $hasBugLabel) {
        $auditResults.missingTypeLabels += @{
            issue = $issueNum
            missingLabel = 'bug'
        }
        Write-Host "  ⚠️  MISSING LABEL: #$issueNum should have 'bug' label"
    }

    if (($title -match 'feature|add|create|implement|build|design') -and -not $hasFeatureLabel) {
        $auditResults.missingTypeLabels += @{
            issue = $issueNum
            missingLabel = 'feature'
        }
        Write-Host "  ⚠️  MISSING LABEL: #$issueNum should have 'feature' label"
    }

    $auditResults.allIssues += $issueData
}

Write-Host ""
Write-Host "=== AUDIT SUMMARY ==="
Write-Host "Total Issues: $($openIssues.Count)"
Write-Host "Broken Dependencies: $($auditResults.brokenDependencies.Count)"
Write-Host "Missing Priority Labels: $($auditResults.missingPriority.Count)"
Write-Host "Multiple Priorities: $($auditResults.multiplePriorities.Count)"
Write-Host "Missing Type Labels: $($auditResults.missingTypeLabels.Count)"
Write-Host ""

# Save results
$auditResults | ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 backlog_audit_results.json

Write-Host "Audit results saved to backlog_audit_results.json"
