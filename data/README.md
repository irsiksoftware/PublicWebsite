# Meta Swarm Analysis Website - Data

Example JSON files for the Meta Swarm Analysis Website. These are real samples from the swarm's activity.

## Files

- **`agents-sample.json`** (10 KB) - All 12 Marvel agent personas with roles and Anthropic patterns
- **`spy-activity-sample.json`** (5 KB) - First 10 command executions with timing and cache stats
- **`audit-sessions-sample.json`** (7 KB) - First 5 agent sessions with productivity signals
- **`cached-issues-sample.json`** (5 KB) - First 5 GitHub issues cached for orchestrator
- **`performance-sample.json`** (1 KB) - Agent performance tracking (offense streaks)
- **`index-sample.json`** (1 KB) - Master index of all data files

## Usage

Use these samples during website development to:
1. Design UI components (dropdowns, tables, charts)
2. Test data fetching and display logic
3. Build GraphQL schemas and queries
4. Develop without running full data aggregation

## Full Data

To generate full data from live swarm logs:

```bash
python tools/aggregate-all-data.py
```

Output will be in `/data` directory.

## Schema Examples

### Agent Selection Dropdown
```javascript
// From agents-sample.json
fetch('/data/agents-sample.json')
  .then(r => r.json())
  .then(data => {
    const agents = data.agents
      .filter(a => a.enabled)
      .map(a => ({ name: a.name, alias: a.alias, role: a.role }))

    // Populate dropdown: "Wolverine (Logan) - Implementer"
  })
```

### Spy Activity Table
```javascript
// From spy-activity-sample.json
fetch('/data/spy-activity-sample.json')
  .then(r => r.json())
  .then(data => {
    // Display entries with columns:
    // Timestamp | Agent | Command | Exit Code | Duration | Cache
    data.entries.forEach(entry => {
      console.log(`${entry.agent} ran: ${entry.command}`)
    })
  })
```

### Performance Metrics
```javascript
// From performance-sample.json
fetch('/data/performance-sample.json')
  .then(r => r.json())
  .then(data => {
    // Show offense streaks, productivity rates
    Object.entries(data).forEach(([agent, stats]) => {
      console.log(`${agent}: ${stats.productive_runs}/${stats.total_runs} productive`)
    })
  })
```

## Data Sources

All sample data is generated from real swarm activity:
- **logs/gh-spy.log, git-spy.log, npm-spy.log** → spy-activity
- **logs/ai-conversations/ROLE/DATE/*.txt** → audit-sessions
- **cache/issues/*.txt** → cached-issues
- **roles/*.ps1, settings.ini** → agents
- **cache/performance.json** → performance

See `/tools/README.md` for aggregation tool documentation.
