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
let previewCanvas;
let previewCtx;
let holdCanvas;
let holdCtx;
let currentPiece = null;
let nextPiece = null;
let heldPiece = null;
let canHold = true;
let board = [];
let gameState = {
    score: 0,
    level: 1,
    lines: 0,
    highScore: 0,
    isPaused: false,
    isGameOver: false
};
let gameInterval = null;
let dropSpeed = 1000;

// Initialize game
function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');

    previewCanvas = document.getElementById('next-piece');
    previewCtx = previewCanvas.getContext('2d');

    holdCanvas = document.getElementById('hold-piece');
    holdCtx = holdCanvas.getContext('2d');

    // Load high score from localStorage
    loadHighScore();

    // Initialize board
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));

    // Generate next piece
    generateNextPiece();

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
    drawNextPiece();
}

// Generate next piece
function generateNextPiece() {
    const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    const pieceData = TETROMINO_SHAPES[randomPiece];

    nextPiece = {
        shape: pieceData.rotations[0],
        color: pieceData.color,
        type: randomPiece
    };
}

// Spawn new piece
function spawnPiece() {
    // Use the next piece as the current piece
    currentPiece = {
        x: Math.floor(COLS / 2) - 2,
        y: 0,
        shape: nextPiece.shape,
        color: nextPiece.color,
        type: nextPiece.type,
        rotation: 0
    };

    // Generate new next piece
    generateNextPiece();
    drawNextPiece();

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

    // Reset canHold when piece locks
    canHold = true;
}

// Clear completed lines
function clearLines() {
    // Check all rows for completion
    const fullRows = [];
    for (let row = 0; row < ROWS; row++) {
        if (board[row].every(cell => cell !== 0)) {
            fullRows.push(row);
        }
    }

    if (fullRows.length === 0) {
        return;
    }

    // Flash rows briefly before clearing
    flashRows(fullRows, () => {
        // Remove cleared rows and shift blocks down
        for (let i = fullRows.length - 1; i >= 0; i--) {
            board.splice(fullRows[i], 1);
            board.unshift(Array(COLS).fill(0));
        }

        // Update lines cleared count
        gameState.lines += fullRows.length;

        // Calculate score based on lines cleared
        const lineScores = {
            1: 100,
            2: 300,
            3: 500,
            4: 800
        };
        gameState.score += (lineScores[fullRows.length] || 100) * gameState.level;

        // Update high score
        updateHighScore();

        // Level up every 10 lines
        const newLevel = Math.floor(gameState.lines / 10) + 1;
        if (newLevel > gameState.level) {
            gameState.level = newLevel;
            startGameLoop(); // Restart loop with new speed
        }

        updateUI();
        draw();
    });
}

// Flash rows with color change animation
function flashRows(rows, callback) {
    const originalColors = [];

    // Save original colors
    for (const row of rows) {
        originalColors.push([...board[row]]);
    }

    let flashCount = 0;
    const maxFlashes = 3;
    const flashInterval = 100; // ms

    const flashTimer = setInterval(() => {
        // Alternate between white and original colors
        const useWhite = flashCount % 2 === 0;

        for (const row of rows) {
            for (let col = 0; col < COLS; col++) {
                board[row][col] = useWhite ? '#ffffff' : originalColors[rows.indexOf(row)][col];
            }
        }

        draw();
        flashCount++;

        if (flashCount >= maxFlashes * 2) {
            clearInterval(flashTimer);
            callback();
        }
    }, flashInterval);
}

// Load high score from localStorage
function loadHighScore() {
    const savedHighScore = localStorage.getItem('tetrisHighScore');
    if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore, 10);
    }
}

// Update high score
function updateHighScore() {
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('tetrisHighScore', gameState.highScore.toString());
    }
}

// Update UI elements
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('lines').textContent = gameState.lines;
    document.getElementById('high-score').textContent = gameState.highScore;
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
        case 'ArrowUp':
            rotatePiece();
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
    } else {
        // Lock piece when collision detected on moveDown
        lockPiece();
        clearLines();
        spawnPiece();
        draw();
    }
}

// Rotate piece with wall kicks (SRS standard)
function rotatePiece() {
    if (gameState.isPaused || gameState.isGameOver || !currentPiece) {
        return;
    }

    const pieceData = TETROMINO_SHAPES[currentPiece.type];
    const nextRotation = (currentPiece.rotation + 1) % 4;
    const newShape = pieceData.rotations[nextRotation];

    // Try rotation at current position
    if (!checkCollision(currentPiece.x, currentPiece.y, newShape)) {
        currentPiece.rotation = nextRotation;
        currentPiece.shape = newShape;
        draw();
        return;
    }

    // Wall kick attempts: try offsets ±1, ±2
    const wallKickOffsets = [1, -1, 2, -2];
    for (const offset of wallKickOffsets) {
        if (!checkCollision(currentPiece.x + offset, currentPiece.y, newShape)) {
            currentPiece.x += offset;
            currentPiece.rotation = nextRotation;
            currentPiece.shape = newShape;
            draw();
            return;
        }
    }

    // All kicks failed, don't rotate
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

// Check collision at specific position with specific piece
function checkCollision(x, y, piece) {
    const shape = piece || currentPiece.shape;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const gridX = x + col;
                const gridY = y + row;

                // Check grid boundaries (0-9 for x, 0-19 for y)
                if (gridX < 0 || gridX >= COLS) return true;
                if (gridY < 0 || gridY >= ROWS) return true;

                // Check if cell already occupied in grid
                if (gridY >= 0 && board[gridY][gridX] !== 0) return true;
            }
        }
    }

    return false;
}

// Draw grid borders and background
function drawGrid() {
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
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
}

// Draw the game
function draw() {
    // Clear and redraw grid
    drawGrid();

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

// Draw next piece in preview canvas
function drawNextPiece() {
    // Clear preview canvas
    previewCtx.fillStyle = '#ffffff';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

    if (!nextPiece) return;

    const shape = nextPiece.shape;
    const blockSize = 16; // Smaller blocks for preview

    // Calculate piece dimensions
    let minRow = shape.length, maxRow = 0, minCol = shape[0].length, maxCol = 0;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                minRow = Math.min(minRow, row);
                maxRow = Math.max(maxRow, row);
                minCol = Math.min(minCol, col);
                maxCol = Math.max(maxCol, col);
            }
        }
    }

    const pieceWidth = (maxCol - minCol + 1) * blockSize;
    const pieceHeight = (maxRow - minRow + 1) * blockSize;

    // Center the piece in the preview canvas
    const offsetX = (previewCanvas.width - pieceWidth) / 2;
    const offsetY = (previewCanvas.height - pieceHeight) / 2;

    // Draw the piece
    previewCtx.fillStyle = nextPiece.color;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const x = offsetX + (col - minCol) * blockSize;
                const y = offsetY + (row - minRow) * blockSize;

                previewCtx.fillRect(x, y, blockSize, blockSize);
                previewCtx.strokeStyle = '#333333';
                previewCtx.lineWidth = 1;
                previewCtx.strokeRect(x, y, blockSize, blockSize);
            }
        }
    }
}

// Draw held piece in hold canvas
function drawHoldPiece() {
    // Clear hold canvas
    holdCtx.fillStyle = '#ffffff';
    holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);

    if (!heldPiece) return;

    const shape = heldPiece.shape;
    const blockSize = 16; // Smaller blocks for preview

    // Calculate piece dimensions
    let minRow = shape.length, maxRow = 0, minCol = shape[0].length, maxCol = 0;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                minRow = Math.min(minRow, row);
                maxRow = Math.max(maxRow, row);
                minCol = Math.min(minCol, col);
                maxCol = Math.max(maxCol, col);
            }
        }
    }

    const pieceWidth = (maxCol - minCol + 1) * blockSize;
    const pieceHeight = (maxRow - minRow + 1) * blockSize;

    // Center the piece in the hold canvas
    const offsetX = (holdCanvas.width - pieceWidth) / 2;
    const offsetY = (holdCanvas.height - pieceHeight) / 2;

    // Draw the piece
    holdCtx.fillStyle = heldPiece.color;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const x = offsetX + (col - minCol) * blockSize;
                const y = offsetY + (row - minRow) * blockSize;

                holdCtx.fillRect(x, y, blockSize, blockSize);
                holdCtx.strokeStyle = '#333333';
                holdCtx.lineWidth = 1;
                holdCtx.strokeRect(x, y, blockSize, blockSize);
            }
        }
    }
}

// Hold piece function
function holdPiece() {
    if (gameState.isPaused || gameState.isGameOver || !currentPiece || !canHold) {
        return;
    }

    canHold = false;

    if (heldPiece === null) {
        // Store current piece and spawn next piece
        heldPiece = {
            shape: TETROMINO_SHAPES[currentPiece.type].rotations[0],
            color: currentPiece.color,
            type: currentPiece.type
        };
        spawnPiece();
    } else {
        // Swap current piece with held piece
        const tempType = currentPiece.type;
        const tempColor = currentPiece.color;

        currentPiece = {
            x: Math.floor(COLS / 2) - 2,
            y: 0,
            shape: heldPiece.shape,
            color: heldPiece.color,
            type: heldPiece.type,
            rotation: 0
        };

        heldPiece = {
            shape: TETROMINO_SHAPES[tempType].rotations[0],
            color: tempColor,
            type: tempType
        };

        // Check if spawn position is valid
        if (!canMove(currentPiece.x, currentPiece.y)) {
            gameState.isGameOver = true;
            stopGameLoop();
        }
    }

    drawHoldPiece();
    draw();
}

// Start game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
