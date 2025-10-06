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
let board = Array(ROWS).fill().map(() => Array(COLS).fill(null));
let linesCleared = 0;
let level = 1;

// Initialize game
function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');

    // Initialize current piece at top center
    currentPiece = {
        x: Math.floor(COLS / 2) - 2,
        y: 0,
        shape: TETROMINO_SHAPES.I.rotations[0],
        color: TETROMINO_SHAPES.I.color
    };

    // Set up keyboard controls
    document.addEventListener('keydown', handleKeyPress);

    // Initial draw
    draw();
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
        lockPiece();
        checkLines();
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
                if (board[y] && board[y][x]) return false;
            }
        }
    }

    return true;
}

// Lock piece to board
function lockPiece() {
    const shape = currentPiece.shape;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const x = currentPiece.x + col;
                const y = currentPiece.y + row;
                if (board[y]) {
                    board[y][x] = currentPiece.color;
                }
            }
        }
    }
}

// Check for completed lines
function checkLines() {
    const fullRows = [];

    // Identify full rows
    for (let row = 0; row < ROWS; row++) {
        if (board[row].every(cell => cell !== null)) {
            fullRows.push(row);
        }
    }

    if (fullRows.length > 0) {
        flashRows(fullRows);
    }
}

// Flash rows before clearing
function flashRows(rows) {
    let flashCount = 0;
    const flashInterval = setInterval(() => {
        // Toggle flash state
        rows.forEach(row => {
            for (let col = 0; col < COLS; col++) {
                if (flashCount % 2 === 0) {
                    board[row][col] = '#ffffff';
                } else {
                    board[row][col] = '#ffff00';
                }
            }
        });
        draw();

        flashCount++;
        if (flashCount >= 4) {
            clearInterval(flashInterval);
            clearRows(rows);
        }
    }, 100);
}

// Clear rows and shift blocks down
function clearRows(rows) {
    // Sort rows in descending order
    rows.sort((a, b) => b - a);

    // Remove each row and add empty row at top
    rows.forEach(row => {
        board.splice(row, 1);
        board.unshift(Array(COLS).fill(null));
    });

    // Update lines cleared count
    linesCleared += rows.length;

    // Update level (every 10 lines)
    const newLevel = Math.floor(linesCleared / 10) + 1;
    if (newLevel !== level) {
        level = newLevel;
        updateLevelDisplay();
    }

    updateLinesDisplay();
    draw();
}

// Update level display
function updateLevelDisplay() {
    const levelElement = document.getElementById('level');
    if (levelElement) {
        levelElement.textContent = level;
    }
}

// Update lines cleared display
function updateLinesDisplay() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = linesCleared;
    }
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

    // Draw locked blocks on board
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                ctx.fillStyle = board[row][col];
                ctx.fillRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 2;
                ctx.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
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
}

// Start game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
