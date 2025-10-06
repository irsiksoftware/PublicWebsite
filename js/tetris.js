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
let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let score = 0;
let level = 1;
let linesCleared = 0;
let highScore = 0;

// Initialize game
function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');

    // Load high score from localStorage
    highScore = parseInt(localStorage.getItem('tetrisHighScore')) || 0;

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
    updateUI();
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
        // Piece has landed - lock it and check for completed lines
        lockPiece();
        clearLines();
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
            }
        }
    }

    return true;
}

// Lock piece into board
function lockPiece() {
    const shape = currentPiece.shape;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const x = currentPiece.x + col;
                const y = currentPiece.y + row;
                if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                    board[y][x] = currentPiece.color;
                }
            }
        }
    }
}

// Clear completed lines and update score
function clearLines() {
    let completedLines = 0;

    // Check each row from bottom to top
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            // Remove completed line
            board.splice(row, 1);
            // Add new empty line at top
            board.unshift(Array(COLS).fill(0));
            completedLines++;
            row++; // Recheck this row since we removed one
        }
    }

    // Update score based on lines cleared
    if (completedLines > 0) {
        const scoreValues = [0, 100, 300, 500, 800];
        score += scoreValues[completedLines];
        linesCleared += completedLines;

        // Update level (every 10 lines)
        level = Math.floor(linesCleared / 10) + 1;

        // Update high score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('tetrisHighScore', highScore);
        }

        updateUI();
    }

    draw();
}

// Update UI display
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = linesCleared;
    document.getElementById('high-score').textContent = highScore;
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
            if (board[row][col]) {
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
}

// Start game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
