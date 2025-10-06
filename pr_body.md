## Summary
- Implemented main game loop using `setInterval` for automatic piece falling
- Added gravity system with speed formula: `max(100, 1000 - level × 50)`
- Implemented game state object tracking score, level, lines, isPaused, and isGameOver
- Added piece locking and automatic new piece spawning when current piece locks
- Implemented line clearing and level progression (every 10 lines)
- Added collision detection for locked pieces on the board
- Game over detection when new piece cannot spawn

## Test plan
- [x] Open tetris.html in browser
- [x] Verify pieces fall automatically every second initially
- [x] Verify new pieces spawn when current piece reaches bottom
- [x] Verify speed increases as level increases
- [x] Verify game state is tracked correctly

🤖 Generated with [Claude Code](https://claude.com/claude-code)