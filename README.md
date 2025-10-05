# TestForAI - Avengers Archive

**AI Agent Swarm Testing Ground - Marvel-Themed Static Website Project**

A comprehensive test repository designed to evaluate AI agent swarm coordination, dependency resolution, priority handling, and collaborative development workflows. Built as a Marvel Avengers Archive static website with intentionally simple issues to maximize agent throughput and minimize implementation complexity.

---

## 🎯 Purpose

TestForAI serves as the **target repository** for the **Not So Dumb Swarm** project—an autonomous AI agent system where Marvel superhero personas (Wolverine, Spider-Man, Dr. Strange, etc.) collaborate to implement features, review code, and deploy releases.

### What We're Testing

#### 1. **WIP (Work In Progress) Label Coordination**
- **Goal**: Prevent multiple agents from claiming the same issue
- **Mechanism**: First agent to apply \`wip\` label wins; others skip and move to next available issue
- **Validation**: No duplicate PRs for same issue, no merge conflicts from parallel work
- **Metrics**: WIP claim collisions, resolution time per issue

#### 2. **Dependency Resolution**
- **Goal**: Ensure agents respect issue dependencies before starting work
- **Mechanism**: Issues labeled \`d1\`, \`d2\`, etc. indicate dependencies (e.g., \`d5\` = depends on issue #5)
- **Workflow**: Agent checks all dependency issues are CLOSED before claiming work
- **Metrics**: Blocked issue count, dependency chain depth, out-of-order attempts

#### 3. **Priority-Based Work Selection**
- **Goal**: Critical work gets completed before low-priority tasks
- **Mechanism**: Labels \`CRITICAL > URGENT > HIGH > MEDIUM > LOW\` with oldest-first tiebreaker
- **Validation**: High-priority issues close before low-priority ones
- **Metrics**: Priority adherence rate, completion order analysis

#### 4. **GitHub API Cache Efficiency**
- **Goal**: Reduce API calls by 80-95% to avoid rate limits (5000/hour)
- **Mechanism**: Fake gh CLI wrapper with hybrid TTL-based cache (lightweight lists + individual details)
- **Validation**: Compare cache hit/miss ratio, API call reduction percentage
- **Metrics**: Cache hit rate, API calls saved, cache staleness incidents

#### 5. **Git Commit Attribution**
- **Goal**: Each agent maintains unique identity in git history
- **Mechanism**: Git config + environment variables per agent (e.g., \`wolverine@irsiksoftware.com\`)
- **Validation**: Commits show agent name/email, not human operator
- **Metrics**: Attribution accuracy per agent, commit authorship distribution

#### 6. **Multi-Agent Throughput**
- **Goal**: Measure completion velocity with 1-6 parallel agents
- **Mechanism**: Scheduled tasks at staggered intervals (7-13 min cycles)
- **Validation**: Linear vs. sublinear scaling with agent count
- **Metrics**: Issues/hour, PRs merged/hour, token consumption, cycle time

#### 7. **Discord Notification Reliability**
- **Goal**: Real-time visibility into agent actions
- **Mechanism**: Webhooks for issue claims, PR creation, merges, blocks
- **Validation**: All significant events posted to Discord
- **Metrics**: Notification delivery rate, latency from action to notification

#### 8. **Circuit Breaker & Auto-Recovery**
- **Goal**: Disable unproductive agents, recover when work becomes available
- **Mechanism**: After 3 consecutive no-ops, disable agent; re-enable when new issues created
- **Validation**: Agents don't spam empty runs
- **Metrics**: False positive disables, recovery time when work appears

#### 9. **Prompt Variation A/B Testing**
- **Goal**: Determine if humor/sycophancy improves agent performance
- **Variants**:
  - **Baseline** (Wolverine): Professional, direct instructions
  - **Humor** (Spider-Man): Playful tone, emojis, jokes
  - **Sycophantic** (Black Widow): Praise-heavy, flattery-based prompting
- **Metrics**: Completion rate, error rate, code quality, execution time per variant

#### 10. **Timeout & Performance Judging**
- **Goal**: Survival of the fittest - best-performing agents get more resources
- **Mechanism**: Thanos (timeout manager) analyzes productivity, adjusts schedules
- **Validation**: Unproductive agents get timeout increases (slower runs)
- **Metrics**: Performance score per agent, schedule adjustments made

---

## 🦸 The Project: Avengers Archive

A static website database of Marvel's Avengers team featuring:

- **Hero Profiles**: Individual pages for each Avenger (Iron Man, Captain America, Thor, etc.)
- **Team Directory**: Searchable/filterable hero database
- **Mission History**: Timeline of significant Avengers events
- **Interactive Features**: CSS animations, particle effects, responsive design
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### Tech Stack
- **HTML5**: Semantic markup, forms, media elements
- **CSS3**: Flexbox, Grid, animations, custom properties
- **Vanilla JavaScript**: DOM manipulation, fetch API, event handling
- **No Build Tools**: Pure static files (GitHub Pages ready)

### Issue Complexity
Issues are **intentionally simple** ("dog simple" per project docs):
- 200-500 word feature descriptions
- Single-file changes (HTML/CSS/JS)
- Clear acceptance criteria
- Minimal external dependencies
- ~5-15 minute implementation time per issue

**Why Simple?** Maximizes agent throughput, reduces implementation failures, focuses testing on **coordination** rather than **coding complexity**.

---

## 📊 Metrics Tracking

See **temp-swarm** repository for full metrics infrastructure.

### Real-Time Tracking
- **performance.json** - Per-agent productivity scores
- **audit_scanner.py** - Post-run productivity analysis
- **gh-spy.log** - GitHub CLI activity with persona tracking
- **AI-Audit logs** - Full Claude conversation transcripts
- **Discord webhooks** - Real-time notification stream
- **view-metrics.bat** - PowerShell metrics dashboard

---

## 📈 Success Criteria

### Coordination Tests
- ✅ Zero WIP collisions across 100 agent runs
- ✅ Zero out-of-order completions (dependencies respected)
- ✅ >95% cache hit rate after initial population
- ✅ 100% attribution accuracy (all commits show agent identity)

### Performance Tests
- ✅ 50 issues completed in <3 hours (3 agents)
- ✅ Linear scaling from 1→3 agents (3x throughput)
- ✅ <5% API rate limit warnings (stay under 5000/hr)

### Reliability Tests
- ✅ Zero false-positive circuit breaks
- ✅ 100% Discord notification delivery
- ✅ <1% cache staleness

### Prompt Variation Tests
- ✅ Completion rate within ±10% across variants
- ✅ Error rate within ±5% across variants
- ✅ No significant quality difference in code review

---

## 🔗 Integration with temp-swarm

TestForAI is the **target repository** controlled by \`temp-swarm/settings.ini\`:

\`\`\`ini
target_repo = C:\Code\TestForAI
\`\`\`

### Agent Workflow (per cycle)
1. Circuit Breaker Check
2. WIP Limit Check
3. Change Directory to TestForAI
4. Set Git Persona
5. Find Work (gh issue list via cache)
6. Sort by Priority
7. Check Dependencies
8. Claim Issue (add wip label)
9. Notify Discord
10. Implement Solution
11. Commit & Push
12. Create PR
13. Remove WIP label
14. Notify Discord
15. Return to temp-swarm
16. Audit Scan
17. Update performance.json
18. Exit

---

## 📚 Additional Resources

- **temp-swarm/README.md** - Full swarm architecture
- **temp-swarm/AGENT-GUIDELINES.md** - Priority/dependency workflow
- **temp-swarm/tools/gh-fake/README.md** - Cache system deep dive
- **temp-swarm/timeout.md** - Timeout manager design

---

**Last Updated**: 2025-10-05
**Swarm Version**: v2.0 (Marvel personas, aggressive timings, A/B testing, timeout manager)
**Status**: ✅ Active Testing
