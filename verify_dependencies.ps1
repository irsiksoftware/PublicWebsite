# Verify which referenced dependencies exist
$gh = 'C:\Program Files\GitHub CLI\gh.bat'

# Get unique referenced issues
$referencedIssues = @(1, 2, 3, 4, 6, 8, 10, 11, 13, 16, 22, 24, 26, 29, 30, 32, 38, 46, 50, 51, 52, 54)

Write-Host "=== VERIFYING DEPENDENCY ISSUES ===" -ForegroundColor Cyan

$deleted = @()
$open = @()
$closed = @()

foreach ($num in $referencedIssues) {
    Write-Host "Checking issue #$num... " -NoNewline
    $result = & $gh api "/repos/irsiksoftware/TestForAI/issues/$num" 2>&1

    if ($result -match "deleted" -or $result -match "Not Found") {
        Write-Host "DELETED" -ForegroundColor Red
        $deleted += $num
    } else {
        $json = $result | ConvertFrom-Json
        if ($json.state -eq "open") {
            Write-Host "EXISTS (OPEN)" -ForegroundColor Green
            $open += $num
        } else {
            Write-Host "EXISTS (CLOSED)" -ForegroundColor Yellow
            $closed += $num
        }
    }
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Deleted issues: $($deleted.Count) - $($deleted -join ', ')" -ForegroundColor Red
Write-Host "Open issues: $($open.Count) - $($open -join ', ')" -ForegroundColor Green
Write-Host "Closed issues: $($closed.Count) - $($closed -join ', ')" -ForegroundColor Yellow

[PSCustomObject]@{
    Deleted = $deleted
    Open = $open
    Closed = $closed
} | ConvertTo-Json | Out-File "C:\Code\TestForAI\dependency_status.json"
