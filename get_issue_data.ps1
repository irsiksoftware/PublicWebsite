$issueNum = $args[0]
$env:NO_COLOR = "1"
$output = gh issue view $issueNum --json labels,state,number 2>&1 | Out-String
$output | Out-File -FilePath "issue_temp_$issueNum.json" -Encoding UTF8
Get-Content "issue_temp_$issueNum.json"
