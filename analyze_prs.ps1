$ErrorActionPreference = "Stop"

# Get open PRs via API
$prsJson = gh api "repos/irsiksoftware/TestForAI/pulls?state=open&per_page=100"
$prs = $prsJson | ConvertFrom-Json

# Parse and analyze each PR
$results = @()
foreach ($pr in $prs) {
    # Calculate age in hours
    $createdAt = [DateTime]::Parse($pr.created_at)
    $ageHours = ([DateTime]::UtcNow - $createdAt).TotalHours

    $prInfo = @{
        number = $pr.number
        title = $pr.title
        headRef = $pr.head.ref
        mergeable = if ($pr.mergeable -eq $null) { "UNKNOWN" } else { if ($pr.mergeable) { "MERGEABLE" } else { "CONFLICTING" } }
        isDraft = $pr.draft
        ageHours = [Math]::Round($ageHours, 2)
        createdAt = $pr.created_at
        updatedAt = $pr.updated_at
    }
    $results += $prInfo
}

# Output results as JSON
$results | ConvertTo-Json | Out-File -FilePath "pr_analysis.json" -Encoding UTF8

# Also output summary
Write-Output "=== PR Analysis Summary ==="
Write-Output ""
foreach ($pr in $results) {
    Write-Output "PR #$($pr.number): $($pr.title)"
    Write-Output "  Branch: $($pr.headRef)"
    Write-Output "  Status: $($pr.mergeable)"
    Write-Output "  Age: $($pr.ageHours) hours"
    Write-Output "  Draft: $($pr.isDraft)"
    Write-Output ""
}
