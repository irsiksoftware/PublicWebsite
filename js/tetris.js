/**
 * Tetris Game Implementation
 * Features: Piece rotation with SRS wall kicks
 */

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 32;

let canvas;
let ctx;
let nextPieceCanvas;
let nextPieceCtx;
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let gameInterval = null;

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    nextPieceCanvas = document.getElementById('next-piece');
    nextPieceCtx = nextPieceCanvas.getContext('2d');

    initBoard();
    nextPiece = createPiece();
    spawnPiece();
    startGame();

    document.addEventListener('keydown', handleKeyPress);
});

function initBoard() {
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0;
        }
    }
}

function createPiece() {
    const shapes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const shapeData = TETROMINO_SHAPES[shape];

    return {
        shape: shape,
        rotation: 0,
        x: Math.floor(COLS / 2) - 1,
        y: 0,
        color: shapeData.color,
        matrix: shapeData.rotations[0]
    };
}

function spawnPiece() {
    currentPiece = nextPiece;
    nextPiece = createPiece();
    drawNextPiece();

    if (collides(currentPiece)) {
        gameOver();
    }
}

function handleKeyPress(e) {
    if (!currentPiece) return;

    switch(e.key) {
        case 'ArrowLeft':
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            movePiece(0, 1);
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
    }
    draw();
}

function movePiece(dx, dy) {
    currentPiece.x += dx;
    currentPiece.y += dy;

    if (collides(currentPiece)) {
        currentPiece.x -= dx;
        currentPiece.y -= dy;

        if (dy > 0) {
            lockPiece();
        }
    }
}

function rotatePiece() {
    const originalRotation = currentPiece.rotation;
    const originalX = currentPiece.x;

    // Cycle to next rotation state (0 -> 1 -> 2 -> 3 -> 0)
    currentPiece.rotation = (currentPiece.rotation + 1) % 4;
    currentPiece.matrix = TETROMINO_SHAPES[currentPiece.shape].rotations[currentPiece.rotation];

    // If rotation causes collision, try wall kicks
    if (collides(currentPiece)) {
        // SRS wall kick offsets: try ±1, ±2 x positions
        const wallKicks = [1, -1, 2, -2];
        let rotationSuccessful = false;

        for (let kick of wallKicks) {
            currentPiece.x = originalX + kick;

            if (!collides(currentPiece)) {
                rotationSuccessful = true;
                break;
            }
        }

        // If all kicks fail, revert rotation
        if (!rotationSuccessful) {
            currentPiece.rotation = originalRotation;
            currentPiece.x = originalX;
            currentPiece.matrix = TETROMINO_SHAPES[currentPiece.shape].rotations[originalRotation];
        }
    }
}

function collides(piece) {
    const matrix = piece.matrix;

    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col]) {
                const boardX = piece.x + col;
                const boardY = piece.y + row;

                // Check boundaries
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                    return true;
                }

                // Check collision with locked pieces (only if boardY >= 0)
                if (boardY >= 0 && board[boardY][boardX]) {
                    return true;
                }
            }
        }
    }

    return false;
}

function lockPiece() {
    const matrix = currentPiece.matrix;

    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col]) {
                const boardY = currentPiece.y + row;
                const boardX = currentPiece.x + col;

                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        }
    }

    clearLines();
    spawnPiece();
}

function clearLines() {
    let linesCleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(new Array(COLS).fill(0));
            linesCleared++;
            row++;
        }
    }

    if (linesCleared > 0) {
        score += linesCleared * 100 * level;
        updateScore();
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e9ecef';
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

    // Draw locked pieces
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                ctx.fillStyle = board[row][col];
                ctx.fillRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#ffffff';
                ctx.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }

    // Draw current piece
    if (currentPiece) {
        ctx.fillStyle = currentPiece.color;
        const matrix = currentPiece.matrix;

        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[row].length; col++) {
                if (matrix[row][col]) {
                    const x = (currentPiece.x + col) * BLOCK_SIZE;
                    const y = (currentPiece.y + row) * BLOCK_SIZE;
                    ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeStyle = '#ffffff';
                    ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
    }
}

function drawNextPiece() {
    nextPieceCtx.fillStyle = '#f8f9fa';
    nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);

    if (nextPiece) {
        const matrix = nextPiece.matrix;
        const blockSize = 16;
        const offsetX = (nextPieceCanvas.width - matrix[0].length * blockSize) / 2;
        const offsetY = (nextPieceCanvas.height - matrix.length * blockSize) / 2;

        nextPieceCtx.fillStyle = nextPiece.color;

        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[row].length; col++) {
                if (matrix[row][col]) {
                    const x = offsetX + col * blockSize;
                    const y = offsetY + row * blockSize;
                    nextPieceCtx.fillRect(x, y, blockSize, blockSize);
                    nextPieceCtx.strokeStyle = '#ffffff';
                    nextPieceCtx.strokeRect(x, y, blockSize, blockSize);
                }
            }
        }
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

function startGame() {
    gameInterval = setInterval(() => {
        if (currentPiece) {
            movePiece(0, 1);
            draw();
        }
    }, 1000);

    draw();
}

function gameOver() {
    clearInterval(gameInterval);
    alert('Game Over! Score: ' + score);
}
