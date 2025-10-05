# ⚖️ THANOS - Timeout Manager

> *"Perfectly balanced, as all things should be."*

## Overview

Thanos is the timeout management system for the agent swarm. It judges agent performance, enforces resource allocation through timeouts and disablement, and ensures only productive agents operate at full speed.

## Architecture

### Components

1. **Performance Tracker** (`cache/performance.json`)
   - Tracks metrics for each agent: runs, productivity, offense streaks
   - Updated by agents after each run
   - Read by Thanos for judgment

2. **Thanos Judgment Engine** (`core/thanos_timeout_manager.py`)
   - Analyzes performance data
   - Makes verdicts: PASS, MERCY, TIMEOUT, DISABLE
   - Enforces through Task Scheduler modifications

3. **Performance Logger** (`core/agent_performance_logger.py`)
   - CLI tool for agents to log their runs
   - Tracks productive vs unproductive runs
   - Manages offense streaks

4. **Discord Notifier** (`core/discord_notifier.py`)
   - Sends judgment decisions to Discord
   - Posts swarm health reports
   - Notifies about agent activities

5. **Execution Script** (`thanos_execute.ps1`)
   - PowerShell wrapper for Thanos execution
   - Handles Discord notifications
   - Provides formatted output

6. **Scheduler Setup** (`setup_thanos_scheduler.ps1`)
   - Creates Task Scheduler task for Thanos
   - Configurable interval (default: 15 minutes)

## Judgment System

### Performance Metrics

- **Total Runs**: Number of times agent has executed
- **Productive Runs**: Runs that resulted in meaningful work
- **Productivity Ratio**: productive_runs / total_runs
- **Offense Streak**: Consecutive unproductive runs
- **Offense History**: Record of offense types

### Offense Types

| Type | Description |
|------|-------------|
| `silent_exit` | Agent exits without meaningful output or action |
| `empty_run` | Agent runs but produces no valuable work product |
| `ghost_run` | Agent claims work done but no evidence in repository |
| `error_loop` | Agent repeatedly encounters same error without resolution |

### Thresholds

```json
{
  "offense_streak_warning": 2,
  "offense_streak_timeout": 3,
  "offense_streak_disable": 5,
  "minimum_productivity_ratio": 0.6
}
```

### Verdicts

| Verdict | Action | Criteria |
|---------|--------|----------|
| **PASS** | No action | Performing within acceptable parameters |
| **MERCY** | Reset offense streak | High productivity despite recent streak |
| **TIMEOUT** | Double interval | Offense streak ≥ 3, recoverable pattern |
| **DISABLE** | Set interval to 0 | Chronic offender (streak ≥ 5) or very low productivity |

## Setup

### 1. Initialize Performance Tracking

The `cache/performance.json` file is pre-configured with all agents:
- Black Widow (Issue Hunter)
- Thor (PR Reviewer)
- Bruce Banner (PR Reviewer)
- Cyclops (PR Fixer)
- Iron Man (Implementer)

### 2. Configure Discord Notifications (Optional)

```powershell
# Set Discord webhook URL
$env:DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL"

# Make it permanent (optional)
[System.Environment]::SetEnvironmentVariable('DISCORD_WEBHOOK_URL', 'YOUR_WEBHOOK_URL', 'User')
```

### 3. Schedule Thanos

```powershell
# Default: Every 15 minutes
.\setup_thanos_scheduler.ps1

# Custom interval (e.g., every 30 minutes)
.\setup_thanos_scheduler.ps1 -IntervalMinutes 30
```

### 4. Integrate with Agents

Each agent should log their performance after every run:

```powershell
# Log productive run
python core\agent_performance_logger.py black_widow true "" "Found and claimed issue #123"

# Log unproductive run
python core\agent_performance_logger.py thor false empty_run "No PRs to review"
```

## Usage

### Manual Execution

```powershell
# Run Thanos judgment manually
.\thanos_execute.ps1

# Or directly with Python
python core\thanos_timeout_manager.py
```

### View Agent Status

```powershell
# Check current performance
Get-Content cache\performance.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### Task Scheduler Management

```powershell
# View Thanos task
Get-ScheduledTask -TaskName "ThanosTimeoutManager"

# Run now
Start-ScheduledTask -TaskName "ThanosTimeoutManager"

# Disable temporarily
Disable-ScheduledTask -TaskName "ThanosTimeoutManager"

# Re-enable
Enable-ScheduledTask -TaskName "ThanosTimeoutManager"

# Remove completely
Unregister-ScheduledTask -TaskName "ThanosTimeoutManager"
```

## Agent Integration Guide

### Update Agent Scripts

Each agent should:

1. **Log run start** (optional, for debugging)
2. **Perform work**
3. **Determine if productive**
4. **Log run result**

#### Example: Black Widow (Issue Hunter)

```powershell
# At start of black_widow.ps1
$agentId = "black_widow"

# ... do work ...

# At end, determine productivity
if ($foundIssue) {
    # Productive run
    python core\agent_performance_logger.py $agentId true "" "Found and claimed issue #$issueNumber"
} else {
    # Unproductive run
    python core\agent_performance_logger.py $agentId false empty_run "No available issues found"
}
```

#### Example: Thor (PR Reviewer)

```python
# At end of thor_pr_reviewer.py
agent_id = "thor"

if reviews_posted > 0:
    # Productive
    os.system(f'python core/agent_performance_logger.py {agent_id} true "" "Reviewed {reviews_posted} PRs"')
else:
    # Unproductive
    os.system(f'python core/agent_performance_logger.py {agent_id} false empty_run "No PRs to review"')
```

## Output Examples

### Judgment Output

```
⚖️  THANOS TIMEOUT MANAGER
============================================================
Perfectly balanced, as all things should be.

📊 PHASE 1: PERFORMANCE ANALYSIS

Black Widow (Issue Hunter):
  Runs: 24 (Productive: 18)
  Productivity: 75.0%
  Offense Streak: 0

Thor (PR Reviewer):
  Runs: 30 (Productive: 12)
  Productivity: 40.0%
  Offense Streak: 4
  Primary Offense: empty_run

============================================================
⚖️  PHASE 2: JUDGMENT

✅ Black Widow (Issue Hunter): PASS
   Productive agent (75.0%)

⏱️  Thor (PR Reviewer): TIMEOUT
   Recoverable pattern (streak: 4, primary: empty_run)

============================================================
🔨 PHASE 3: ENFORCEMENT

✓ Doubled interval for Thor (PR Reviewer)

============================================================
📈 PHASE 4: BALANCE REPORT

🌐 Swarm Health:
   Total Agents: 5
   Productive (≥60%): 2
   Timed Out: 1
   Disabled: 0
   Overall Swarm Productivity: 65.5%

💭 Perfectly balanced, as all things should be.
```

### Discord Notification

![Thanos Judgment](https://via.placeholder.com/400x200?text=Discord+Embed+Example)

- **Embed Color**: Orange (timeout), Red (disable), Green (mercy)
- **Fields**: Productivity ratio, offense streak
- **Footer**: "Perfectly balanced, as all things should be."

## Philosophy

Thanos operates on the principle of **resource efficiency**. Agents that consistently waste resources (failed runs, empty runs, errors) are timed out or disabled to:

1. **Reduce system load** - Fewer unnecessary scheduled tasks
2. **Improve productivity** - Focus resources on working agents
3. **Encourage optimization** - Agents must improve to regain full speed

The system is fair but firm:
- **High productivity** → Always protected, even with occasional failures
- **Recoverable issues** → Given timeout to reduce frequency, chance to improve
- **Chronic waste** → Disabled until manually reviewed and fixed

## Troubleshooting

### Thanos Not Running

```powershell
# Check if task exists
Get-ScheduledTask -TaskName "ThanosTimeoutManager"

# Check task history
Get-ScheduledTask -TaskName "ThanosTimeoutManager" | Get-ScheduledTaskInfo
```

### Performance Data Issues

```powershell
# Verify performance.json exists
Test-Path cache\performance.json

# Check syntax
Get-Content cache\performance.json | ConvertFrom-Json
```

### Discord Notifications Not Sending

```powershell
# Check webhook URL is set
$env:DISCORD_WEBHOOK_URL

# Test manually
python core\discord_notifier.py agent "Test Agent" true "Test notification"
```

### Agent Not Being Judged

1. Verify agent ID matches `performance.json`
2. Check agent is logging runs properly
3. Ensure `total_runs` > 0 in performance data

## Future Enhancements

- [ ] Machine learning offense pattern detection
- [ ] Auto-recovery for timed out agents showing improvement
- [ ] Predictive analytics for agent resource needs
- [ ] Integration with monitoring dashboards
- [ ] Historical performance trends and reporting
- [ ] Agent reputation system based on long-term productivity

---

*"The hardest choices require the strongest wills."* - Thanos
