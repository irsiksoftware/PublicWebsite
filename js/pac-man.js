class PacManGame {
    constructor() {
        this.canvas = document.getElementById('pac-man-game');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Grid settings
        this.tileSize = 20;
        this.cols = 28;
        this.rows = 31;

        // Game state
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('pacmanHighScore')) || 0;
        this.level = 1;
        this.lives = 3;
        this.paused = false;
        this.gameOver = false;
        this.dotsEaten = 0;
        this.totalDots = 0;

        // Pac-Man
        this.pacman = {
            x: 14,
            y: 23,
            direction: 0, // 0: right, 1: down, 2: left, 3: up
            nextDirection: 0,
            mouthOpen: 0,
            speed: 0.08
        };

        // Ghosts
        this.ghosts = [
            { x: 14, y: 11, color: '#FF0000', targetX: 0, targetY: 0, mode: 'scatter' }, // Blinky (red)
            { x: 12, y: 14, color: '#FFB8FF', targetX: 0, targetY: 0, mode: 'scatter' }, // Pinky (pink)
            { x: 14, y: 14, color: '#00FFFF', targetX: 0, targetY: 0, mode: 'scatter' }, // Inky (cyan)
            { x: 16, y: 14, color: '#FFB852', targetX: 0, targetY: 0, mode: 'scatter' }  // Clyde (orange)
        ];

        this.powerMode = false;
        this.powerModeTimer = 0;

        // Maze layout (1 = wall, 0 = dot, 2 = power pellet, 3 = empty)
        this.maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,2,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,2,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
            [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,0,1,1,1,1,1,3,1,1,3,1,1,1,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,1,1,1,3,1,1,3,1,1,1,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,3,3,3,3,3,3,3,3,3,3,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,3,1,1,1,3,3,1,1,1,3,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,3,1,3,3,3,3,3,3,1,3,1,1,0,1,1,1,1,1,1],
            [3,3,3,3,3,3,0,3,3,3,1,3,3,3,3,3,3,1,3,3,3,0,3,3,3,3,3,3],
            [1,1,1,1,1,1,0,1,1,3,1,3,3,3,3,3,3,1,3,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,3,1,1,1,1,1,1,1,1,3,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,3,3,3,3,3,3,3,3,3,3,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,3,1,1,1,1,1,1,1,1,3,1,1,0,1,1,1,1,1,1],
            [1,1,1,1,1,1,0,1,1,3,1,1,1,1,1,1,1,1,3,1,1,0,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
            [1,2,0,0,1,1,0,0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,1,1,0,0,2,1],
            [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
            [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
            [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
            [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];

        this.originalMaze = JSON.parse(JSON.stringify(this.maze));
        this.countDots();

        this.keys = {};
        this.setupControls();
        this.lastTime = 0;
        this.updateUI();

        // Start game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    countDots() {
        this.totalDots = 0;
        for (let row of this.maze) {
            for (let cell of row) {
                if (cell === 0 || cell === 2) {
                    this.totalDots++;
                }
            }
        }
    }

    setupControls() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            if (e.key.toLowerCase() === 'p') {
                this.paused = !this.paused;
            }

            // Arrow keys and WASD
            if (e.key === 'ArrowRight' || e.key === 'd') this.pacman.nextDirection = 0;
            if (e.key === 'ArrowDown' || e.key === 's') this.pacman.nextDirection = 1;
            if (e.key === 'ArrowLeft' || e.key === 'a') this.pacman.nextDirection = 2;
            if (e.key === 'ArrowUp' || e.key === 'w') this.pacman.nextDirection = 3;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mobile controls
        const btnUp = document.getElementById('btn-up');
        const btnDown = document.getElementById('btn-down');
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');

        if (btnUp) btnUp.addEventListener('click', () => this.pacman.nextDirection = 3);
        if (btnDown) btnDown.addEventListener('click', () => this.pacman.nextDirection = 1);
        if (btnLeft) btnLeft.addEventListener('click', () => this.pacman.nextDirection = 2);
        if (btnRight) btnRight.addEventListener('click', () => this.pacman.nextDirection = 0);
    }

    canMove(x, y, direction) {
        const dirX = [1, 0, -1, 0][direction];
        const dirY = [0, 1, 0, -1][direction];
        const newX = x + dirX * this.pacman.speed;
        const newY = y + dirY * this.pacman.speed;

        // Simple collision check - just check center and direction of movement
        const col = Math.floor(newX);
        const row = Math.floor(newY);

        // Check bounds
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return false;
        }

        // Check if hitting a wall
        if (this.maze[row][col] === 1) {
            return false;
        }

        return true;
    }

    update(deltaTime) {
        if (this.paused || this.gameOver) return;

        // Try to turn in next direction
        if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.nextDirection)) {
            this.pacman.direction = this.pacman.nextDirection;
        }

        // Move Pac-Man
        if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.direction)) {
            const dirX = [1, 0, -1, 0][this.pacman.direction];
            const dirY = [0, 1, 0, -1][this.pacman.direction];
            this.pacman.x += dirX * this.pacman.speed;
            this.pacman.y += dirY * this.pacman.speed;

            // Animate mouth
            this.pacman.mouthOpen += deltaTime * 0.01;
        }

        // Wrap around
        if (this.pacman.x < 0) this.pacman.x = this.cols - 1;
        if (this.pacman.x >= this.cols) this.pacman.x = 0;

        // Check for dots and power pellets
        const col = Math.floor(this.pacman.x);
        const row = Math.floor(this.pacman.y);

        if (this.maze[row][col] === 0) {
            this.maze[row][col] = 3;
            this.score += 10;
            this.dotsEaten++;
        } else if (this.maze[row][col] === 2) {
            this.maze[row][col] = 3;
            this.score += 50;
            this.dotsEaten++;
            this.activatePowerMode();
        }

        // Check if level complete
        if (this.dotsEaten >= this.totalDots) {
            this.nextLevel();
        }

        // Update power mode
        if (this.powerMode) {
            this.powerModeTimer -= deltaTime;
            if (this.powerModeTimer <= 0) {
                this.powerMode = false;
            }
        }

        // Move ghosts
        this.updateGhosts(deltaTime);

        // Check collision with ghosts
        this.checkGhostCollision();

        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pacmanHighScore', this.highScore);
        }

        this.updateUI();
    }

    activatePowerMode() {
        this.powerMode = true;
        this.powerModeTimer = 8000; // 8 seconds
        this.ghosts.forEach(ghost => ghost.mode = 'frightened');
    }

    canGhostMove(ghostX, ghostY, direction, speed) {
        const dirX = [1, 0, -1, 0][direction];
        const dirY = [0, 1, 0, -1][direction];
        const newX = ghostX + dirX * speed;
        const newY = ghostY + dirY * speed;

        // Simple collision check
        const col = Math.floor(newX);
        const row = Math.floor(newY);

        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return false;
        }

        if (this.maze[row][col] === 1) {
            return false;
        }

        return true;
    }

    updateGhosts(deltaTime) {
        const speed = this.powerMode ? 0.04 : 0.06;

        this.ghosts.forEach((ghost, index) => {
            // Simple AI: move toward target
            let targetX, targetY;

            if (this.powerMode) {
                // Run away from Pac-Man
                targetX = ghost.x + (ghost.x - this.pacman.x);
                targetY = ghost.y + (ghost.y - this.pacman.y);
            } else {
                // Chase Pac-Man (with slight variations per ghost)
                targetX = this.pacman.x + [0, 2, -2, 0][index];
                targetY = this.pacman.y + [0, -2, 0, 2][index];
            }

            // Find best direction
            const directions = [0, 1, 2, 3];
            let bestDir = 0;
            let bestDist = Infinity;

            for (let dir of directions) {
                if (this.canGhostMove(ghost.x, ghost.y, dir, speed)) {
                    const dirX = [1, 0, -1, 0][dir];
                    const dirY = [0, 1, 0, -1][dir];
                    const newX = ghost.x + dirX * speed;
                    const newY = ghost.y + dirY * speed;

                    const dist = Math.sqrt(Math.pow(newX - targetX, 2) + Math.pow(newY - targetY, 2));
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestDir = dir;
                    }
                }
            }

            // Move ghost
            const dirX = [1, 0, -1, 0][bestDir];
            const dirY = [0, 1, 0, -1][bestDir];
            ghost.x += dirX * speed;
            ghost.y += dirY * speed;
        });
    }

    checkGhostCollision() {
        this.ghosts.forEach((ghost, index) => {
            const dist = Math.sqrt(Math.pow(ghost.x - this.pacman.x, 2) + Math.pow(ghost.y - this.pacman.y, 2));
            if (dist < 0.5) {
                if (this.powerMode) {
                    // Eat ghost
                    this.score += 200;
                    ghost.x = 14;
                    ghost.y = 14;
                } else {
                    // Lose life
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver = true;
                    } else {
                        this.resetPositions();
                    }
                }
            }
        });
    }

    resetPositions() {
        this.pacman.x = 14;
        this.pacman.y = 23;
        this.pacman.direction = 0;
        this.pacman.nextDirection = 0;

        this.ghosts[0].x = 14;
        this.ghosts[0].y = 11;
        this.ghosts[1].x = 12;
        this.ghosts[1].y = 14;
        this.ghosts[2].x = 14;
        this.ghosts[2].y = 14;
        this.ghosts[3].x = 16;
        this.ghosts[3].y = 14;
    }

    nextLevel() {
        this.level++;
        this.dotsEaten = 0;
        this.maze = JSON.parse(JSON.stringify(this.originalMaze));
        this.resetPositions();
        this.pacman.speed += 0.005; // Speed up slightly
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw maze
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.maze[row][col];
                const x = col * this.tileSize;
                const y = row * this.tileSize;

                if (cell === 1) {
                    // Wall
                    this.ctx.fillStyle = '#0000FF';
                    this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
                } else if (cell === 0) {
                    // Dot
                    this.ctx.fillStyle = '#FFB8AE';
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (cell === 2) {
                    // Power pellet
                    this.ctx.fillStyle = '#FFB8AE';
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }

        // Draw ghosts
        this.ghosts.forEach(ghost => {
            const x = ghost.x * this.tileSize;
            const y = ghost.y * this.tileSize;

            this.ctx.fillStyle = this.powerMode ? '#0000FF' : ghost.color;
            this.ctx.beginPath();
            this.ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, this.tileSize / 2 - 2, Math.PI, 0);
            this.ctx.lineTo(x + this.tileSize - 2, y + this.tileSize);
            this.ctx.lineTo(x + (this.tileSize * 3/4), y + this.tileSize - 4);
            this.ctx.lineTo(x + this.tileSize / 2, y + this.tileSize);
            this.ctx.lineTo(x + this.tileSize / 4, y + this.tileSize - 4);
            this.ctx.lineTo(x + 2, y + this.tileSize);
            this.ctx.closePath();
            this.ctx.fill();

            // Eyes
            if (!this.powerMode) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(x + 5, y + 6, 4, 6);
                this.ctx.fillRect(x + 11, y + 6, 4, 6);
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(x + 6, y + 8, 2, 3);
                this.ctx.fillRect(x + 12, y + 8, 2, 3);
            }
        });

        // Draw Pac-Man
        const pacX = this.pacman.x * this.tileSize;
        const pacY = this.pacman.y * this.tileSize;
        const radius = this.tileSize / 2 - 2;

        const mouthAngle = Math.abs(Math.sin(this.pacman.mouthOpen)) * 0.4;
        const rotation = this.pacman.direction * Math.PI / 2;

        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(pacX + this.tileSize / 2, pacY + this.tileSize / 2, radius,
                     rotation + mouthAngle, rotation + Math.PI * 2 - mouthAngle);
        this.ctx.lineTo(pacX + this.tileSize / 2, pacY + this.tileSize / 2);
        this.ctx.closePath();
        this.ctx.fill();

        // Game over / paused text
        if (this.gameOver) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press F5 to restart', this.width / 2, this.height / 2 + 40);
        } else if (this.paused) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lives').textContent = this.lives;
    }

    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new PacManGame();
});
