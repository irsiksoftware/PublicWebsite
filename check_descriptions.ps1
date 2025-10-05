# Check issue descriptions for dependency references
$gh = 'C:\Program Files\GitHub CLI\gh.bat'
$issues = 77..138

Write-Host "=== CHECKING ISSUE DESCRIPTIONS FOR DEPENDENCIES ===" -ForegroundColor Cyan

$foundDeps = @()

foreach ($num in $issues) {
    $json = & $gh api "/repos/irsiksoftware/TestForAI/issues/$num" 2>&1 | ConvertFrom-Json
    $body = $json.body
    if ($null -eq $body) { continue }

    # Replace literal \n with actual newlines
    $body = $body -replace '\\n', "`n"

    $labels = $json.labels | Select-Object -ExpandProperty name
    $depLabels = $labels | Where-Object { $_ -match '^d\d+$' }

    # Search for any #number references
    $matches = [regex]::Matches($body, '#(\d+)')
    if ($matches.Count -gt 0) {
        $referencedIssues = $matches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique

        foreach ($ref in $referencedIssues) {
            $expectedLabel = "d$ref"
            if ($depLabels -notcontains $expectedLabel) {
                Write-Host "Issue #$num references #$ref but missing label '$expectedLabel'" -ForegroundColor Yellow
                Write-Host "  Context: $($body -split "`n" | Where-Object { $_ -match "#$ref" } | Select-Object -First 1)" -ForegroundColor Gray
                $foundDeps += [PSCustomObject]@{
                    Issue = $num
                    ReferencedIssue = $ref
                    MissingLabel = $expectedLabel
                }
            }
        }
    }
}

Write-Host "`nFound $($foundDeps.Count) missing dependency labels" -ForegroundColor $(if ($foundDeps.Count -gt 0) { 'Yellow' } else { 'Green' })
$foundDeps | Format-Table -AutoSize

$foundDeps | ConvertTo-Json | Out-File "C:\Code\TestForAI\missing_dep_labels.json"
