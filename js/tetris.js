/**
 * Tetris Game - Movement Controls
 * Implements left, right, and down piece movement
 */

// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 32;

// Game state
let canvas;
let ctx;
let currentPiece = null;
let board = [];
let gameState = {
    score: 0,
    level: 1,
    lines: 0,
    isPaused: false,
    isGameOver: false
};
let gameInterval = null;
let dropSpeed = 1000;
let heldPiece = null;
let canHold = true;
let holdCanvas;
let holdCtx;

// Initialize game
function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');

    holdCanvas = document.getElementById('hold-piece');
    holdCtx = holdCanvas.getContext('2d');

    // Initialize board
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

    // Spawn first piece
    spawnPiece();

    // Set up keyboard controls
    document.addEventListener('keydown', handleKeyPress);

    // Update UI
    updateUI();

    // Start game loop
    startGameLoop();

    // Initial draw
    draw();
    drawHoldPiece();
}

// Spawn new piece
function spawnPiece() {
    const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    const pieceData = TETROMINO_SHAPES[randomPiece];

    currentPiece = {
        x: Math.floor(COLS / 2) - 2,
        y: 0,
        shape: pieceData.rotations[0],
        color: pieceData.color,
        type: randomPiece,
        rotation: 0
    };

    // Check if spawn position is valid
    if (!canMove(currentPiece.x, currentPiece.y)) {
        gameState.isGameOver = true;
        stopGameLoop();
    }
}

// Start game loop
function startGameLoop() {
    if (gameInterval) {
        clearInterval(gameInterval);
    }

    dropSpeed = Math.max(100, 1000 - gameState.level * 50);
    gameInterval = setInterval(gameTick, dropSpeed);
}

// Stop game loop
function stopGameLoop() {
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
}

// Game tick - called every interval
function gameTick() {
    if (gameState.isPaused || gameState.isGameOver) {
        return;
    }

    if (canMove(currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
    } else {
        lockPiece();
        clearLines();
        spawnPiece();
    }

    draw();
}

// Lock piece to board
function lockPiece() {
    const shape = currentPiece.shape;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const y = currentPiece.y + row;
                const x = currentPiece.x + col;

                if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                    board[y][x] = currentPiece.color;
                }
            }
        }
    }

    // Reset hold flag when piece locks
    canHold = true;
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++; // Check the same row again
        }
    }

    if (linesCleared > 0) {
        gameState.lines += linesCleared;
        gameState.score += linesCleared * 100 * gameState.level;

        // Level up every 10 lines
        const newLevel = Math.floor(gameState.lines / 10) + 1;
        if (newLevel > gameState.level) {
            gameState.level = newLevel;
            startGameLoop(); // Restart loop with new speed
        }

        updateUI();
    }
}

// Update UI elements
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
}

// Handle keyboard input
function handleKeyPress(event) {
    switch(event.key) {
        case 'ArrowLeft':
            moveLeft();
            break;
        case 'ArrowRight':
            moveRight();
            break;
        case 'ArrowDown':
            moveDown();
            break;
        case 'c':
        case 'C':
            holdPiece();
            break;
    }
}

// Move piece left
function moveLeft() {
    if (canMove(currentPiece.x - 1, currentPiece.y)) {
        currentPiece.x--;
        draw();
    }
}

// Move piece right
function moveRight() {
    if (canMove(currentPiece.x + 1, currentPiece.y)) {
        currentPiece.x++;
        draw();
    }
}

// Move piece down
function moveDown() {
    if (canMove(currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
        draw();
    }
}

// Hold current piece
function holdPiece() {
    if (!canHold || gameState.isPaused || gameState.isGameOver) {
        return;
    }

    canHold = false;

    if (heldPiece === null) {
        // First hold - store current piece and spawn new one
        heldPiece = {
            type: currentPiece.type,
            color: currentPiece.color
        };
        spawnPiece();
    } else {
        // Swap current piece with held piece
        const tempType = currentPiece.type;
        const tempColor = currentPiece.color;

        // Restore held piece as current
        const pieceData = TETROMINO_SHAPES[heldPiece.type];
        currentPiece = {
            x: Math.floor(COLS / 2) - 2,
            y: 0,
            shape: pieceData.rotations[0],
            color: heldPiece.color,
            type: heldPiece.type,
            rotation: 0
        };

        // Store old current as held
        heldPiece = {
            type: tempType,
            color: tempColor
        };
    }

    drawHoldPiece();
    draw();
}

// Draw held piece in UI
function drawHoldPiece() {
    // Clear canvas
    holdCtx.fillStyle = '#ffffff';
    holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);

    if (heldPiece === null) {
        return;
    }

    const pieceData = TETROMINO_SHAPES[heldPiece.type];
    const shape = pieceData.rotations[0];
    const blockSize = 16;

    // Calculate centering offset
    const shapeWidth = shape[0].length;
    const shapeHeight = shape.length;
    const offsetX = (holdCanvas.width - shapeWidth * blockSize) / 2;
    const offsetY = (holdCanvas.height - shapeHeight * blockSize) / 2;

    holdCtx.fillStyle = heldPiece.color;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const x = offsetX + col * blockSize;
                const y = offsetY + row * blockSize;

                holdCtx.fillRect(x, y, blockSize, blockSize);
                holdCtx.strokeStyle = '#333333';
                holdCtx.lineWidth = 1;
                holdCtx.strokeRect(x, y, blockSize, blockSize);
            }
        }
    }
}

// Check if piece can move to new position
function canMove(newX, newY) {
    const shape = currentPiece.shape;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const x = newX + col;
                const y = newY + row;

                // Check left boundary
                if (x < 0) return false;

                // Check right boundary
                if (x >= COLS) return false;

                // Check bottom boundary
                if (y >= ROWS) return false;

                // Check collision with locked pieces
                if (y >= 0 && board[y][x] !== 0) return false;
            }
        }
    }

    return true;
}

// Draw the game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, row * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * BLOCK_SIZE, 0);
        ctx.lineTo(col * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }

    // Draw locked pieces on board
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col] !== 0) {
                ctx.fillStyle = board[row][col];
                const x = col * BLOCK_SIZE;
                const y = row * BLOCK_SIZE;

                ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }

    // Draw current piece
    if (currentPiece) {
        ctx.fillStyle = currentPiece.color;
        const shape = currentPiece.shape;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = (currentPiece.x + col) * BLOCK_SIZE;
                    const y = (currentPiece.y + row) * BLOCK_SIZE;

                    ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeStyle = '#333333';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
    }

    // Draw game over message
    if (gameState.isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
}

// Start game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
