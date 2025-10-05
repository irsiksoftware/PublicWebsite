$prs = gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,createdAt,body | ConvertFrom-Json
$prs | ConvertTo-Json -Depth 10 | Out-File -FilePath "current_open_prs.json" -Encoding utf8
Write-Host "Fetched $($prs.Count) open PRs"
