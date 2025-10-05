$prs = gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup | ConvertFrom-Json
$prs | ConvertTo-Json -Depth 10 | Out-File -FilePath "pr_review_data.json" -Encoding utf8
$prs | ConvertTo-Json -Depth 10
