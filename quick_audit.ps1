$issues = gh issue list --state open --limit 1000 | ForEach-Object { if ($_ -match '#(\d+)') { [int]$matches[1] } }
Write-Host "Total issues: $($issues.Count)"
$noPriority = @()
$broken = @()
foreach ($num in $issues) {
    $issue = gh api repos/irsiksoftware/TestForAI/issues/$num | ConvertFrom-Json
    $labels = $issue.labels.name
    $priorities = $labels | Where-Object { $_ -in @('CRITICAL','URGENT','HIGH','MEDIUM','LOW') }
    if ($priorities.Count -eq 0) {
        $noPriority += $num
        Write-Host "#$num missing priority" -ForegroundColor Yellow
    }
    $deps = $labels | Where-Object { $_ -match '^d(\d+)$' }
    foreach ($dep in $deps) {
        if ($dep -match '^d(\d+)$') {
            $depNum = [int]$matches[1]
            $null = gh api repos/irsiksoftware/TestForAI/issues/$depNum 2>&1
            if ($LASTEXITCODE -ne 0) {
                $broken += "#$num -> #$depNum"
                Write-Host "#$num broken dep: #$depNum" -ForegroundColor Red
            }
        }
    }
}
Write-Host ""
Write-Host "=== RESULTS ===" -ForegroundColor Cyan
Write-Host "Missing priority: $($noPriority.Count)" -ForegroundColor Yellow
Write-Host "Broken dependencies: $($broken.Count)" -ForegroundColor Red
@{MissingPriority=$noPriority; BrokenDeps=$broken} | ConvertTo-Json | Out-File quick_audit_results.json
