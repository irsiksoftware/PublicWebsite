# FIX DEPENDENCY LABELS SCRIPT
$gh = "C:\Program Files\GitHub CLI\gh.bat"

# Mapping of issues to their dependencies (extracted from audit)
$dependencyMap = @{
    138 = @(38)
    137 = @(38)
    136 = @(38)
    135 = @(38)
    134 = @(38)
    133 = @(38)
    132 = @(38)
    131 = @(38)
    130 = @(38)
    129 = @(38)
    128 = @(54)
    127 = @(50)
    126 = @(52)
    125 = @(51)
    124 = @(50)
    123 = @(38)
    122 = @(38)
    121 = @(38)
    120 = @(38)
    119 = @(38)
    118 = @(38)
    117 = @(38)
    116 = @(38)
    115 = @(38)
    114 = @(38)
    113 = @(38)
    112 = @(38)
    111 = @(2)
    110 = @(2)
    109 = @(3)
    108 = @(2)
    107 = @(13)
    106 = @(16)
    105 = @(2)
    104 = @(1)
    103 = @(2)
    102 = @(4)
    101 = @(2)
    100 = @(3)
    99 = @(6)
    98 = @(2)
    97 = @(2)
    96 = @(3)
    95 = @(2)
    94 = @(10)
    93 = @(11)
    92 = @(13)
    91 = @(2)
    90 = @(2)
    89 = @(8)
    88 = @(3)
    87 = @(3)
    86 = @(1)
    85 = @(2)
    84 = @(3)
    83 = @(8)
    82 = @(1)
    81 = @(3)
    80 = @(6)
    79 = @(2)
    78 = @(4)
}

$fixed = 0
$failed = @()

Write-Host "=== FIXING DEPENDENCY LABELS ===" -ForegroundColor Cyan

foreach ($issueNum in $dependencyMap.Keys | Sort-Object) {
    $deps = $dependencyMap[$issueNum]

    foreach ($dep in $deps) {
        $label = "d$dep"

        Write-Host "Adding label '$label' to issue #$issueNum..." -ForegroundColor Gray

        $result = & $gh issue edit $issueNum --add-label $label 2>&1
        $resultText = $result -join "`n"

        if ($resultText -match 'error' -or $resultText -match 'failed') {
            Write-Host "  ❌ FAILED: $resultText" -ForegroundColor Red
            $failed += [PSCustomObject]@{
                Issue = $issueNum
                Label = $label
                Error = $resultText
            }
        }
        else {
            Write-Host "  ✅ Added $label to #$issueNum" -ForegroundColor Green
            $fixed++
        }

        Start-Sleep -Milliseconds 100  # Rate limiting
    }
}

Write-Host "`n=== FIX SUMMARY ===" -ForegroundColor Cyan
Write-Host "Successfully added: $fixed dependency labels" -ForegroundColor Green
Write-Host "Failed: $($failed.Count) labels" -ForegroundColor $(if ($failed.Count -gt 0) { 'Red' } else { 'Green' })

if ($failed.Count -gt 0) {
    Write-Host "`nFailed labels:" -ForegroundColor Red
    $failed | Format-Table -AutoSize
}

# Save results
$results = @{
    Fixed = $fixed
    Failed = $failed
}

$results | ConvertTo-Json -Depth 10 | Out-File "fix_results.json"
Write-Host "`nResults saved to fix_results.json" -ForegroundColor Green
