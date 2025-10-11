// DOOM-style raycasting game engine
class DoomGame {
    constructor() {
        this.canvas = document.getElementById('doom-game');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Game state
        this.paused = false;
        this.gameOver = false;

        // Player stats
        this.health = 100;
        this.armor = 0;
        this.ammo = 50;
        this.kills = 0;

        // Player position and direction
        this.playerX = 5;
        this.playerY = 5;
        this.playerAngle = 0;
        this.playerSpeed = 0.05;
        this.rotationSpeed = 0.05;

        // Map (1 = wall, 0 = empty)
        this.map = [
            [1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,0,0,1,1,0,1],
            [1,0,1,0,0,0,0,1,0,1],
            [1,0,0,0,1,1,0,0,0,1],
            [1,0,0,0,1,1,0,0,0,1],
            [1,0,1,0,0,0,0,1,0,1],
            [1,0,1,1,0,0,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1]
        ];

        // Enemies
        this.enemies = [
            { x: 7, y: 2, health: 100, angle: 0 },
            { x: 3, y: 7, health: 100, angle: Math.PI },
            { x: 8, y: 8, health: 100, angle: Math.PI / 2 }
        ];

        // Input state
        this.keys = {};

        // Raycasting parameters
        this.fov = Math.PI / 3;
        this.numRays = 120;
        this.maxDepth = 20;

        // Wall colors
        this.wallColors = ['#4a4a4a', '#6a6a6a', '#8a8a8a', '#aaaaaa'];

        this.init();
    }

    init() {
        this.setupControls();
        this.updateUI();
        this.gameLoop();
    }

    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            if (e.key.toLowerCase() === 'p') {
                this.togglePause();
            }

            if (e.key === ' ' || e.key === 'Control') {
                e.preventDefault();
                this.shoot();
            }

            if (e.key.toLowerCase() === 'e') {
                this.use();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mobile controls
        const btnForward = document.getElementById('btn-forward');
        const btnBack = document.getElementById('btn-back');
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnShoot = document.getElementById('btn-shoot');
        const btnAction = document.getElementById('btn-action');

        if (btnForward) {
            btnForward.addEventListener('touchstart', () => this.keys['w'] = true);
            btnForward.addEventListener('touchend', () => this.keys['w'] = false);
        }

        if (btnBack) {
            btnBack.addEventListener('touchstart', () => this.keys['s'] = true);
            btnBack.addEventListener('touchend', () => this.keys['s'] = false);
        }

        if (btnLeft) {
            btnLeft.addEventListener('touchstart', () => this.keys['a'] = true);
            btnLeft.addEventListener('touchend', () => this.keys['a'] = false);
        }

        if (btnRight) {
            btnRight.addEventListener('touchstart', () => this.keys['d'] = true);
            btnRight.addEventListener('touchend', () => this.keys['d'] = false);
        }

        if (btnShoot) {
            btnShoot.addEventListener('click', () => this.shoot());
        }

        if (btnAction) {
            btnAction.addEventListener('click', () => this.use());
        }
    }

    togglePause() {
        this.paused = !this.paused;
    }

    shoot() {
        if (this.paused || this.gameOver || this.ammo <= 0) return;

        this.ammo--;

        // Check if we hit an enemy
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dx = enemy.x - this.playerX;
            const dy = enemy.y - this.playerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            let angleDiff = angle - this.playerAngle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            // Check if enemy is in crosshair (within 5 degrees)
            if (Math.abs(angleDiff) < 0.09 && distance < 8) {
                enemy.health -= 34;
                if (enemy.health <= 0) {
                    this.enemies.splice(i, 1);
                    this.kills++;
                }
                break;
            }
        }

        this.updateUI();
    }

    use() {
        // Placeholder for using doors, switches, etc.
    }

    handleInput() {
        if (this.paused || this.gameOver) return;

        const moveX = Math.cos(this.playerAngle) * this.playerSpeed;
        const moveY = Math.sin(this.playerAngle) * this.playerSpeed;

        // Forward/backward movement
        if (this.keys['w'] || this.keys['arrowup']) {
            const newX = this.playerX + moveX;
            const newY = this.playerY + moveY;
            if (!this.isWall(newX, newY)) {
                this.playerX = newX;
                this.playerY = newY;
            }
        }

        if (this.keys['s'] || this.keys['arrowdown']) {
            const newX = this.playerX - moveX;
            const newY = this.playerY - moveY;
            if (!this.isWall(newX, newY)) {
                this.playerX = newX;
                this.playerY = newY;
            }
        }

        // Rotation
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.playerAngle -= this.rotationSpeed;
        }

        if (this.keys['d'] || this.keys['arrowright']) {
            this.playerAngle += this.rotationSpeed;
        }

        // Check enemy collisions and damage
        for (const enemy of this.enemies) {
            const dx = enemy.x - this.playerX;
            const dy = enemy.y - this.playerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 0.5) {
                this.takeDamage(1);
            }
        }
    }

    takeDamage(amount) {
        if (this.armor > 0) {
            const armorAbsorb = Math.min(this.armor, amount);
            this.armor -= armorAbsorb;
            amount -= armorAbsorb;
        }

        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.gameOver = true;
        }

        this.updateUI();
    }

    isWall(x, y) {
        const mapX = Math.floor(x);
        const mapY = Math.floor(y);

        if (mapX < 0 || mapX >= this.map[0].length || mapY < 0 || mapY >= this.map.length) {
            return true;
        }

        return this.map[mapY][mapX] === 1;
    }

    castRay(angle) {
        const stepSize = 0.1;
        let distance = 0;

        while (distance < this.maxDepth) {
            const x = this.playerX + Math.cos(angle) * distance;
            const y = this.playerY + Math.sin(angle) * distance;

            if (this.isWall(x, y)) {
                return distance;
            }

            distance += stepSize;
        }

        return this.maxDepth;
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw ceiling
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.width, this.height / 2);

        // Draw floor
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, this.height / 2, this.width, this.height / 2);

        // Cast rays and draw walls
        const rayAngleStep = this.fov / this.numRays;
        const rayWidth = this.width / this.numRays;

        for (let i = 0; i < this.numRays; i++) {
            const rayAngle = this.playerAngle - this.fov / 2 + rayAngleStep * i;
            const distance = this.castRay(rayAngle);

            // Fix fish-eye effect
            const correctedDistance = distance * Math.cos(rayAngle - this.playerAngle);

            const wallHeight = (this.height / correctedDistance) * 0.5;
            const wallTop = (this.height - wallHeight) / 2;

            // Calculate wall color based on distance
            const brightness = Math.max(0, 1 - correctedDistance / this.maxDepth);
            const colorValue = Math.floor(brightness * 150 + 50);
            this.ctx.fillStyle = `rgb(${colorValue}, ${colorValue * 0.8}, ${colorValue * 0.6})`;

            this.ctx.fillRect(i * rayWidth, wallTop, rayWidth + 1, wallHeight);
        }

        // Draw crosshair
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 10, centerY);
        this.ctx.lineTo(centerX + 10, centerY);
        this.ctx.moveTo(centerX, centerY - 10);
        this.ctx.lineTo(centerX, centerY + 10);
        this.ctx.stroke();

        // Draw game over or paused text
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText('Press F5 to restart', this.width / 2, this.height / 2 + 40);
        } else if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press P to resume', this.width / 2, this.height / 2 + 30);
        }
    }

    updateUI() {
        document.getElementById('health').textContent = `${Math.max(0, Math.floor(this.health))}%`;
        document.getElementById('armor').textContent = `${Math.floor(this.armor)}%`;
        document.getElementById('ammo').textContent = Math.max(0, this.ammo);
        document.getElementById('kills').textContent = this.kills;

        // Update health bar
        const healthBar = document.getElementById('health-bar');
        if (healthBar) {
            healthBar.style.width = `${Math.max(0, this.health)}%`;
        }

        // Update armor bar
        const armorBar = document.getElementById('armor-bar');
        if (armorBar) {
            armorBar.style.width = `${Math.max(0, this.armor)}%`;
        }
    }

    gameLoop() {
        this.handleInput();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new DoomGame();
    });
} else {
    new DoomGame();
}
