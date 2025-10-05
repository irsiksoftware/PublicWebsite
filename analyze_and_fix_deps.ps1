# Analyze broken dependencies and create fix plan
$ErrorActionPreference = "Continue"

Write-Host "=== ANALYZING BROKEN DEPENDENCIES ===" -ForegroundColor Cyan
Write-Host ""

# Read broken deps
$brokenDeps = Get-Content "broken_description_deps.json" | ConvertFrom-Json

# Group by dependency number
$depGroups = $brokenDeps | Group-Object -Property DependsOn | Sort-Object Count -Descending

Write-Host "Unique dependencies needing placeholders:" -ForegroundColor Yellow
foreach ($group in $depGroups) {
    Write-Host "  Issue #$($group.Name): $($group.Count) issues depend on it" -ForegroundColor White
}

Write-Host ""
Write-Host "Getting sample issue titles for context..." -ForegroundColor Yellow
Write-Host ""

# For each unique dependency, get a sample issue that depends on it to understand context
$placeholdersNeeded = @()

foreach ($group in $depGroups) {
    $depNum = [int]$group.Name
    $sampleIssue = $group.Group[0].Issue

    # Get the sample issue title
    $issueData = & gh issue view $sampleIssue 2>&1 | Out-String

    if ($issueData -match 'Issue #\d+: (.+)') {
        $title = $matches[1].Trim()

        Write-Host "Dep #$depNum (needed by $($group.Count) issues):" -ForegroundColor Cyan
        Write-Host "  Sample dependent: #$sampleIssue - $title" -ForegroundColor White

        # Try to infer what the placeholder should be
        $placeholderTitle = "Placeholder: Dependency for issue #$sampleIssue"
        $placeholderBody = "Auto-created placeholder for missing dependency #$depNum`n`nReferenced by $($group.Count) issues`n`nSample dependent issue: #$sampleIssue - $title"

        $placeholdersNeeded += @{
            Number = $depNum
            Count = $group.Count
            SampleIssue = $sampleIssue
            SampleTitle = $title
            PlaceholderTitle = $placeholderTitle
            PlaceholderBody = $placeholderBody
        }
    }
    Write-Host ""
}

Write-Host "=== FIX PLAN ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Need to create $($placeholdersNeeded.Count) placeholder issues" -ForegroundColor Yellow
Write-Host ""

# Save the plan
$fixPlan = @{
    PlaceholdersNeeded = $placeholdersNeeded
    TotalBrokenDeps = $brokenDeps.Count
}

$fixPlan | ConvertTo-Json -Depth 10 | Out-File "fix_plan.json" -Encoding UTF8

Write-Host "Fix plan saved to fix_plan.json" -ForegroundColor Green
