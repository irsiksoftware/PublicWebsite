## Summary
Implements game loop with automatic piece falling and gravity system for Tetris game.

## Changes
- Added `setInterval`-based game loop with automatic piece descent
- Implemented gravity system with level-based speed: `interval = max(100, 1000 - level × 50)`
- Automatic piece spawning when current piece locks
- Game state tracking: score, level, lines, isPaused, isGameOver
- Speed increases automatically as level progresses

## Test Plan
- [ ] Verify pieces fall automatically
- [ ] Check speed increases with level progression
- [ ] Confirm new pieces spawn after locking
- [ ] Test game over detection on spawn collision

Fixes #278
