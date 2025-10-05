gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body | Out-File -FilePath "prs_bruce_raw.json" -Encoding utf8
