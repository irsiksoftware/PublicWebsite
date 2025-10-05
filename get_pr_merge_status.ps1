$ErrorActionPreference = "Stop"

# Get open PRs
$prs = & "C:\Program Files\GitHub CLI\gh.bat" pr list --state open --json number,title,mergeable,headRefName,isDraft,createdAt | ConvertFrom-Json

# Output PR info
$prs | ForEach-Object {
    Write-Host "PR #$($_.number): $($_.title)"
    Write-Host "  Branch: $($_.headRefName)"
    Write-Host "  Mergeable: $($_.mergeable)"
    Write-Host "  IsDraft: $($_.isDraft)"
    Write-Host "  Created: $($_.createdAt)"
    Write-Host ""
}

# Save to JSON
$prs | ConvertTo-Json -Depth 10 | Out-File "pr_merge_status.json"
Write-Host "Saved to pr_merge_status.json"
