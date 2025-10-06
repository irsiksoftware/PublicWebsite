/**
 * Tetris Game Logic
 * Implements collision detection and game mechanics
 */

// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 32;

// Game state
let grid = [];
let currentPiece = null;
let currentX = 0;
let currentY = 0;
let currentRotation = 0;

/**
 * Initialize the game grid
 */
function initGrid() {
    grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}

/**
 * Check collision detection
 * @param {number} x - X position to check
 * @param {number} y - Y position to check
 * @param {Array} piece - 2D array representing the piece shape
 * @returns {boolean} - true if collision detected, false otherwise
 */
function checkCollision(x, y, piece) {
    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            // Skip empty cells in the piece
            if (piece[row][col] === 0) {
                continue;
            }

            const newX = x + col;
            const newY = y + row;

            // Check left/right boundaries (0-9 for x)
            if (newX < 0 || newX >= COLS) {
                return true;
            }

            // Check bottom boundary (0-19 for y)
            if (newY < 0 || newY >= ROWS) {
                return true;
            }

            // Check if cell already occupied in grid
            if (grid[newY][newX] !== 0) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Lock the current piece in place on the grid
 */
function lockPiece() {
    const piece = TETROMINO_SHAPES[currentPiece].rotations[currentRotation];

    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col] === 1) {
                grid[currentY + row][currentX + col] = currentPiece;
            }
        }
    }
}

/**
 * Move piece down one row
 * @returns {boolean} - true if moved successfully, false if locked
 */
function moveDown() {
    const piece = TETROMINO_SHAPES[currentPiece].rotations[currentRotation];

    // Check if movement would cause collision
    if (checkCollision(currentX, currentY + 1, piece)) {
        // Lock piece in place when collision on moveDown
        lockPiece();
        return false;
    }

    // Move down
    currentY++;
    return true;
}

/**
 * Move piece left
 * @returns {boolean} - true if moved successfully
 */
function moveLeft() {
    const piece = TETROMINO_SHAPES[currentPiece].rotations[currentRotation];

    // Prevent movement if collision detected
    if (checkCollision(currentX - 1, currentY, piece)) {
        return false;
    }

    currentX--;
    return true;
}

/**
 * Move piece right
 * @returns {boolean} - true if moved successfully
 */
function moveRight() {
    const piece = TETROMINO_SHAPES[currentPiece].rotations[currentRotation];

    // Prevent movement if collision detected
    if (checkCollision(currentX + 1, currentY, piece)) {
        return false;
    }

    currentX++;
    return true;
}

/**
 * Rotate piece
 * @returns {boolean} - true if rotated successfully
 */
function rotate() {
    const newRotation = (currentRotation + 1) % 4;
    const piece = TETROMINO_SHAPES[currentPiece].rotations[newRotation];

    // Prevent rotation if collision detected
    if (checkCollision(currentX, currentY, piece)) {
        return false;
    }

    currentRotation = newRotation;
    return true;
}

// Initialize game on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        initGrid();
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkCollision,
        initGrid,
        lockPiece,
        moveDown,
        moveLeft,
        moveRight,
        rotate,
        COLS,
        ROWS
    };
}
