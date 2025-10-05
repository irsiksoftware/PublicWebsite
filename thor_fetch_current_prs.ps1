$prs = & "C:\Program Files\GitHub CLI\gh.bat" pr list --state open --limit 100 --json number,title,headRefName,labels,statusCheckRollup,body | ConvertFrom-Json
$prs | ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 "thor_prs_current.json"
Write-Output "Fetched $($prs.Count) open PRs"
$prs | ConvertTo-Json -Depth 10
