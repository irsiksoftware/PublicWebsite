# Get repository info
$repoOutput = & gh repo view --json nameWithOwner
$repo = $repoOutput | ConvertFrom-Json
$repoName = $repo.nameWithOwner

Write-Host "Repository: $repoName"

# Get open PRs using API
$prsOutput = & gh api "repos/$repoName/pulls" -X GET -F state=open -F per_page=100
$prs = $prsOutput | ConvertFrom-Json

Write-Host "Found $($prs.Count) open PRs"

# Create array to store PR details
$prDetails = @()

foreach ($pr in $prs) {
    Write-Host "`nProcessing PR #$($pr.number): $($pr.title)"

    # Get status checks
    $statusOutput = & gh api "repos/$repoName/commits/$($pr.head.sha)/status"
    $status = $statusOutput | ConvertFrom-Json

    # Get check runs
    $checksOutput = & gh api "repos/$repoName/commits/$($pr.head.sha)/check-runs"
    $checkRuns = $checksOutput | ConvertFrom-Json

    # Get PR labels
    $labels = $pr.labels | ForEach-Object { $_.name }

    $prDetail = @{
        number = $pr.number
        title = $pr.title
        headRefName = $pr.head.ref
        labels = $labels
        state = $pr.state
        statusState = $status.state
        checkRuns = $checkRuns.check_runs
        body = $pr.body
    }

    $prDetails += $prDetail
}

# Save to file
$prDetails | ConvertTo-Json -Depth 10 | Out-File -FilePath "pr_review_data.json" -Encoding utf8

# Output to console
$prDetails | ConvertTo-Json -Depth 10
