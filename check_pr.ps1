param($prNumber, $issueNumber)

# Get PR status
Write-Host "=== PR #$prNumber ===" -ForegroundColor Cyan
gh pr view $prNumber --json number,title,statusCheckRollup,body

# Get related issue
Write-Host "`n=== Issue #$issueNumber ===" -ForegroundColor Cyan
gh issue view $issueNumber --json number,title,state,labels,body
