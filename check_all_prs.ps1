# Check all PRs
Write-Host "=== All PRs ==="
gh pr list --json number,title,state,headRefName
Write-Host "`n=== Open PRs ==="
gh pr list --state open --json number,title,state,headRefName
Write-Host "`n=== Merged PRs (last 5) ==="
gh pr list --state merged --limit 5 --json number,title,state
Write-Host "`n=== Closed PRs (last 5) ==="
gh pr list --state closed --limit 5 --json number,title,state
