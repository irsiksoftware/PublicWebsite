$script = Get-Content 'C:\Code\TestForAI\pr_fixer_cyclops.ps1' -Raw
$errors = $null
$tokens = [System.Management.Automation.PSParser]::Tokenize($script, [ref]$errors)

if ($errors) {
    Write-Host "Syntax errors found:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "Line $($_.Token.StartLine): $($_.Message)" }
} else {
    Write-Host "No syntax errors found" -ForegroundColor Green
}
