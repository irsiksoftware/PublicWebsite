# Get repository info
$repo = gh repo view --json nameWithOwner | ConvertFrom-Json
$repoName = $repo.nameWithOwner

# Get open PRs using API
$prsJson = gh api "repos/$repoName/pulls?state=open&per_page=100"
$prs = $prsJson | ConvertFrom-Json

Write-Host "Found $($prs.Count) open PRs"
$prs | ConvertTo-Json -Depth 10 | Out-File -FilePath "pr_review_data.json" -Encoding utf8

# Display PR info
foreach ($pr in $prs) {
    Write-Host "PR #$($pr.number): $($pr.title)"

    # Get PR status checks
    $checks = gh api "repos/$repoName/commits/$($pr.head.sha)/check-runs" | ConvertFrom-Json
    $pr | Add-Member -NotePropertyName "checkRuns" -NotePropertyValue $checks.check_runs -Force
}

$prs | ConvertTo-Json -Depth 10
