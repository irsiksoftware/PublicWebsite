$prs = Invoke-RestMethod -Uri 'https://api.github.com/repos/irsiksoftware/TestForAI/pulls?state=open' -Headers @{Accept='application/vnd.github.v3+json'}

$prData = $prs | ForEach-Object {
    [PSCustomObject]@{
        number = $_.number
        title = $_.title
        mergeable_state = $_.mergeable_state
        headRef = $_.head.ref
        isDraft = $_.draft
        created_at = $_.created_at
    }
}

$prData | ConvertTo-Json
