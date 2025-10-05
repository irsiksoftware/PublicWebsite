$env:GH_PAGER = ""
gh pr list --repo irsiksoftware/TestForAI --state open --json number,title,mergeable,headRefName,isDraft,createdAt,updatedAt | Out-File -FilePath cyclops_prs.json -Encoding utf8
if ($LASTEXITCODE -eq 0) {
    Write-Host "PRs fetched successfully"
    Get-Content cyclops_prs.json
} else {
    Write-Host "Error fetching PRs: exit code $LASTEXITCODE"
}
