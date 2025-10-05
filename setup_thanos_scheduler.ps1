# Setup Thanos Timeout Manager in Task Scheduler
# Creates scheduled task to run judgment every 15 minutes

param(
    [int]$IntervalMinutes = 15
)

$taskName = "ThanosTimeoutManager"
$scriptPath = Join-Path $PSScriptRoot "thanos_execute.ps1"

Write-Host "🔨 Setting up Thanos Timeout Manager in Task Scheduler" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor DarkGray
Write-Host ("=" * 59) -ForegroundColor DarkGray
Write-Host ""

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "⚠️  Task '$taskName' already exists." -ForegroundColor Yellow
    $response = Read-Host "Do you want to recreate it? (y/n)"

    if ($response -ne 'y') {
        Write-Host "Cancelled." -ForegroundColor Gray
        exit 0
    }

    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "✓ Removed existing task" -ForegroundColor Green
}

# Create task action
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" `
    -WorkingDirectory $PSScriptRoot

# Create trigger (repeating every N minutes)
$trigger = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date).AddMinutes(2) `
    -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)

# Create principal (run as current user)
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Limited

# Create settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# Register the task
Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description "Thanos Timeout Manager - Judges agent performance and enforces resource allocation. Perfectly balanced, as all things should be." | Out-Null

Write-Host "✅ Task '$taskName' created successfully" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Task Configuration:" -ForegroundColor Cyan
Write-Host "   Name: $taskName" -ForegroundColor Gray
Write-Host "   Interval: Every $IntervalMinutes minutes" -ForegroundColor Gray
Write-Host "   Script: $scriptPath" -ForegroundColor Gray
Write-Host "   First run: $(((Get-Date).AddMinutes(2)).ToString('yyyy-MM-dd HH:mm'))" -ForegroundColor Gray
Write-Host ""
Write-Host "💭 Perfectly balanced, as all things should be." -ForegroundColor Magenta
Write-Host ""
Write-Host "To manage the task:" -ForegroundColor Yellow
Write-Host "  View status: Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host "  Run now: Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host "  Disable: Disable-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host "  Remove: Unregister-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
