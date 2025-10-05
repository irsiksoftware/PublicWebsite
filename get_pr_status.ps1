$ErrorActionPreference = "Stop"
$output = gh pr list --state open --limit 100 --json number,title,mergeable,headRefName,isDraft,createdAt,commits
$output | Out-File -FilePath "pr_status_output.json" -Encoding UTF8
Write-Output $output
