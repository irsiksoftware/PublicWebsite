# Backlog Audit Script
$gh = "C:\Program Files\GitHub CLI\gh.bat"
$issues = 77..138

$auditResults = @()

foreach ($num in $issues) {
    Write-Host "Checking issue #$num..." -NoNewline
    $output = & $gh issue view $num --json labels 2>&1 | Out-String

    if ($output -match '"labels":\s*\[(.*?)\]') {
        # Parse labels from JSON
        $labelSection = $matches[1]
        $labelNames = @()

        if ($labelSection -match '"name"') {
            $labelMatches = [regex]::Matches($labelSection, '"name":\s*"([^"]+)"')
            foreach ($match in $labelMatches) {
                $labelNames += $match.Groups[1].Value
            }
        }

        $labelString = $labelNames -join ","
        Write-Host " [$labelString]"

        $auditResults += [PSCustomObject]@{
            Number = $num
            Labels = $labelString
            LabelArray = $labelNames
        }
    } else {
        Write-Host " ERROR"
    }
}

Write-Host "`n=== AUDIT RESULTS ==="
$auditResults | Format-Table Number, Labels -AutoSize
$auditResults | ConvertTo-Json | Out-File "C:\Code\TestForAI\audit_results.json"
