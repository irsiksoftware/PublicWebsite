# THANOS TIMEOUT MANAGER - Execution Script
# "Perfectly balanced, as all things should be."

Write-Host "⚖️  THANOS TIMEOUT MANAGER EXECUTION" -ForegroundColor Magenta
Write-Host "=" -NoNewline -ForegroundColor DarkGray
Write-Host ("=" * 59) -ForegroundColor DarkGray
Write-Host ""

# Check if performance.json exists
if (-not (Test-Path "cache\performance.json")) {
    Write-Host "❌ Performance data not found at cache\performance.json" -ForegroundColor Red
    Write-Host "Please run agent monitoring first to collect performance data." -ForegroundColor Yellow
    exit 1
}

# Execute Thanos judgment
Write-Host "🔍 Executing judgment logic..." -ForegroundColor Cyan
python core\thanos_timeout_manager.py

$exitCode = $LASTEXITCODE

if ($exitCode -gt 0) {
    Write-Host "`n✅ Enforcement actions taken: $exitCode" -ForegroundColor Green

    # Send Discord notifications if configured
    if ($env:DISCORD_WEBHOOK_URL) {
        Write-Host "`n📢 Sending Discord notifications..." -ForegroundColor Cyan

        # The Python script would have output decisions to a temp file or we parse from output
        # For now, we'll trigger notification separately
        # python core\discord_notifier.py judgment "<decisions_json>"
    } else {
        Write-Host "`n⚠️  Discord webhook not configured. Skipping notifications." -ForegroundColor Yellow
        Write-Host "Set DISCORD_WEBHOOK_URL environment variable to enable notifications." -ForegroundColor DarkGray
    }
} else {
    Write-Host "`n✅ No enforcement actions needed - all agents performing well." -ForegroundColor Green
}

Write-Host "`n💭 Perfectly balanced, as all things should be." -ForegroundColor Magenta
Write-Host ""
