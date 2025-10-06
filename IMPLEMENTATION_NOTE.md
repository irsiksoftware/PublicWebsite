# Issue #281: Add next piece preview

## Status: Already Implemented

This feature has already been fully implemented in the codebase:

### Implementation Details

1. **Preview Canvas** (tetris.html:48)
   - 80x80px canvas with id "next-piece"
   - Properly labeled for accessibility

2. **Next Piece Generation** (js/tetris.js:68-78)
   - `generateNextPiece()` function creates random tetromino
   - Stores shape, color, and type in `nextPiece` object

3. **Preview Rendering** (js/tetris.js:450-495)
   - `drawNextPiece()` function renders piece in preview canvas
   - Calculates piece bounds and centers it (lines 477-478)
   - Uses 16px blocks for scaled preview

4. **Integration** (js/tetris.js:64, 94)
   - Called on initialization
   - Updates when new piece spawns in `spawnPiece()`

### Acceptance Criteria Status
- ✅ Next piece visible
- ✅ Preview updates correctly
- ✅ Piece centered

All requirements have been met in the existing implementation.
