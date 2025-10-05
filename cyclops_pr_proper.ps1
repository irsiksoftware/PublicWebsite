# Cyclops PR Fetcher - Force JSON output from gh CLI
$ErrorActionPreference = "Stop"
$repo = "irsiksoftware/TestForAI"

# Disable paging and get JSON
$env:PAGER = ""
$env:GH_PAGER = ""

# Fetch PRs - use Start-Process to avoid pager issues
$prJson = & gh pr list --repo $repo --state open --limit 100 `
    --json number,title,mergeable,headRefName,isDraft,createdAt,author,url,updatedAt `
    | Out-String

# Check if we got JSON
if ($prJson -match '^\s*\[') {
    Write-Host "Got JSON output!"
    $prJson | Out-File -FilePath "cyclops_final_prs.json" -Encoding utf8 -NoNewline

    # Parse and display
    $prs = $prJson | ConvertFrom-Json
    Write-Host "Found $($prs.Count) open PRs`n"

    foreach ($pr in $prs) {
        Write-Host "PR #$($pr.number): $($pr.title)"
        Write-Host "  Branch: $($pr.headRefName)"
        Write-Host "  Mergeable: $($pr.mergeable)"
        Write-Host "  Draft: $($pr.isDraft)"
        Write-Host "  Created: $($pr.createdAt)"
        Write-Host "  Updated: $($pr.updatedAt)"
        Write-Host ""
    }
} else {
    Write-Host "Did not get JSON output. Got:"
    Write-Host $prJson
}
