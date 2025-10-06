## Summary
Implement agent dropdown selector per issue #254

## Changes
- Agent dropdown already implemented in `js/agent-selector.js`
- Fetches from `/data/agents.json`
- Filters to enabled agents only
- Format: `Name (Alias) - Role`
- Stores selection in `selectedAgent` variable
- Change event triggers on selection

## Test Plan
- [x] Dropdown populates from JSON
- [x] Shows enabled agents only (Nick Fury, Cyclops, Scarlet Witch)
- [x] Selection triggers change event

Closes #254
