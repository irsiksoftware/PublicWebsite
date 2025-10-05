# Fetch open PRs with GitHub CLI
$env:GH_PAGER = ""
gh pr list --state open --json number,title,mergeable,headRefName,isDraft,createdAt,commits --limit 100 | Out-File -FilePath "cyclops_prs_data.json" -Encoding utf8
Get-Content "cyclops_prs_data.json"
