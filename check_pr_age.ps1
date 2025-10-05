$now = Get-Date
$created = [DateTime]::Parse('2025-10-05T16:07:12Z')
$age = ($now - $created).TotalHours
Write-Output "PR #168 age: $age hours"
