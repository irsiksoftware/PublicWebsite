$env:GH_PAGER = ""
gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup --limit 100
