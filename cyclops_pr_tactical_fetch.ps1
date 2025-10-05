# Fetch open PRs using gh cli
$prListRaw = & "C:\Program Files\GitHub CLI\gh.bat" pr list --state open --limit 100
Write-Host "Raw PR List:"
Write-Host $prListRaw

# Parse PR numbers from the output
$prNumbers = @()
$prListRaw -split "`n" | ForEach-Object {
    if ($_ -match '^\#(\d+)') {
        $prNumbers += $matches[1]
    }
}

Write-Host "`nFound $($prNumbers.Count) open PRs: $($prNumbers -join ', ')"

# For each PR, get detailed info
$prDetails = @()
foreach ($prNum in $prNumbers) {
    Write-Host "`nFetching details for PR #$prNum..."
    $prJson = & "C:\Program Files\GitHub CLI\gh.bat" pr view $prNum --json number,title,mergeable,headRefName,isDraft,createdAt,updatedAt,state
    $prObj = $prJson | ConvertFrom-Json
    $prDetails += $prObj
    Write-Host "  PR #$($prObj.number): $($prObj.title)"
    Write-Host "  Mergeable: $($prObj.mergeable)"
    Write-Host "  Branch: $($prObj.headRefName)"
    Write-Host "  Created: $($prObj.createdAt)"
}

# Save to file
$prDetails | ConvertTo-Json -Depth 10 | Out-File -FilePath "cyclops_current_prs_tactical.json" -Encoding UTF8
Write-Host "`nSaved PR details to cyclops_current_prs_tactical.json"
