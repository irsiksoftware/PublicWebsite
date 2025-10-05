# Fetch all open issues with full label data
# First get issues (not PRs)
$allItems = & "C:\Program Files\GitHub CLI\gh.bat" api 'repos/:owner/:repo/issues' --paginate | ConvertFrom-Json
$issues = $allItems | Where-Object { $_.state -eq 'open' -and $null -eq $_.pull_request }

# Parse and structure data
$structured = $issues | ForEach-Object {
    $labelNames = $_.labels | ForEach-Object { $_.name }

    [PSCustomObject]@{
        number = $_.number
        title = $_.title
        state = $_.state
        labels = $labelNames
        is_pr = $null -ne $_.pull_request
    }
}

# Output as JSON
$structured | ConvertTo-Json -Depth 10 | Out-File "issues_structured.json" -Encoding UTF8
Write-Host "Fetched $($structured.Count) open items"
