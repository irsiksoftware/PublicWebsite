/**
 * @fileoverview DOOM-Style Raycasting Game Engine
 * A browser-based first-person shooter inspired by DOOM, built using raycasting techniques.
 * Features include wall rendering, enemy AI, shooting mechanics, and mobile touch controls.
 *
 * @module doom
 *
 * @example
 * // Game auto-initializes on DOMContentLoaded
 * // Controls:
 * // WASD or Arrow Keys - Movement
 * // Space/Ctrl - Shoot
 * // E - Use/Interact
 * // P - Pause
 */

/**
 * Main DOOM game class implementing raycasting engine
 * @class
 */
class DoomGame {
    /**
     * Initializes the DOOM game engine
     * Sets up canvas, game state, player, map, and enemies
     * @constructor
     */
    constructor() {
        this.canvas = document.getElementById('doom-game');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Make canvas focusable and focus it
        this.canvas.tabIndex = 1;
        this.canvas.focus();

        // Game state
        this.paused = false;
        this.gameOver = false;

        // Shooting animation
        this.isShooting = false;
        this.shootingFrame = 0;
        this.muzzleFlash = false;

        // Player stats
        this.health = 100;
        this.armor = 0;
        this.ammo = 50;
        this.kills = 0;

        // Player position and direction (start in open space)
        this.playerX = 1.5;
        this.playerY = 1.5;
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

    /**
     * Initializes game controls, UI, and starts the game loop
     * @method
     */
    init() {
        this.setupControls();
        this.updateUI();
        this.gameLoop();
    }

    /**
     * Sets up keyboard and mobile touch controls
     * @method
     */
    setupControls() {
        // Focus canvas immediately
        setTimeout(() => this.canvas.focus(), 100);

        // Canvas click to focus
        this.canvas.addEventListener('click', () => {
            this.canvas.focus();
        });

        // Keyboard controls - attach to window to ensure they always work
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;

            // Debug: log key presses
            console.log('Key pressed:', key, 'Keys object:', {...this.keys});

            if (key === 'p') {
                this.togglePause();
            }

            if (e.key === ' ' || e.key === 'Control') {
                e.preventDefault();
                this.shoot();
            }

            if (key === 'e') {
                this.use();
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
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

    /**
     * Toggles game pause state
     * @method
     */
    togglePause() {
        this.paused = !this.paused;
    }

    /**
     * Fires weapon at enemies in crosshair
     * Reduces ammo and damages/kills enemies
     * @method
     */
    shoot() {
        if (this.paused || this.gameOver || this.ammo <= 0 || this.isShooting) return;

        this.ammo--;
        this.isShooting = true;
        this.shootingFrame = 0;
        this.muzzleFlash = true;

        // Reset shooting animation after delay
        setTimeout(() => {
            this.isShooting = false;
            this.muzzleFlash = false;
        }, 150);

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
            console.log('Trying to move forward:', { newX, newY, isWall: this.isWall(newX, newY), currentPos: [this.playerX, this.playerY] });
            if (!this.isWall(newX, newY)) {
                this.playerX = newX;
                this.playerY = newY;
                console.log('Moved to:', this.playerX, this.playerY);
            } else {
                console.log('Blocked by wall!');
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

    /**
     * Casts a ray from player position at given angle to detect walls
     * @method
     * @param {number} angle - Angle to cast ray in radians
     * @returns {number} Distance to nearest wall
     */
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

    /**
     * Renders enemies as sprites in 3D space
     * @method
     */
    renderEnemies() {
        // Sort enemies by distance (far to near for proper rendering)
        const enemiesWithDistance = this.enemies.map(enemy => {
            const dx = enemy.x - this.playerX;
            const dy = enemy.y - this.playerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            return { enemy, distance, angle };
        }).sort((a, b) => b.distance - a.distance);

        for (const { enemy, distance, angle } of enemiesWithDistance) {
            // Calculate angle relative to player view
            let relativeAngle = angle - this.playerAngle;
            while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
            while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;

            // Check if enemy is in field of view
            if (Math.abs(relativeAngle) < this.fov / 2 + 0.5) {
                // Calculate screen position
                const screenX = (this.width / 2) + (relativeAngle / this.fov) * this.width;

                // Calculate enemy size based on distance
                const enemyHeight = (this.height / distance) * 0.8;
                const enemyWidth = enemyHeight * 0.6;

                const enemyTop = (this.height - enemyHeight) / 2;

                // Draw enemy as a simple colored rectangle/sprite
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillRect(
                    screenX - enemyWidth / 2,
                    enemyTop,
                    enemyWidth,
                    enemyHeight
                );

                // Draw enemy outline
                this.ctx.strokeStyle = '#ff6666';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(
                    screenX - enemyWidth / 2,
                    enemyTop,
                    enemyWidth,
                    enemyHeight
                );

                // Draw simple "eyes" for enemy
                const eyeY = enemyTop + enemyHeight * 0.3;
                const eyeSize = enemyWidth * 0.15;
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(screenX - enemyWidth * 0.25, eyeY, eyeSize, eyeSize);
                this.ctx.fillRect(screenX + enemyWidth * 0.1, eyeY, eyeSize, eyeSize);
            }
        }
    }

    /**
     * Renders the 3D view using raycasting
     * Draws ceiling, floor, walls, and crosshair
     * @method
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw sky with gradient and mountains
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.height / 2);
        skyGradient.addColorStop(0, '#1a2a4a');
        skyGradient.addColorStop(1, '#2a1a3a');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.width, this.height / 2);

        // Draw distant mountains
        this.ctx.fillStyle = '#0a0a1a';
        for (let i = 0; i < 5; i++) {
            const mountainX = (i * this.width / 4) - (this.playerAngle * 100) % this.width;
            this.ctx.beginPath();
            this.ctx.moveTo(mountainX, this.height / 2);
            this.ctx.lineTo(mountainX + 100, this.height / 2 - 60);
            this.ctx.lineTo(mountainX + 200, this.height / 2);
            this.ctx.closePath();
            this.ctx.fill();
        }

        // Draw floor with perspective grid
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, this.height / 2, this.width, this.height / 2);

        // Add floor grid lines
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            const y = this.height / 2 + (i * this.height / 20);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

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

        // Draw enemies
        this.renderEnemies();

        // Draw weapon (hand with gun)
        this.drawWeapon();

        // Draw muzzle flash if shooting
        if (this.muzzleFlash) {
            this.drawMuzzleFlash();
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

    /**
     * Draws a minimalist weapon/gun at bottom of screen
     * @method
     */
    drawWeapon() {
        const gunX = this.width / 2 + (this.isShooting ? -5 : 0);
        const gunY = this.height - 120 + (this.isShooting ? -10 : 0);

        // Draw hand/arm
        this.ctx.fillStyle = '#8b6f47';
        this.ctx.fillRect(gunX - 40, gunY + 60, 35, 60);

        // Draw gun body
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(gunX - 30, gunY, 60, 40);

        // Gun barrel
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(gunX + 10, gunY - 40, 15, 40);

        // Gun handle
        this.ctx.fillStyle = '#3a2a1a';
        this.ctx.fillRect(gunX - 15, gunY + 30, 25, 40);

        // Gun details
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(gunX + 20, gunY + 10, 8, 8);
    }

    /**
     * Draws muzzle flash when shooting
     * @method
     */
    drawMuzzleFlash() {
        const flashX = this.width / 2 + 15;
        const flashY = this.height - 160;

        // Bright yellow/white flash
        this.ctx.fillStyle = 'rgba(255, 255, 150, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(flashX, flashY, 20, 0, Math.PI * 2);
        this.ctx.fill();

        // Outer glow
        this.ctx.fillStyle = 'rgba(255, 200, 100, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(flashX, flashY, 35, 0, Math.PI * 2);
        this.ctx.fill();

        // Bullet tracer line
        this.ctx.strokeStyle = 'rgba(255, 255, 100, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(flashX, flashY);
        this.ctx.lineTo(this.width / 2, this.height / 2 - 50);
        this.ctx.stroke();
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
