# Meta Swarm Analysis Website

> Why don't AI agents ever get lost? Because they always follow their git commits to find their way back home!

A showcase website that displays real-time metrics, activity, and performance data from the AI agent swarm that built it.

## Project Overview

This is a **meta-circular** project - the website showcases the AI swarm team that created it. The site displays:

- **Agent Roster** - All 12 Marvel-themed AI agents with personas and roles
- **Command Activity** - Real-time spy logs showing git/gh/npm commands executed
- **Session Timeline** - Audit logs of agent sessions with productivity signals
- **Performance Charts** - Agent success rates, offense streaks, cache efficiency
- **Interactive Games** - Tetris and other JS games built by the swarm
- **Role Documentation** - How each agent role works (Implementer, Reviewer, etc.)

## Technology Stack

- **Pure HTML/CSS/JavaScript** - No frameworks, offline-capable
- **Chart.js** - Performance visualizations
- **JSON Data** - Real swarm metrics from logs/audit/cache
- **Responsive Design** - Mobile-friendly flexbox/grid layouts
- **Glassmorphism UI** - Modern aesthetic with backdrop-filter effects

## Directory Structure

```
metaswarmanalysiswebsite/
├── README.md              # This file
├── SETUP.bat              # Setup script (copies files to target repo)
├── data/                  # JSON sample data for development
│   ├── agents-sample.json
│   ├── spy-activity-sample.json
│   ├── audit-sessions-sample.json
│   ├── cached-issues-sample.json
│   ├── performance-sample.json
│   └── index-sample.json
└── pictures/              # Images and assets for the website
```

## Setup Instructions

### Prerequisites

1. **GitHub Repository** - Any empty or existing repo (default: C:\Code\TestForAI)
2. **GitHub CLI** - Authenticated with `gh auth login`
3. **Python 3.x** - For populate/clear scripts

### Quick Start

1. **Edit SETUP.bat** - Set your target repository:
   ```batch
   set TARGET_REPO=C:\Code\YourRepoName
   ```

2. **Run setup script**:
   ```bash
   SETUP.bat
   ```

This will:
1. Copy README, data, and pictures to target repo (creates repo if needed, clears if exists)
2. Clear existing GitHub issues/labels
3. Populate GitHub with 50 website build issues from stories.csv

### Copying This Project

To create a new project based on this template:

1. Copy the entire `metaswarmanalysiswebsite` folder
2. Rename it to your project name (e.g., `mobileapp`)
3. Edit `SETUP.bat` - change `TARGET_REPO` to your target repository
4. Replace `stories.csv` with your own user stories
5. Update README.md, data, and pictures as needed
6. Run `SETUP.bat`

**That's it!** The setup script is fully self-contained and project-agnostic.

### Manual Setup

If you prefer manual setup:

```bash
# 1. Clear target repository files
cd C:\Code\TestForAI
git rm -rf .
git commit -m "Clean slate for website"

# 2. Copy project files
xcopy /E /I C:\Code\temp-swarm\projects\metaswarmanalysiswebsite\data C:\Code\TestForAI\data
xcopy /E /I C:\Code\temp-swarm\projects\metaswarmanalysiswebsite\pictures C:\Code\TestForAI\pictures
copy C:\Code\temp-swarm\projects\metaswarmanalysiswebsite\README.md C:\Code\TestForAI\

# 3. Clear and populate GitHub issues
cd C:\Code\temp-swarm
python tools\clear-repo.py C:\Code\TestForAI
python tools\populate-repo.py C:\Code\TestForAI C:\Code\temp-swarm\projects\metaswarmanalysiswebsite\stories.csv
```

## Development

The swarm agents will build the website by:

1. **Claiming issues** from Stories.csv (50 tasks, 15-50 min each)
2. **Creating branches** for each feature
3. **Implementing HTML/CSS/JS** according to requirements
4. **Creating PRs** with completed work
5. **Reviewing and merging** via PR Reviewer agents
6. **Testing** via Tester agents

## Data Sources

All JSON data in `/data` is generated from real swarm activity:

- **logs/gh-spy.log, git-spy.log, npm-spy.log** → spy-activity.json
- **logs/ai-conversations/ROLE/DATE/*.txt** → audit-sessions.json
- **cache/issues/*.txt** → cached-issues.json
- **roles/*.ps1, settings.ini** → agents.json
- **cache/performance.json** → performance.json

To regenerate full data from live swarm:

```bash
cd C:\Code\temp-swarm
python tools\aggregate-all-data.py
```

## Features to Build

The 50 GitHub issues in Stories.csv cover:

- **Foundation** - Folder structure, HTML boilerplate, CSS variables
- **Hero Section** - Gradient background, S.H.I.E.L.D. logo, navigation
- **Agent Dashboard** - Dropdown selector, profile cards, metrics
- **Command Activity** - Spy log table with filters and search
- **Session Timeline** - Audit log visualization
- **Performance Charts** - Chart.js integration for agent stats
- **Tetris Game** - Full implementation with scoring
- **Interactive Features** - Search, filters, CSV export
- **Polish** - Accessibility, mobile optimization, animations

## Success Metrics

When complete, the website should:

- ✅ Display all 12 agent personas with real metrics
- ✅ Show real command activity from spy logs
- ✅ Visualize session productivity with charts
- ✅ Run Tetris game smoothly
- ✅ Work offline (no external dependencies)
- ✅ Be fully responsive (mobile/tablet/desktop)
- ✅ Load in under 2 seconds

## Meta-Circular Nature

The unique aspect of this project is that **the AI swarm builds a website about itself**:

- The agents creating the code are the same agents being showcased
- Real spy logs capture the agents building the website
- Performance metrics include the agents' work on this project
- The final website displays the team that created it

This creates a self-documenting, living showcase of AI agent capabilities.

---

**Project Type**: Showcase Website
**Target Completion**: ~50 issues × 30 min avg = ~25 hours of agent work
**Technology**: HTML/CSS/JavaScript, Chart.js, JSON
**Purpose**: Demonstrate multi-agent coordination and meta-circular development

---

**Joke Time!** 🎭

Why do programmers prefer dark mode?

Because light attracts bugs!
