$env:GH_PAGER = ""

Write-Host "=== Checking All PRs (open and closed) ==="
gh pr list --repo irsiksoftware/TestForAI --state all --limit 10

Write-Host "`n=== Checking Open PRs Only ==="
gh pr list --repo irsiksoftware/TestForAI --state open

Write-Host "`n=== Fetching JSON Data ==="
$jsonData = gh pr list --repo irsiksoftware/TestForAI --state open --json number,title,mergeable,headRefName,isDraft,createdAt,updatedAt
Write-Host "JSON Result: $jsonData"

if ([string]::IsNullOrWhiteSpace($jsonData) -or $jsonData -eq "[]") {
    Write-Host "`nNo open PRs found."
} else {
    $jsonData | Out-File -FilePath cyclops_prs_real.json -Encoding utf8
    Write-Host "`nPR data saved to cyclops_prs_real.json"
}
