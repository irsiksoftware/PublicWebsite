$prs = & "C:\Program Files\GitHub CLI\gh.bat" pr list --state open --json number,title,mergeable,headRefName,isDraft,createdAt --limit 100 | ConvertFrom-Json
$prs | ConvertTo-Json -Depth 10 | Out-File -FilePath "cyclops_current_prs_tactical.json" -Encoding UTF8
Write-Host "Fetched $($prs.Count) open PRs"
$prs | ForEach-Object { Write-Host "PR #$($_.number): $($_.title) - Mergeable: $($_.mergeable)" }
