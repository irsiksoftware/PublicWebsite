$env:NO_COLOR = "1"
$env:GH_NO_COLOR = "1"
$output = gh pr list --state open --json number,title,headRefName,labels,statusCheckRollup,body 2>&1
$output
