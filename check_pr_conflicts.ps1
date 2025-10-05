# PR branches to check
$prBranches = @(
    @{Number=148; Branch="feature/issue-81"},
    @{Number=147; Branch="feature/issue-80"},
    @{Number=146; Branch="feature/issue-77"}
)

$results = @()

foreach ($pr in $prBranches) {
    Write-Host "Checking PR #$($pr.Number) - $($pr.Branch)..." -ForegroundColor Cyan

    # Try to merge-test against main
    git checkout main 2>&1 | Out-Null
    git pull origin main 2>&1 | Out-Null

    $mergeTest = git merge --no-commit --no-ff "origin/$($pr.Branch)" 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        $status = "CONFLICTING"
        Write-Host "  Status: CONFLICTING" -ForegroundColor Red
    } else {
        $status = "MERGEABLE"
        Write-Host "  Status: MERGEABLE" -ForegroundColor Green
    }

    # Abort the merge test
    git merge --abort 2>&1 | Out-Null

    $results += [PSCustomObject]@{
        PR = $pr.Number
        Branch = $pr.Branch
        Status = $status
    }
}

# Return to current branch
git checkout feature/issue-86 2>&1 | Out-Null

$results | ConvertTo-Json
