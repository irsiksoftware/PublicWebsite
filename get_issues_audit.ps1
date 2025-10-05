$issues = gh issue list --state open --json number,title,labels,state --limit 1000 | ConvertFrom-Json

foreach ($issue in $issues) {
    $labels = ($issue.labels | ForEach-Object { $_.name }) -join ','
    Write-Output "$($issue.number)|$($issue.title)|$labels|$($issue.state)"
}
