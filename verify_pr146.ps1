git checkout main 2>&1 | Out-Null
git pull origin main 2>&1 | Out-Null

$mergeTest = git merge --no-commit --no-ff origin/feature/issue-77 2>&1
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "PR #146 is now MERGEABLE" -ForegroundColor Green
    git merge --abort 2>&1 | Out-Null
} else {
    Write-Host "PR #146 still has conflicts:" -ForegroundColor Red
    Write-Host $mergeTest
    git merge --abort 2>&1 | Out-Null
}
