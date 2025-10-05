# Fetch PRs using gh CLI with repo specification
$owner = "irsiksoftware"
$repo = "TestForAI"
$repoName = "$owner/$repo"

Write-Host "Fetching open PRs for $repoName..."

# Try to fetch PRs using gh CLI
$output = gh pr list --repo $repoName --state open --json number,title,mergeable,headRefName,isDraft,createdAt,author,url 2>&1

if ($LASTEXITCODE -eq 0) {
    $output | Out-File -FilePath "cyclops_gh_pr_data.json" -Encoding utf8
    Write-Host "PRs fetched successfully"
    Get-Content "cyclops_gh_pr_data.json"
} else {
    Write-Host "Error fetching PRs: $output"
    # Try without --json to see what PRs exist
    Write-Host "`nTrying alternative format..."
    gh pr list --repo $repoName --state open
}
