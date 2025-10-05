$output = & "C:\Program Files\GitHub CLI\gh.bat" pr list --state open --json number,title,mergeable,headRefName,isDraft,createdAt
Write-Host "Raw output:"
Write-Host $output
Write-Host ""
Write-Host "Output type: $($output.GetType().Name)"
$output | Out-File "gh_raw_output.txt"
