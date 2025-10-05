/**
 * Tetris Game Loop with Gravity and Level System
 * Implements core game mechanics for Tetris
 */

// Game state object
const gameState = {
  score: 0,
  level: 1,
  lines: 0,
  isPaused: false,
  isGameOver: false
};

// Game configuration
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
let canvas, ctx;
let currentPiece = null;
let gameLoopId = null;
let gravityInterval = null;

// Tetromino shapes (I, O, T, S, Z, J, L)
const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

const COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000'
};

// Game grid (20 rows x 10 columns)
let grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

/**
 * Initialize the game
 */
function initGame() {
  // Get canvas element
  canvas = document.getElementById('tetrisCanvas');
  if (!canvas) {
    console.error('Tetris canvas not found!');
    return;
  }

  ctx = canvas.getContext('2d');
  canvas.width = COLS * BLOCK_SIZE;
  canvas.height = ROWS * BLOCK_SIZE;

  // Reset game state
  resetGame();

  // Set up keyboard controls
  setupControls();

  // Start game loop
  startGameLoop();
}

/**
 * Reset game to initial state
 */
function resetGame() {
  gameState.score = 0;
  gameState.level = 1;
  gameState.lines = 0;
  gameState.isPaused = false;
  gameState.isGameOver = false;

  // Clear grid
  grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

  // Spawn first piece
  spawnPiece();

  // Update UI
  updateUI();
}

/**
 * Spawn a new piece at the top
 */
function spawnPiece() {
  const shapeKeys = Object.keys(SHAPES);
  const randomShape = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];

  currentPiece = {
    shape: SHAPES[randomShape],
    color: COLORS[randomShape],
    x: Math.floor(COLS / 2) - 1,
    y: 0,
    type: randomShape
  };

  // Check for game over (piece spawns with collision)
  if (checkCollision(currentPiece, currentPiece.x, currentPiece.y)) {
    gameOver();
  }
}

/**
 * Check if piece collides with grid or boundaries
 */
function checkCollision(piece, offsetX, offsetY) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = offsetX + x;
        const newY = offsetY + y;

        // Check boundaries
        if (newX < 0 || newX >= COLS || newY >= ROWS) {
          return true;
        }

        // Check grid collision (only if y >= 0)
        if (newY >= 0 && grid[newY][newX]) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Move piece down (gravity)
 */
function moveDown() {
  if (gameState.isPaused || gameState.isGameOver || !currentPiece) return;

  // Try to move down
  if (!checkCollision(currentPiece, currentPiece.x, currentPiece.y + 1)) {
    currentPiece.y++;
  } else {
    // Lock piece in place
    lockPiece();
    // Spawn next piece
    spawnPiece();
  }
}

/**
 * Lock current piece into grid
 */
function lockPiece() {
  for (let y = 0; y < currentPiece.shape.length; y++) {
    for (let x = 0; x < currentPiece.shape[y].length; x++) {
      if (currentPiece.shape[y][x]) {
        const gridY = currentPiece.y + y;
        const gridX = currentPiece.x + x;
        if (gridY >= 0) {
          grid[gridY][gridX] = currentPiece.color;
        }
      }
    }
  }

  // Check for completed lines (will be implemented in issue #126)
  // For now, just placeholder
  checkLines();
}

/**
 * Check and clear completed lines
 * (Basic implementation - full implementation in issue #126)
 */
function checkLines() {
  let linesCleared = 0;

  for (let y = ROWS - 1; y >= 0; y--) {
    if (grid[y].every(cell => cell !== 0)) {
      // Remove completed line
      grid.splice(y, 1);
      // Add new empty line at top
      grid.unshift(Array(COLS).fill(0));
      linesCleared++;
      y++; // Check same row again
    }
  }

  if (linesCleared > 0) {
    gameState.lines += linesCleared;
    // Basic scoring
    gameState.score += linesCleared * 100 * gameState.level;
    // Level up every 10 lines
    gameState.level = Math.floor(gameState.lines / 10) + 1;
    updateUI();
    updateGravitySpeed();
  }
}

/**
 * Start game loop
 */
function startGameLoop() {
  // Use requestAnimationFrame for smooth rendering
  gameLoopId = requestAnimationFrame(gameLoop);

  // Start gravity (piece falls automatically)
  updateGravitySpeed();
}

/**
 * Update gravity speed based on level
 */
function updateGravitySpeed() {
  if (gravityInterval) {
    clearInterval(gravityInterval);
  }

  // Gravity interval: 1000ms / level
  const interval = Math.max(100, 1000 / gameState.level);
  gravityInterval = setInterval(() => {
    moveDown();
  }, interval);
}

/**
 * Main game loop
 */
function gameLoop() {
  // Clear and redraw canvas each frame
  clearCanvas();
  drawGrid();
  drawCurrentPiece();
  drawUI();

  // Continue loop
  if (!gameState.isGameOver) {
    gameLoopId = requestAnimationFrame(gameLoop);
  }
}

/**
 * Clear canvas
 */
function clearCanvas() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draw grid
 */
function drawGrid() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x]) {
        ctx.fillStyle = grid[y][x];
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
      }
    }
  }
}

/**
 * Draw current piece
 */
function drawCurrentPiece() {
  if (!currentPiece) return;

  ctx.fillStyle = currentPiece.color;
  for (let y = 0; y < currentPiece.shape.length; y++) {
    for (let x = 0; x < currentPiece.shape[y].length; x++) {
      if (currentPiece.shape[y][x]) {
        ctx.fillRect(
          (currentPiece.x + x) * BLOCK_SIZE,
          (currentPiece.y + y) * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        );
      }
    }
  }
}

/**
 * Draw UI overlays
 */
function drawUI() {
  if (gameState.isPaused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
  }

  if (gameState.isGameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
  }
}

/**
 * Update UI elements (score, level, lines)
 */
function updateUI() {
  const scoreEl = document.getElementById('tetrisScore');
  const levelEl = document.getElementById('tetrisLevel');
  const linesEl = document.getElementById('tetrisLines');

  if (scoreEl) scoreEl.textContent = gameState.score;
  if (levelEl) levelEl.textContent = gameState.level;
  if (linesEl) linesEl.textContent = gameState.lines;
}

/**
 * Toggle pause
 */
function togglePause() {
  if (gameState.isGameOver) return;

  gameState.isPaused = !gameState.isPaused;

  if (gameState.isPaused) {
    // Stop gravity when paused
    if (gravityInterval) {
      clearInterval(gravityInterval);
      gravityInterval = null;
    }
  } else {
    // Resume gravity
    updateGravitySpeed();
  }
}

/**
 * Game over
 */
function gameOver() {
  gameState.isGameOver = true;

  // Stop gravity
  if (gravityInterval) {
    clearInterval(gravityInterval);
    gravityInterval = null;
  }

  // Stop game loop
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
}

/**
 * Setup keyboard controls
 */
function setupControls() {
  document.addEventListener('keydown', (e) => {
    // P key toggles pause
    if (e.key === 'p' || e.key === 'P') {
      togglePause();
      e.preventDefault();
    }

    // Prevent other keys from doing anything during pause or game over
    if (gameState.isPaused || gameState.isGameOver) return;

    // Movement keys will be implemented in dependency issue
    // For now, just prevent default behavior
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
      e.preventDefault();
    }
  });
}

// Export for use in HTML
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initGame, resetGame, togglePause, gameState };
} else {
  // Make available globally for browser
  window.TetrisGame = { initGame, resetGame, togglePause, gameState };
}
