# ⚖️ Thanos Timeout Manager - Quick Start

> *"Perfectly balanced, as all things should be."*

## What is Thanos?

Thanos is the performance judgment system for your agent swarm. It monitors agent productivity and enforces resource allocation by:
- **Timing out** agents with recoverable issues (doubles their interval)
- **Disabling** chronic offenders (sets interval to 0)
- **Showing mercy** to productive agents with occasional failures

## 5-Minute Setup

### Step 1: Verify Files Exist

```powershell
# Check core files
ls cache/performance.json
ls core/thanos_timeout_manager.py
ls core/agent_performance_logger.py
ls core/discord_notifier.py
```

### Step 2: Integrate with Agents

Add performance logging to each agent script at the END of their execution:

```powershell
# For productive runs
python core/agent_performance_logger.py <agent_id> true "" "<summary>"

# For unproductive runs
python core/agent_performance_logger.py <agent_id> false <offense_type> "<summary>"
```

**Agent IDs:**
- `black_widow` - Issue Hunter
- `thor` - PR Reviewer
- `bruce_banner` - PR Reviewer (secondary)
- `cyclops` - PR Fixer
- `iron_man` - Implementer

**Offense Types:**
- `silent_exit` - Exits without output
- `empty_run` - No valuable work
- `ghost_run` - Claims work but no evidence
- `error_loop` - Repeated errors

**Example Integration:**

```powershell
# In black_widow.ps1 (at the end)
if ($foundIssue) {
    python core\agent_performance_logger.py black_widow true "" "Found and claimed issue #$issueNumber"
} else {
    python core\agent_performance_logger.py black_widow false empty_run "No available issues found"
}
```

### Step 3: Schedule Thanos (Optional)

```powershell
# Run every 15 minutes (recommended)
.\setup_thanos_scheduler.ps1

# Or custom interval
.\setup_thanos_scheduler.ps1 -IntervalMinutes 30
```

### Step 4: Run Thanos Manually (Testing)

```powershell
# Execute judgment
.\thanos_execute.ps1

# Or directly with Python
python core\thanos_timeout_manager.py
```

## Discord Notifications (Optional)

Set your webhook URL:

```powershell
# Temporary (current session)
$env:DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL"

# Permanent (user environment)
[System.Environment]::SetEnvironmentVariable('DISCORD_WEBHOOK_URL', 'YOUR_WEBHOOK_URL', 'User')
```

## Judgment Logic

### Thresholds
- **Warning**: 2 consecutive failures
- **Timeout**: 3 consecutive failures (doubles interval)
- **Disable**: 5 consecutive failures (sets interval to 0)
- **Minimum Productivity**: 60% (below this triggers timeout even without streak)

### Verdicts

| Verdict | Condition | Action |
|---------|-----------|--------|
| **PASS** | Performing well or insufficient data | No action |
| **MERCY** | High productivity (≥60%) despite recent failures | Reset offense streak |
| **TIMEOUT** | Offense streak ≥ 3, or low productivity | Double interval |
| **DISABLE** | Offense streak ≥ 5, or chronic low productivity | Set interval to 0 |

## Example Output

```
[THANOS TIMEOUT MANAGER]
============================================================
Perfectly balanced, as all things should be.

[PHASE 1: PERFORMANCE ANALYSIS]

Black Widow (Issue Hunter):
  Runs: 12 (Productive: 10)
  Productivity: 83.3%
  Offense Streak: 0

Thor (PR Reviewer):
  Runs: 5 (Productive: 0)
  Productivity: 0.0%
  Offense Streak: 5
  Primary Offense: empty_run

============================================================
[PHASE 2: JUDGMENT]

[OK] Black Widow (Issue Hunter): PASS
   Productive agent (83.3%)

[DISABLE] Thor (PR Reviewer): DISABLE
   Chronic offender (streak: 5, productivity: 0.0%, primary: empty_run)

============================================================
[PHASE 3: ENFORCEMENT]

[OK] Disabled Thor (PR Reviewer)

============================================================
[PHASE 4: BALANCE REPORT]

Swarm Health:
   Total Agents: 5
   Productive (>=60%): 2
   Timed Out: 0
   Disabled: 1
   Overall Swarm Productivity: 65.5%

Perfectly balanced, as all things should be.
```

## Monitoring Performance

### Check Current Stats

```powershell
# View all agent performance
Get-Content cache\performance.json | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Check specific agent
Get-Content cache\performance.json | ConvertFrom-Json | Select-Object -ExpandProperty agents | Select-Object -ExpandProperty thor
```

### Manual Performance Logging (Testing)

```powershell
# Simulate productive run
python core\agent_performance_logger.py black_widow true "" "Found issue #123"

# Simulate unproductive run
python core\agent_performance_logger.py thor false empty_run "No PRs to review"
```

### View Task Scheduler Status

```powershell
# Check Thanos task
Get-ScheduledTask -TaskName "ThanosTimeoutManager"

# Run Thanos now
Start-ScheduledTask -TaskName "ThanosTimeoutManager"

# View last run result
Get-ScheduledTaskInfo -TaskName "ThanosTimeoutManager"
```

## Recovering Disabled Agents

When an agent is disabled, Thanos sets their interval to 0. To recover:

1. **Fix the underlying issue** (check offense history in performance.json)
2. **Reset the agent's streak** manually:

```powershell
# Edit performance.json
$perf = Get-Content cache\performance.json | ConvertFrom-Json
$perf.agents.thor.current_offense_streak = 0
$perf.agents.thor.status = "active"
$perf.agents.thor.current_interval_minutes = 5
$perf | ConvertTo-Json -Depth 10 | Set-Content cache\performance.json
```

3. **Re-enable the Task Scheduler task** (if it was disabled)

```powershell
Enable-ScheduledTask -TaskName "Thor"  # or appropriate agent task name
```

## Troubleshooting

### Thanos Not Running

```powershell
# Check task exists
Get-ScheduledTask -TaskName "ThanosTimeoutManager"

# Check last run
Get-ScheduledTaskInfo -TaskName "ThanosTimeoutManager"

# Run manually to see errors
python core\thanos_timeout_manager.py
```

### Performance Not Updating

```powershell
# Verify agents are logging runs
# Add debug output to agent scripts
Write-Host "Logging performance..." -ForegroundColor Yellow
python core\agent_performance_logger.py agent_id true "" "summary"

# Check file timestamp
(Get-Item cache\performance.json).LastWriteTime
```

### Discord Not Working

```powershell
# Verify webhook URL
$env:DISCORD_WEBHOOK_URL

# Test notification
python core\discord_notifier.py agent "Test Agent" true "Test message"
```

## Integration Checklist

- [ ] Performance.json exists with all agents
- [ ] Each agent logs productive/unproductive runs
- [ ] Thanos scheduled task created (optional)
- [ ] Discord webhook configured (optional)
- [ ] Test run shows correct judgments
- [ ] Agents properly timeout/disable when failing

## Philosophy

> "The hardest choices require the strongest wills."

Thanos ensures optimal swarm performance through fair but firm resource management:
- **High performers** are protected and rewarded
- **Recoverable failures** get timeouts to reduce frequency
- **Chronic failures** are disabled to prevent resource waste
- **Balance** is maintained across the entire swarm

---

**Need Help?** See [THANOS_README.md](THANOS_README.md) for full documentation.
