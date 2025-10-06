// Game configuration
const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 32;

// Get canvas and context
const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');

// Draw the grid
function drawGrid() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * CELL_SIZE, 0);
        ctx.lineTo(col * CELL_SIZE, ROWS * CELL_SIZE);
        ctx.stroke();
    }

    // Draw horizontal lines
    for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * CELL_SIZE);
        ctx.lineTo(COLS * CELL_SIZE, row * CELL_SIZE);
        ctx.stroke();
    }

    // Draw outer border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, COLS * CELL_SIZE, ROWS * CELL_SIZE);
}

// Game loop
function gameLoop() {
    drawGrid();
    requestAnimationFrame(gameLoop);
}

// Initialize game
drawGrid();
gameLoop();
