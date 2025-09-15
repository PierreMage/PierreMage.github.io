class BombermanGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game constants
        this.GRID_WIDTH = 15;
        this.GRID_HEIGHT = 11;
        this.GRID_SIZE = 40; // Will be recalculated in adjustCanvasSize
        
        // Game state
        this.gameState = 'start'; // start, playing, paused, gameOver
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.bombsAvailable = 1;
        this.bombPower = 1;
        this.speedLevel = 1;
        
        // Game objects
        this.player = null;
        this.enemies = [];
        this.bombs = [];
        this.explosions = [];
        this.powerUps = [];
        this.particles = [];
        this.grid = [];
        
        // Input handling
        this.keys = {};
        this.touchInput = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // Animation frame
        this.lastTime = 0;
        this.animationId = null;
        this.levelCompleting = false;
        
        this.setupEventListeners();
        this.adjustCanvasSize();
        this.initializeGame();
    }
    
    toggleMute() {
        if (window.soundManager) {
            const isMuted = window.soundManager.toggleMute();
            const muteBtn = document.getElementById('muteBtn');
            if (muteBtn) {
                muteBtn.textContent = isMuted ? '🔇' : '🔊';
            }
        }
    }
    
    initializeGame() {
        this.initializeGrid();
        this.createPlayer();
        this.createEnemies();
        this.updateUI();
    }
    
    initializeGrid() {
        this.grid = [];
        for (let y = 0; y < this.GRID_HEIGHT; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.GRID_WIDTH; x++) {
                // Create border walls
                if (x === 0 || y === 0 || x === this.GRID_WIDTH - 1 || y === this.GRID_HEIGHT - 1) {
                    this.grid[y][x] = 'wall';
                }
                // Create internal walls in a pattern
                else if (x % 2 === 0 && y % 2 === 0) {
                    this.grid[y][x] = 'wall';
                }
                // Keep player spawn area clear
                else if ((x <= 2 && y <= 2)) {
                    this.grid[y][x] = 'empty';
                }
                // Create destructible blocks
                else if (Math.random() < 0.7) {
                    this.grid[y][x] = 'block';
                } else {
                    this.grid[y][x] = 'empty';
                }
            }
        }
    }
    
    createPlayer() {
        this.player = {
            pixelX: this.GRID_SIZE,
            pixelY: this.GRID_SIZE,
            direction: 'down',
            isMoving: false,
            speed: 2,
            alive: true
        };
    }
    
    createEnemies() {
        this.enemies = [];
        const enemyCount = Math.min(3 + this.level, 8);
        
        for (let i = 0; i < enemyCount; i++) {
            let x, y;
            do {
                x = Math.floor(Math.random() * (this.GRID_WIDTH - 2)) + 1;
                y = Math.floor(Math.random() * (this.GRID_HEIGHT - 2)) + 1;
            } while (this.grid[y][x] !== 'empty' || (x <= 3 && y <= 3));
            
            this.enemies.push({
                pixelX: x * this.GRID_SIZE,
                pixelY: y * this.GRID_SIZE,
                direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)],
                speed: 1 + Math.random() * 0.5,
                alive: true,
                moveTimer: 0
            });
        }
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.placeBomb();
                }
            }
            
            if (e.code === 'Escape') {
                e.preventDefault();
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Touch controls
        const setupTouchControl = (elementId, action) => {
            const element = document.getElementById(elementId);
            if (!element) return;
            
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (action === 'bomb') {
                    this.placeBomb();
                } else if (action === 'pause') {
                    this.togglePause();
                } else if (action === 'mute') {
                    this.toggleMute();
                } else {
                    this.touchInput[action] = true;
                }
            });
            
            element.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (action !== 'bomb' && action !== 'pause' && action !== 'mute') {
                    this.touchInput[action] = false;
                }
            });
        };
        
        setupTouchControl('upBtn', 'up');
        setupTouchControl('downBtn', 'down');
        setupTouchControl('leftBtn', 'left');
        setupTouchControl('rightBtn', 'right');
        setupTouchControl('bombBtn', 'bomb');
        setupTouchControl('pauseBtn', 'pause');
        setupTouchControl('muteBtn', 'mute');
        
        // UI button events
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('resumeButton').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('mainMenuButton').addEventListener('click', () => {
            this.goToMainMenu();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            const oldGridSize = this.GRID_SIZE;
            this.adjustCanvasSize();
            // If grid size changed, reinitialize game objects
            if (oldGridSize !== this.GRID_SIZE && this.gameState !== 'start') {
                this.initializeGame();
            }
        });
    }
    
    adjustCanvasSize() {
        // Use most of the available space while maintaining aspect ratio
        const container = document.getElementById('gameArea');
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const availableWidth = containerRect.width - 40; // Account for padding
        const availableHeight = containerRect.height - 40;
        
        // Calculate aspect ratio based on grid
        const aspectRatio = this.GRID_WIDTH / this.GRID_HEIGHT;
        
        // Try to use 90% of available space
        let width = availableWidth * 0.9;
        let height = width / aspectRatio;
        
        // If height is too big, scale down based on height
        if (height > availableHeight * 0.9) {
            height = availableHeight * 0.9;
            width = height * aspectRatio;
        }
        
        // Set minimum size to ensure playability
        const minWidth = 600;
        const minHeight = 450;
        
        width = Math.max(width, minWidth);
        height = Math.max(height, minHeight);
        
        // Update canvas display size
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        // Update canvas actual resolution to match display size
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Dynamically calculate grid size to fill the canvas
        this.GRID_SIZE = Math.floor(Math.min(width / this.GRID_WIDTH, height / this.GRID_HEIGHT));
    }
    
    startGame() {
        this.gameState = 'playing';
        this.hideOverlay('startScreen');
        if (window.soundManager) window.soundManager.play('gameStart');
        
        // Cancel any existing animation frame before starting new game loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.gameLoop();
    }
    
    restartGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.bombsAvailable = 1;
        this.bombPower = 1;
        this.speedLevel = 1;
        this.bombs = [];
        this.explosions = [];
        this.powerUps = [];
        this.particles = [];
        
        // Cancel any existing animation frame before restarting
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.initializeGame();
        this.gameState = 'playing';
        this.hideOverlay('gameOverScreen');
        this.gameLoop();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showOverlay('pauseScreen');
        } else if (this.gameState === 'paused') {
            this.resumeGame();
        }
    }
    
    resumeGame() {
        this.gameState = 'playing';
        this.hideOverlay('pauseScreen');
        
        // Only start new game loop if one isn't already running
        if (!this.animationId) {
            this.gameLoop();
        }
    }
    
    goToMainMenu() {
        this.gameState = 'start';
        this.hideOverlay('pauseScreen');
        this.hideOverlay('gameOverScreen');
        this.showOverlay('startScreen');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        this.showOverlay('gameOverScreen');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    nextLevel() {
        this.level++;
        this.bombs = [];
        this.explosions = [];
        this.powerUps = [];
        this.particles = [];
        this.initializeGrid();
        this.createEnemies();
        this.player.pixelX = this.GRID_SIZE;
        this.player.pixelY = this.GRID_SIZE;
        this.player.alive = true;
        this.updateUI();
    }
    
    showOverlay(id) {
        document.getElementById(id).classList.remove('hidden');
    }
    
    hideOverlay(id) {
        document.getElementById(id).classList.add('hidden');
    }
    
    updateUI() {
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('livesValue').textContent = this.lives;
        document.getElementById('levelValue').textContent = this.level;
        document.getElementById('bombsValue').textContent = this.bombsAvailable;
        document.getElementById('powerValue').textContent = this.bombPower;
        document.getElementById('speedValue').textContent = this.speedLevel;
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') {
            this.animationId = null;
            return;
        }
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.handleInput();
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    handleInput() {
        if (!this.player.alive) return;
        
        const isMoving = this.keys['ArrowUp'] || this.keys['ArrowDown'] || 
                        this.keys['ArrowLeft'] || this.keys['ArrowRight'] ||
                        this.touchInput.up || this.touchInput.down ||
                        this.touchInput.left || this.touchInput.right;
        
        if (this.keys['ArrowUp'] || this.touchInput.up) {
            this.movePlayer(0, -1, 'up');
        } else if (this.keys['ArrowDown'] || this.touchInput.down) {
            this.movePlayer(0, 1, 'down');
        } else if (this.keys['ArrowLeft'] || this.touchInput.left) {
            this.movePlayer(-1, 0, 'left');
        } else if (this.keys['ArrowRight'] || this.touchInput.right) {
            this.movePlayer(1, 0, 'right');
        }
        
        this.player.isMoving = isMoving;
    }
    
    movePlayer(dx, dy, direction) {
        const newX = this.player.pixelX + dx * this.player.speed;
        const newY = this.player.pixelY + dy * this.player.speed;
        
        this.player.direction = direction;
        
        if (this.canMoveToPosition(newX, newY, direction)) {
            this.player.pixelX = newX;
            this.player.pixelY = newY;
            
            // Subtle auto-alignment when changing direction for smoother gameplay
            const alignThreshold = 8;
            if ((direction === 'left' || direction === 'right') && Math.abs(this.player.pixelY % this.GRID_SIZE - this.GRID_SIZE/2) > this.GRID_SIZE/2 - alignThreshold) {
                // Gently align vertically when moving horizontally
                const targetY = Math.round(this.player.pixelY / this.GRID_SIZE) * this.GRID_SIZE;
                const diff = targetY - this.player.pixelY;
                if (Math.abs(diff) <= 2) {
                    this.player.pixelY = targetY;
                }
            } else if ((direction === 'up' || direction === 'down') && Math.abs(this.player.pixelX % this.GRID_SIZE - this.GRID_SIZE/2) > this.GRID_SIZE/2 - alignThreshold) {
                // Gently align horizontally when moving vertically
                const targetX = Math.round(this.player.pixelX / this.GRID_SIZE) * this.GRID_SIZE;
                const diff = targetX - this.player.pixelX;
                if (Math.abs(diff) <= 2) {
                    this.player.pixelX = targetX;
                }
            }
        }
    }
    
    canMoveToPosition(x, y, direction = null) {
        const margin = 8;
        
        // For horizontal movement, check more vertically centered points
        // For vertical movement, check more horizontally centered points
        let corners;
        if (direction === 'left' || direction === 'right') {
            // When moving horizontally, be more forgiving vertically
            const centerY = y + this.GRID_SIZE / 2;
            corners = [
                [x + margin, centerY - margin],
                [x + this.GRID_SIZE - margin, centerY - margin],
                [x + margin, centerY + margin],
                [x + this.GRID_SIZE - margin, centerY + margin]
            ];
        } else if (direction === 'up' || direction === 'down') {
            // When moving vertically, be more forgiving horizontally
            const centerX = x + this.GRID_SIZE / 2;
            corners = [
                [centerX - margin, y + margin],
                [centerX + margin, y + margin],
                [centerX - margin, y + this.GRID_SIZE - margin],
                [centerX + margin, y + this.GRID_SIZE - margin]
            ];
        } else {
            // Default collision detection
            corners = [
                [x + margin, y + margin],
                [x + this.GRID_SIZE - margin, y + margin],
                [x + margin, y + this.GRID_SIZE - margin],
                [x + this.GRID_SIZE - margin, y + this.GRID_SIZE - margin]
            ];
        }
        
        for (const [cx, cy] of corners) {
            const gridX = Math.floor(cx / this.GRID_SIZE);
            const gridY = Math.floor(cy / this.GRID_SIZE);
            
            if (gridX < 0 || gridX >= this.GRID_WIDTH || 
                gridY < 0 || gridY >= this.GRID_HEIGHT ||
                this.grid[gridY][gridX] === 'wall' || 
                this.grid[gridY][gridX] === 'block') {
                return false;
            }
        }
        return true;
    }
    
    placeBomb() {
        if (this.gameState !== 'playing' || !this.player.alive || this.bombs.length >= this.bombsAvailable) return;
        
        // Calculate bomb position based on player's center position
        const playerCenterX = this.player.pixelX + this.GRID_SIZE / 2;
        const playerCenterY = this.player.pixelY + this.GRID_SIZE / 2;
        
        const bombX = Math.floor(playerCenterX / this.GRID_SIZE);
        const bombY = Math.floor(playerCenterY / this.GRID_SIZE);
        
        // Check if there's already a bomb at this position
        if (this.bombs.some(bomb => bomb.x === bombX && bomb.y === bombY)) return;
        
        this.bombs.push({
            x: bombX,
            y: bombY,
            timer: 3000, // 3 seconds
            animationFrame: 0
        });
        
        try {
            if (window.soundManager) window.soundManager.play('placeBomb');
        } catch (e) {
            console.warn('Sound error:', e);
        }
    }
    
    update(deltaTime) {
        this.updateBombs(deltaTime);
        this.updateExplosions(deltaTime);
        this.updateEnemies(deltaTime);
        this.updatePowerUps();
        this.updateParticles(deltaTime);
        this.checkCollisions();
        this.checkWinCondition();
    }
    
    updateBombs(deltaTime) {
        const bombsToExplode = [];
        
        // Find bombs that should explode
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            const bomb = this.bombs[i];
            bomb.timer -= deltaTime;
            bomb.animationFrame += deltaTime * 0.005;
            
            if (bomb.timer <= 0) {
                bombsToExplode.push(bomb);
                this.bombs.splice(i, 1);
            }
        }
        
        // Process all explosions
        for (const bomb of bombsToExplode) {
            this.explodeBomb(bomb);
        }
    }
    
    explodeBomb(bomb) {
        const explosions = [{
            x: bomb.x,
            y: bomb.y,
            timer: 500
        }];
        
        // Store existing power-ups before creating new ones
        const existingPowerUps = [...this.powerUps];
        
        // Create explosion in four directions
        const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        
        for (const [dx, dy] of directions) {
            for (let i = 1; i <= this.bombPower; i++) {
                const x = bomb.x + dx * i;
                const y = bomb.y + dy * i;
                
                if (x < 0 || x >= this.GRID_WIDTH || y < 0 || y >= this.GRID_HEIGHT) break;
                if (this.grid[y][x] === 'wall') break;
                
                explosions.push({
                    x: x,
                    y: y,
                    timer: 500
                });
                
                if (this.grid[y][x] === 'block') {
                    this.grid[y][x] = 'empty';
                    
                    // Create block destruction particles
                    this.createParticles(x, y, 'blockDestroy', 8);
                    this.createParticles(x, y, 'dust', 3);
                    
                    // Chance to drop power-up
                    if (Math.random() < 0.3) {
                        const powerUpTypes = ['extraBomb', 'power', 'speed'];
                        this.powerUps.push({
                            x: x,
                            y: y,
                            type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]
                        });
                    }
                    break;
                }
            }
        }
        
        // Only destroy power-ups that existed before this explosion
        for (let i = existingPowerUps.length - 1; i >= 0; i--) {
            const powerUp = existingPowerUps[i];
            if (explosions.some(exp => exp.x === powerUp.x && exp.y === powerUp.y)) {
                // Find and remove this power-up from the current powerUps array
                const currentIndex = this.powerUps.findIndex(p => p === powerUp);
                if (currentIndex !== -1) {
                    this.powerUps.splice(currentIndex, 1);
                }
            }
        }
        
        // Trigger chain reaction by reducing timer of other bombs in explosion range
        for (const otherBomb of this.bombs) {
            if (explosions.some(exp => exp.x === otherBomb.x && exp.y === otherBomb.y)) {
                otherBomb.timer = Math.min(otherBomb.timer, 100); // Explode in 100ms
            }
        }
        
        this.explosions.push(...explosions);
        
        // Create explosion particles at bomb center
        this.createParticles(bomb.x, bomb.y, 'explosion', 12);
        this.createParticles(bomb.x, bomb.y, 'dust', 6);
        
        try {
            if (window.soundManager) window.soundManager.play('explosion');
        } catch (e) {
            console.warn('Sound error:', e);
        }
    }
    
    updateExplosions(deltaTime) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].timer -= deltaTime;
            if (this.explosions[i].timer <= 0) {
                this.explosions.splice(i, 1);
            }
        }
    }
    
    updateEnemies(deltaTime) {
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            enemy.moveTimer += deltaTime;
            
            if (enemy.moveTimer >= 100) {
                enemy.moveTimer = 0;
                
                // Simple AI: move in current direction, turn if blocked
                const directions = {
                    'up': [0, -1],
                    'down': [0, 1],
                    'left': [-1, 0],
                    'right': [1, 0]
                };
                
                const [dx, dy] = directions[enemy.direction];
                const newX = enemy.pixelX + dx * enemy.speed;
                const newY = enemy.pixelY + dy * enemy.speed;
                
                if (this.canMoveToPosition(newX, newY)) {
                    enemy.pixelX = newX;
                    enemy.pixelY = newY;
                } else {
                    // Change direction randomly
                    const directionKeys = Object.keys(directions);
                    enemy.direction = directionKeys[Math.floor(Math.random() * directionKeys.length)];
                }
            }
        }
    }
    
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            
            // Calculate player's center grid position for power-up collection
            const playerCenterX = this.player.pixelX + this.GRID_SIZE / 2;
            const playerCenterY = this.player.pixelY + this.GRID_SIZE / 2;
            const playerGridX = Math.floor(playerCenterX / this.GRID_SIZE);
            const playerGridY = Math.floor(playerCenterY / this.GRID_SIZE);
            
            // Check if player collected the power-up
            if (powerUp.x === playerGridX && powerUp.y === playerGridY) {
                switch (powerUp.type) {
                    case 'extraBomb':
                        this.bombsAvailable++;
                        break;
                    case 'power':
                        this.bombPower++;
                        break;
                    case 'speed':
                        this.player.speed = Math.min(this.player.speed + 0.5, 4);
                        this.speedLevel = Math.min(this.speedLevel + 1, 5);
                        break;
                }
                
                this.score += 100;
                this.powerUps.splice(i, 1);
                if (window.soundManager) window.soundManager.play('powerup');
                this.updateUI();
            }
        }
    }
    
    createParticles(x, y, type, count = 5) {
        const centerX = x * this.GRID_SIZE + this.GRID_SIZE / 2;
        const centerY = y * this.GRID_SIZE + this.GRID_SIZE / 2;
        
        for (let i = 0; i < count; i++) {
            let particle;
            
            switch (type) {
                case 'blockDestroy':
                    particle = {
                        x: centerX + (Math.random() - 0.5) * this.GRID_SIZE,
                        y: centerY + (Math.random() - 0.5) * this.GRID_SIZE,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4 - 2, // Slight upward bias
                        life: 1000 + Math.random() * 500,
                        maxLife: 1000 + Math.random() * 500,
                        size: 2 + Math.random() * 3,
                        color: ['#D2691E', '#CD853F', '#8B4513', '#DEB887'][Math.floor(Math.random() * 4)],
                        type: 'debris',
                        gravity: 0.003,
                        rotation: Math.random() * Math.PI * 2,
                        rotationSpeed: (Math.random() - 0.5) * 0.1
                    };
                    break;
                    
                case 'explosion':
                    particle = {
                        x: centerX,
                        y: centerY,
                        vx: Math.cos(i / count * Math.PI * 2) * (2 + Math.random() * 3),
                        vy: Math.sin(i / count * Math.PI * 2) * (2 + Math.random() * 3),
                        life: 300 + Math.random() * 200,
                        maxLife: 300 + Math.random() * 200,
                        size: 3 + Math.random() * 4,
                        color: ['#FF4500', '#FF8C00', '#FFD700', '#FFFF00'][Math.floor(Math.random() * 4)],
                        type: 'spark',
                        fade: 0.95
                    };
                    break;
                    
                case 'dust':
                    particle = {
                        x: centerX + (Math.random() - 0.5) * this.GRID_SIZE * 2,
                        y: centerY + (Math.random() - 0.5) * this.GRID_SIZE * 2,
                        vx: (Math.random() - 0.5) * 2,
                        vy: -Math.random() * 1.5,
                        life: 800 + Math.random() * 400,
                        maxLife: 800 + Math.random() * 400,
                        size: 4 + Math.random() * 6,
                        color: 'rgba(139, 115, 85, 0.6)',
                        type: 'cloud',
                        expansion: 0.002
                    };
                    break;
            }
            
            if (particle) {
                this.particles.push(particle);
            }
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Apply physics based on particle type
            switch (particle.type) {
                case 'debris':
                    particle.vy += particle.gravity * deltaTime;
                    particle.vx *= 0.99; // Air resistance
                    particle.rotation += particle.rotationSpeed;
                    break;
                    
                case 'spark':
                    particle.vx *= particle.fade;
                    particle.vy *= particle.fade;
                    particle.size *= 0.998;
                    break;
                    
                case 'cloud':
                    particle.size += particle.expansion * deltaTime;
                    particle.vy *= 0.98;
                    particle.vx *= 0.98;
                    break;
            }
        }
    }
    
    drawParticles() {
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            
            switch (particle.type) {
                case 'debris':
                    this.ctx.translate(particle.x, particle.y);
                    this.ctx.rotate(particle.rotation);
                    this.ctx.fillStyle = particle.color;
                    this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
                    // Add slight highlight to debris
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size/2, particle.size/2);
                    break;
                    
                case 'spark':
                    const gradient = this.ctx.createRadialGradient(
                        particle.x, particle.y, 0,
                        particle.x, particle.y, particle.size
                    );
                    gradient.addColorStop(0, particle.color);
                    gradient.addColorStop(1, particle.color + '00');
                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                    
                case 'cloud':
                    const cloudGradient = this.ctx.createRadialGradient(
                        particle.x, particle.y, 0,
                        particle.x, particle.y, particle.size
                    );
                    const baseAlpha = alpha * 0.4;
                    cloudGradient.addColorStop(0, `rgba(139, 115, 85, ${baseAlpha})`);
                    cloudGradient.addColorStop(0.5, `rgba(139, 115, 85, ${baseAlpha * 0.6})`);
                    cloudGradient.addColorStop(1, 'rgba(139, 115, 85, 0)');
                    this.ctx.fillStyle = cloudGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
            }
            
            this.ctx.restore();
        }
    }
    
    checkCollisions() {
        if (!this.player.alive) return;
        
        // Calculate player's center grid position for explosion collision
        const playerCenterX = this.player.pixelX + this.GRID_SIZE / 2;
        const playerCenterY = this.player.pixelY + this.GRID_SIZE / 2;
        const playerGridX = Math.floor(playerCenterX / this.GRID_SIZE);
        const playerGridY = Math.floor(playerCenterY / this.GRID_SIZE);
        
        // Check collision with explosions
        for (const explosion of this.explosions) {
            if (explosion.x === playerGridX && explosion.y === playerGridY) {
                this.playerDie();
                return;
            }
        }
        
        // Check collision with enemies
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            const distance = Math.sqrt(
                Math.pow(this.player.pixelX - enemy.pixelX, 2) +
                Math.pow(this.player.pixelY - enemy.pixelY, 2)
            );
            
            if (distance < this.GRID_SIZE * 0.7) {
                this.playerDie();
                return;
            }
            
            // Calculate enemy's center grid position for explosion collision
            const enemyCenterX = enemy.pixelX + this.GRID_SIZE / 2;
            const enemyCenterY = enemy.pixelY + this.GRID_SIZE / 2;
            const enemyGridX = Math.floor(enemyCenterX / this.GRID_SIZE);
            const enemyGridY = Math.floor(enemyCenterY / this.GRID_SIZE);
            
            // Check if enemy hit by explosion
            for (const explosion of this.explosions) {
                if (explosion.x === enemyGridX && explosion.y === enemyGridY && enemy.alive) {
                    enemy.alive = false;
                    this.score += 200;
                    if (window.soundManager) window.soundManager.play('enemyDie');
                    this.updateUI();
                    break; // Exit loop once enemy is killed
                }
            }
        }
    }
    
    playerDie() {
        this.player.alive = false;
        this.lives--;
        if (window.soundManager) window.soundManager.play('playerDie');
        this.updateUI();
        
        if (this.lives <= 0) {
            setTimeout(() => this.gameOver(), 1000);
        } else {
            setTimeout(() => {
                this.player.alive = true;
                this.player.pixelX = this.GRID_SIZE;
                this.player.pixelY = this.GRID_SIZE;
            }, 2000);
        }
    }
    
    checkWinCondition() {
        const aliveEnemies = this.enemies.filter(enemy => enemy.alive);
        if (aliveEnemies.length === 0 && !this.levelCompleting) {
            this.levelCompleting = true;
            this.score += 1000 * this.level;
            if (window.soundManager) window.soundManager.play('levelComplete');
            this.updateUI();
            setTimeout(() => {
                this.levelCompleting = false;
                this.nextLevel();
            }, 1500);
        }
    }
    
    render() {
        // Clear canvas and reset drawing context
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineWidth = 1;
        this.ctx.textAlign = 'start';
        
        // Draw grid background
        this.drawGrid();
        
        // Draw game objects
        this.drawPowerUps();
        this.drawBombs();
        this.drawExplosions();
        this.drawParticles();
        this.drawPlayer();
        this.drawEnemies();
    }
    
    drawGrid() {
        for (let y = 0; y < this.GRID_HEIGHT; y++) {
            for (let x = 0; x < this.GRID_WIDTH; x++) {
                const posX = x * this.GRID_SIZE;
                const posY = y * this.GRID_SIZE;
                
                switch (this.grid[y][x]) {
                    case 'wall':
                        this.drawWall(posX, posY);
                        break;
                    case 'block':
                        this.drawBlock(posX, posY);
                        break;
                    case 'empty':
                        this.drawFloor(posX, posY);
                        break;
                }
            }
        }
    }
    
    drawWall(x, y) {
        // Base stone wall with realistic gradient
        const baseGradient = this.ctx.createLinearGradient(x, y, x + this.GRID_SIZE, y + this.GRID_SIZE);
        baseGradient.addColorStop(0, '#9A8B7A');
        baseGradient.addColorStop(0.2, '#8B7355');
        baseGradient.addColorStop(0.5, '#A0522D');
        baseGradient.addColorStop(0.8, '#696969');
        baseGradient.addColorStop(1, '#2F4F4F');
        this.ctx.fillStyle = baseGradient;
        this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE);
        
        // Add detailed stone texture with varied colors
        const stoneColors = ['#8B7355', '#A0522D', '#696969', '#708090', '#778899'];
        this.ctx.save();
        for (let i = 0; i < 12; i++) {
            const stoneX = x + (i * 7) % this.GRID_SIZE;
            const stoneY = y + Math.floor(i * 7 / this.GRID_SIZE) * 5;
            const stoneSize = 2 + (i % 3);
            this.ctx.fillStyle = stoneColors[i % stoneColors.length] + '60';
            this.ctx.fillRect(stoneX, stoneY, stoneSize, stoneSize);
        }
        this.ctx.restore();
        
        // Stone cracks for realism
        this.ctx.strokeStyle = 'rgba(47, 79, 79, 0.6)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        
        // Consistent crack patterns based on position
        const crackSeed = (x + y) * 0.1;
        const crackCount = 2 + Math.floor(Math.sin(crackSeed) * 2 + 2);
        for (let i = 0; i < crackCount; i++) {
            const startX = x + ((crackSeed + i) * 13) % this.GRID_SIZE;
            const startY = y + ((crackSeed + i * 1.7) * 11) % this.GRID_SIZE;
            const endX = startX + Math.sin(crackSeed + i) * 10;
            const endY = startY + Math.cos(crackSeed + i) * 10;
            
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(
                Math.max(x, Math.min(x + this.GRID_SIZE, endX)), 
                Math.max(y, Math.min(y + this.GRID_SIZE, endY))
            );
        }
        this.ctx.stroke();
        
        // Enhanced mortar lines with depth
        this.ctx.strokeStyle = '#4A4A4A';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        // Horizontal mortar lines with slight irregularity
        for (let i = 1; i < 4; i++) {
            const lineY = y + (i * this.GRID_SIZE / 4) + Math.sin(x * 0.1) * 1;
            this.ctx.moveTo(x, lineY);
            this.ctx.lineTo(x + this.GRID_SIZE, lineY);
        }
        
        // Vertical mortar lines (brick pattern with irregularity)
        const offset = (Math.floor(y / this.GRID_SIZE) % 2) * (this.GRID_SIZE / 2);
        for (let i = 1; i < 3; i++) {
            const lineX = x + (i * this.GRID_SIZE / 2) + offset + Math.cos(y * 0.1) * 2;
            if (lineX > x && lineX < x + this.GRID_SIZE) {
                this.ctx.moveTo(lineX, y);
                this.ctx.lineTo(lineX, y + this.GRID_SIZE);
            }
        }
        this.ctx.stroke();
        
        // Enhanced 3D lighting effects
        // Top and left highlights (light source from top-left)
        const highlightGradient = this.ctx.createLinearGradient(x, y, x + this.GRID_SIZE/3, y + this.GRID_SIZE/3);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        this.ctx.fillStyle = highlightGradient;
        this.ctx.fillRect(x, y, this.GRID_SIZE, 4);
        this.ctx.fillRect(x, y, 4, this.GRID_SIZE);
        
        // Bottom and right shadows (deeper shadows)
        const shadowGradient = this.ctx.createLinearGradient(
            x + this.GRID_SIZE - 6, y + this.GRID_SIZE - 6, 
            x + this.GRID_SIZE, y + this.GRID_SIZE
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        this.ctx.fillStyle = shadowGradient;
        this.ctx.fillRect(x + this.GRID_SIZE - 6, y + 6, 6, this.GRID_SIZE - 6);
        this.ctx.fillRect(x + 6, y + this.GRID_SIZE - 6, this.GRID_SIZE - 6, 6);
        
        // Corner shadow for depth
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x + this.GRID_SIZE - 2, y + this.GRID_SIZE - 2, 2, 2);
    }
    
    drawBlock(x, y) {
        // Realistic wooden crate with detailed gradient
        const woodGradient = this.ctx.createLinearGradient(x, y, x + this.GRID_SIZE, y + this.GRID_SIZE);
        woodGradient.addColorStop(0, '#DEB887');
        woodGradient.addColorStop(0.2, '#D2691E');
        woodGradient.addColorStop(0.5, '#CD853F');
        woodGradient.addColorStop(0.8, '#A0522D');
        woodGradient.addColorStop(1, '#8B4513');
        this.ctx.fillStyle = woodGradient;
        this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE);
        
        // Wood grain texture with varied patterns
        this.ctx.save();
        const grainSeed = (x + y) * 0.05;
        const grainColors = ['#8B4513', '#A0522D', '#654321', '#D2B48C'];
        
        // Horizontal wood grain lines with natural variation
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const lineY = y + 6 + i * 6 + Math.sin(grainSeed + i) * 2;
            const waveAmplitude = 1 + Math.sin(grainSeed * 2 + i) * 1;
            
            this.ctx.moveTo(x + 3, lineY);
            for (let px = 3; px < this.GRID_SIZE - 3; px += 2) {
                const waveY = lineY + Math.sin((px + grainSeed * 10) * 0.5) * waveAmplitude;
                this.ctx.lineTo(x + px, waveY);
            }
        }
        this.ctx.stroke();
        
        // Wood knots and imperfections
        for (let i = 0; i < 3; i++) {
            const knotX = x + 8 + (i * 10) % (this.GRID_SIZE - 12);
            const knotY = y + 8 + Math.floor(i * 7 / this.GRID_SIZE) * 8;
            const knotSize = 2 + i % 2;
            
            this.ctx.fillStyle = '#654321';
            this.ctx.beginPath();
            this.ctx.arc(knotX, knotY, knotSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Knot highlight
            this.ctx.fillStyle = '#8B4513';
            this.ctx.beginPath();
            this.ctx.arc(knotX - 1, knotY - 1, knotSize * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
        
        // Enhanced metal crate bands with rivets
        const bandColor = '#4A4A4A';
        const rivetColor = '#666';
        
        // Top and bottom bands
        this.ctx.fillStyle = bandColor;
        this.ctx.fillRect(x + 3, y + 1, this.GRID_SIZE - 6, 4);
        this.ctx.fillRect(x + 3, y + this.GRID_SIZE - 5, this.GRID_SIZE - 6, 4);
        
        // Side bands
        this.ctx.fillRect(x + 1, y + 3, 4, this.GRID_SIZE - 6);
        this.ctx.fillRect(x + this.GRID_SIZE - 5, y + 3, 4, this.GRID_SIZE - 6);
        
        // Rivets on bands
        this.ctx.fillStyle = rivetColor;
        // Top band rivets
        for (let i = 0; i < 3; i++) {
            const rivetX = x + 8 + i * 8;
            this.ctx.beginPath();
            this.ctx.arc(rivetX, y + 3, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(rivetX, y + this.GRID_SIZE - 3, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Side band rivets
        for (let i = 0; i < 3; i++) {
            const rivetY = y + 8 + i * 8;
            this.ctx.beginPath();
            this.ctx.arc(x + 3, rivetY, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(x + this.GRID_SIZE - 3, rivetY, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Rivet highlights
        this.ctx.fillStyle = '#888';
        for (let i = 0; i < 3; i++) {
            const rivetX = x + 8 + i * 8;
            const rivetY = y + 8 + i * 8;
            
            // Top/bottom rivet highlights
            this.ctx.beginPath();
            this.ctx.arc(rivetX - 0.5, y + 3 - 0.5, 1, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(rivetX - 0.5, y + this.GRID_SIZE - 3 - 0.5, 1, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Side rivet highlights
            if (rivetY < y + this.GRID_SIZE - 5) {
                this.ctx.beginPath();
                this.ctx.arc(x + 3 - 0.5, rivetY - 0.5, 1, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(x + this.GRID_SIZE - 3 - 0.5, rivetY - 0.5, 1, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Enhanced 3D lighting
        // Top-left highlight
        this.ctx.fillStyle = 'rgba(244, 164, 96, 0.6)';
        this.ctx.fillRect(x + 2, y + 2, this.GRID_SIZE - 8, 3);
        this.ctx.fillRect(x + 2, y + 2, 3, this.GRID_SIZE - 8);
        
        // Bottom-right shadow
        this.ctx.fillStyle = 'rgba(101, 67, 33, 0.7)';
        this.ctx.fillRect(x + this.GRID_SIZE - 5, y + 5, 3, this.GRID_SIZE - 8);
        this.ctx.fillRect(x + 5, y + this.GRID_SIZE - 5, this.GRID_SIZE - 8, 3);
        
        // Corner shadow for depth
        this.ctx.fillStyle = 'rgba(101, 67, 33, 0.9)';
        this.ctx.fillRect(x + this.GRID_SIZE - 3, y + this.GRID_SIZE - 3, 3, 3);
    }
    
    drawFloor(x, y) {
        // Grass-like floor with texture
        const gradient = this.ctx.createRadialGradient(
            x + this.GRID_SIZE/2, y + this.GRID_SIZE/2, 0,
            x + this.GRID_SIZE/2, y + this.GRID_SIZE/2, this.GRID_SIZE/2
        );
        gradient.addColorStop(0, '#98FB98');
        gradient.addColorStop(0.7, '#90EE90');
        gradient.addColorStop(1, '#7CCD7C');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, this.GRID_SIZE, this.GRID_SIZE);
        
        // Grass texture dots
        this.ctx.fillStyle = '#7CCD7C';
        const grassDots = 6;
        for (let i = 0; i < grassDots; i++) {
            const dotX = x + (i * 6 + 8) % (this.GRID_SIZE - 4) + 2;
            const dotY = y + (i * 7 + 10) % (this.GRID_SIZE - 4) + 2;
            this.ctx.fillRect(dotX, dotY, 1, 1);
        }
    }
    
    drawPlayer() {
        if (!this.player.alive) return;
        
        const x = this.player.pixelX;
        const y = this.player.pixelY;
        const centerX = x + this.GRID_SIZE / 2;
        const centerY = y + this.GRID_SIZE / 2;
        const time = Date.now() * 0.006;
        
        // Subtle walking animation - much less exaggerated
        const walkBob = this.player.isMoving ? Math.sin(time * 4) * 0.5 : 0;
        const adjustedCenterY = centerY + walkBob;
        
        // Player shadow (always on ground, not affected by bob)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, y + this.GRID_SIZE - 2, 12, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Main player body - simplified and more stable
        const bodyGradient = this.ctx.createRadialGradient(
            centerX - 2, adjustedCenterY - 3, 2, 
            centerX, adjustedCenterY, this.GRID_SIZE / 2.5
        );
        bodyGradient.addColorStop(0, '#87CEEB');
        bodyGradient.addColorStop(0.4, '#6495ED');
        bodyGradient.addColorStop(0.8, '#4169E1');
        bodyGradient.addColorStop(1, '#1E3A8A');
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, adjustedCenterY, this.GRID_SIZE / 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Simple body outline
        this.ctx.strokeStyle = '#0F1F5F';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, adjustedCenterY, this.GRID_SIZE / 2.5, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Helmet/head
        const helmetGradient = this.ctx.createRadialGradient(
            centerX - 3, adjustedCenterY - 6, 2,
            centerX, adjustedCenterY - 2, 8
        );
        helmetGradient.addColorStop(0, '#B0E0E6');
        helmetGradient.addColorStop(0.7, '#87CEEB');
        helmetGradient.addColorStop(1, '#4682B4');
        this.ctx.fillStyle = helmetGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, adjustedCenterY - 2, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Helmet highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 3, adjustedCenterY - 5, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eyes - simplified
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 5, adjustedCenterY - 1, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(centerX + 5, adjustedCenterY - 1, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye pupils with direction awareness
        let pupilOffsetX = 0;
        let pupilOffsetY = 0;
        switch(this.player.direction) {
            case 'up': pupilOffsetY = -1; break;
            case 'down': pupilOffsetY = 1; break;
            case 'left': pupilOffsetX = -1; break;
            case 'right': pupilOffsetX = 1; break;
        }
        
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 5 + pupilOffsetX, adjustedCenterY - 1 + pupilOffsetY, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(centerX + 5 + pupilOffsetX, adjustedCenterY - 1 + pupilOffsetY, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Simple mouth
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        if (this.player.isMoving) {
            // Slight smile when moving
            this.ctx.arc(centerX, adjustedCenterY + 3, 2, 0, Math.PI);
        } else {
            // Neutral expression
            this.ctx.moveTo(centerX - 2, adjustedCenterY + 3);
            this.ctx.lineTo(centerX + 2, adjustedCenterY + 3);
        }
        this.ctx.stroke();
        
        // Simple arms - less animation
        const armOffset = this.player.isMoving ? Math.sin(time * 4) * 2 : 0;
        this.ctx.fillStyle = '#4169E1';
        
        // Left arm
        this.ctx.beginPath();
        this.ctx.ellipse(centerX - 10, adjustedCenterY + 2 + armOffset * 0.3, 2, 6, -0.1, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Right arm
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + 10, adjustedCenterY + 2 - armOffset * 0.3, 2, 6, 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Simple gloves
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 10, adjustedCenterY + 7 + armOffset * 0.3, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(centerX + 10, adjustedCenterY + 7 - armOffset * 0.3, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // No legs - character floats like classic Bomberman
        
        // Health indicator - subtle glow when damaged
        if (this.lives < 3) {
            const healthGlow = Math.sin(time * 3) * 0.2 + 0.5;
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${healthGlow})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, adjustedCenterY, this.GRID_SIZE / 2.5 + 3, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Power-up visual indicators
        if (this.bombPower > 1) {
            // Power indicator aura
            this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, adjustedCenterY, this.GRID_SIZE / 2.5 + 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        if (this.speedLevel > 1) {
            // Speed indicator sparkles
            const sparkleCount = Math.min(this.speedLevel, 4);
            for (let i = 0; i < sparkleCount; i++) {
                const sparkleAngle = time * 0.8 + i * Math.PI * (2 / sparkleCount);
                const sparkleRadius = this.GRID_SIZE / 2 + 8;
                const sparkleX = centerX + Math.cos(sparkleAngle) * sparkleRadius;
                const sparkleY = adjustedCenterY + Math.sin(sparkleAngle) * sparkleRadius;
                
                this.ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
                this.ctx.beginPath();
                this.ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    drawEnemies() {
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (!enemy.alive) continue;
            
            this.drawEnemy(enemy, i);
        }
    }
    
    drawEnemy(enemy, index) {
        const x = enemy.pixelX;
        const y = enemy.pixelY;
        const centerX = x + this.GRID_SIZE / 2;
        const centerY = y + this.GRID_SIZE / 2;
        
        // Different enemy types based on index
        const enemyType = index % 3;
        let primaryColor, secondaryColor, eyeColor;
        
        switch(enemyType) {
            case 0: // Red enemy
                primaryColor = '#FF4500';
                secondaryColor = '#FF6347';
                eyeColor = '#FFD700';
                break;
            case 1: // Purple enemy
                primaryColor = '#8A2BE2';
                secondaryColor = '#9932CC';
                eyeColor = '#FFC0CB';
                break;
            case 2: // Green enemy
                primaryColor = '#228B22';
                secondaryColor = '#32CD32';
                eyeColor = '#FFFF00';
                break;
        }
        
        // Enemy body with gradient
        const bodyGradient = this.ctx.createRadialGradient(
            centerX - 2, centerY - 2, 2, 
            centerX, centerY, this.GRID_SIZE / 2.5
        );
        bodyGradient.addColorStop(0, secondaryColor);
        bodyGradient.addColorStop(0.7, primaryColor);
        bodyGradient.addColorStop(1, this.darkenColor(primaryColor, 0.3));
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, this.GRID_SIZE / 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Enemy outline
        this.ctx.strokeStyle = this.darkenColor(primaryColor, 0.5);
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, this.GRID_SIZE / 3, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Enemy spikes/horns (different per type)
        this.ctx.fillStyle = this.darkenColor(primaryColor, 0.2);
        if (enemyType === 0) {
            // Horns for red enemy
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 6, centerY - this.GRID_SIZE / 3);
            this.ctx.lineTo(centerX - 4, centerY - this.GRID_SIZE / 2.2);
            this.ctx.lineTo(centerX - 2, centerY - this.GRID_SIZE / 3);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(centerX + 6, centerY - this.GRID_SIZE / 3);
            this.ctx.lineTo(centerX + 4, centerY - this.GRID_SIZE / 2.2);
            this.ctx.lineTo(centerX + 2, centerY - this.GRID_SIZE / 3);
            this.ctx.fill();
        } else if (enemyType === 1) {
            // Crown for purple enemy
            this.ctx.fillRect(centerX - 8, centerY - this.GRID_SIZE / 2.5, 16, 3);
            for (let i = 0; i < 3; i++) {
                this.ctx.fillRect(centerX - 6 + i * 6, centerY - this.GRID_SIZE / 2.2, 2, 4);
            }
        }
        
        // Glowing eyes
        this.ctx.fillStyle = eyeColor;
        this.ctx.shadowColor = eyeColor;
        this.ctx.shadowBlur = 4;
        this.ctx.beginPath();
        this.ctx.arc(centerX - 4, centerY - 2, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(centerX + 4, centerY - 2, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Eye pupils
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 4, centerY - 2, 1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(centerX + 4, centerY - 2, 1, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Angry mouth
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY + 4, 4, 0, Math.PI);
        this.ctx.stroke();
    }
    
    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    drawBombs() {
        for (const bomb of this.bombs) {
            this.drawBomb(bomb);
        }
    }
    
    drawBomb(bomb) {
        const x = bomb.x * this.GRID_SIZE;
        const y = bomb.y * this.GRID_SIZE;
        const centerX = x + this.GRID_SIZE / 2;
        const centerY = y + this.GRID_SIZE / 2;
        const radius = this.GRID_SIZE / 2.6;
        const time = Date.now() * 0.002;
        const timeLeft = bomb.timer / 3000; // Normalize to 0-1
        
        // Enhanced bomb shadow with gradient
        const shadowGradient = this.ctx.createRadialGradient(
            centerX + 1, y + this.GRID_SIZE - 1, 0,
            centerX + 1, y + this.GRID_SIZE - 1, radius + 2
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
        shadowGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = shadowGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + 1, y + this.GRID_SIZE - 1, radius + 2, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Realistic metallic bomb body with multiple gradients
        const mainGradient = this.ctx.createRadialGradient(
            centerX - 3, centerY - 5, 2,
            centerX, centerY, radius
        );
        mainGradient.addColorStop(0, '#6B6B6B');
        mainGradient.addColorStop(0.2, '#4A4A4A');
        mainGradient.addColorStop(0.5, '#2A2A2A');
        mainGradient.addColorStop(0.8, '#1A1A1A');
        mainGradient.addColorStop(1, '#000000');
        this.ctx.fillStyle = mainGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Metal surface reflections and details
        this.ctx.fillStyle = '#808080';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 4, centerY - 6, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Additional highlight for metallic shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 6, centerY - 8, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Metal texture lines
        this.ctx.strokeStyle = '#404040';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2 / 3) + time * 0.1;
            const startRadius = radius * 0.3;
            const endRadius = radius * 0.8;
            const startX = centerX + Math.cos(angle) * startRadius;
            const startY = centerY + Math.sin(angle) * startRadius;
            const endX = centerX + Math.cos(angle) * endRadius;
            const endY = centerY + Math.sin(angle) * endRadius;
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
        }
        this.ctx.stroke();
        
        // Enhanced fuse base with metallic look
        const fuseBaseGradient = this.ctx.createLinearGradient(
            centerX - 3, centerY - radius - 2,
            centerX + 3, centerY - radius + 4
        );
        fuseBaseGradient.addColorStop(0, '#D2691E');
        fuseBaseGradient.addColorStop(0.5, '#8B4513');
        fuseBaseGradient.addColorStop(1, '#654321');
        this.ctx.fillStyle = fuseBaseGradient;
        this.ctx.fillRect(centerX - 3, centerY - radius - 2, 6, 8);
        
        // Fuse base highlight
        this.ctx.fillStyle = 'rgba(210, 180, 140, 0.8)';
        this.ctx.fillRect(centerX - 2, centerY - radius - 1, 2, 6);
        
        // Enhanced animated fuse
        const fuseLength = 15;
        const fuseIntensity = 1 - timeLeft;
        const fuseWiggle = Math.sin(bomb.animationFrame * 0.4) * (2 + fuseIntensity);
        const fuseGlow = Math.sin(bomb.animationFrame * 0.6) * 0.5 + 0.5;
        
        // Fuse rope with texture
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - radius + 4);
        
        // Create curved fuse with multiple segments
        for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            const wiggle = Math.sin(t * Math.PI * 3 + bomb.animationFrame * 0.3) * fuseWiggle;
            const fx = centerX + wiggle;
            const fy = centerY - radius + 4 - t * fuseLength;
            this.ctx.lineTo(fx, fy);
        }
        this.ctx.stroke();
        
        // Fuse inner core
        this.ctx.strokeStyle = '#CD853F';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - radius + 4);
        for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            const wiggle = Math.sin(t * Math.PI * 3 + bomb.animationFrame * 0.3) * fuseWiggle;
            const fx = centerX + wiggle;
            const fy = centerY - radius + 4 - t * fuseLength;
            this.ctx.lineTo(fx, fy);
        }
        this.ctx.stroke();
        
        // Enhanced sparking fuse tip with multiple particles
        const sparkIntensity = Math.max(0.2, 1 - timeLeft);
        if (Math.random() < sparkIntensity * 0.8) {
            const tipWiggle = Math.sin(bomb.animationFrame * 0.3) * fuseWiggle;
            const tipX = centerX + tipWiggle;
            const tipY = centerY - radius + 4 - fuseLength;
            
            // Multiple spark particles
            for (let i = 0; i < 3; i++) {
                const sparkSize = 1 + Math.random() * 4;
                const sparkOffset = (Math.random() - 0.5) * 6;
                const sparkColors = ['#FFD700', '#FF4500', '#FF6347', '#FFFF00', '#FFA500'];
                const sparkColor = sparkColors[Math.floor(Math.random() * sparkColors.length)];
                
                this.ctx.fillStyle = sparkColor;
                this.ctx.shadowColor = sparkColor;
                this.ctx.shadowBlur = 8;
                this.ctx.beginPath();
                this.ctx.arc(
                    tipX + sparkOffset,
                    tipY + sparkOffset * 0.5,
                    sparkSize,
                    0, Math.PI * 2
                );
                this.ctx.fill();
            }
            this.ctx.shadowBlur = 0;
        }
        
        // Fuse burning glow effect
        if (timeLeft < 0.8) {
            const glowIntensity = (1 - timeLeft) * fuseGlow;
            this.ctx.shadowColor = '#FF4500';
            this.ctx.shadowBlur = 8 * glowIntensity;
            this.ctx.strokeStyle = `rgba(255, 69, 0, ${glowIntensity})`;
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            const burnPoint = (1 - timeLeft) * fuseLength;
            const wiggle = Math.sin(bomb.animationFrame * 0.3) * fuseWiggle;
            this.ctx.arc(
                centerX + wiggle,
                centerY - radius + 4 - burnPoint,
                2, 0, Math.PI * 2
            );
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
        
        // Enhanced warning pulse with multiple effects
        if (timeLeft < 0.4) {
            const pulseIntensity = (0.4 - timeLeft) / 0.4;
            const pulseAlpha = (Math.sin(bomb.animationFrame * 1.2) + 1) * 0.2 * pulseIntensity;
            
            // Red warning glow
            const warningGradient = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, radius + 8
            );
            warningGradient.addColorStop(0, `rgba(255, 0, 0, ${pulseAlpha * 0.6})`);
            warningGradient.addColorStop(0.7, `rgba(255, 0, 0, ${pulseAlpha * 0.3})`);
            warningGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            this.ctx.fillStyle = warningGradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Warning ring
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Bomb vibration when about to explode
        if (timeLeft < 0.2) {
            const shakeAmount = (0.2 - timeLeft) * 10;
            this.ctx.save();
            this.ctx.translate(
                (Math.random() - 0.5) * shakeAmount,
                (Math.random() - 0.5) * shakeAmount
            );
            this.ctx.restore();
        }
    }
    
    drawExplosions() {
        for (const explosion of this.explosions) {
            this.drawExplosion(explosion);
        }
    }
    
    drawExplosion(explosion) {
        const x = explosion.x * this.GRID_SIZE;
        const y = explosion.y * this.GRID_SIZE;
        const centerX = x + this.GRID_SIZE / 2;
        const centerY = y + this.GRID_SIZE / 2;
        const timeProgress = (500 - explosion.timer) / 500; // 0 to 1
        const time = Date.now() * 0.005;
        
        // Enhanced explosion core with realistic fire colors
        const explosionLayers = [
            { color: '#FFFFFF', size: 0.3, alpha: 1.0, glow: 15 }, // White hot core
            { color: '#FFFF99', size: 0.5, alpha: 0.9, glow: 12 }, // Bright yellow
            { color: '#FFD700', size: 0.7, alpha: 0.8, glow: 10 }, // Golden yellow
            { color: '#FF8C00', size: 0.9, alpha: 0.7, glow: 8 },  // Orange
            { color: '#FF4500', size: 1.1, alpha: 0.6, glow: 6 },  // Red-orange
            { color: '#8B0000', size: 1.3, alpha: 0.4, glow: 4 }   // Dark red outer
        ];
        
        // Explosion expansion and fade
        const expansionFactor = 0.6 + timeProgress * 0.8;
        const baseFade = 1 - timeProgress * 0.6;
        
        // Draw explosion layers with enhanced gradients
        for (let i = explosionLayers.length - 1; i >= 0; i--) {
            const layer = explosionLayers[i];
            const layerSize = layer.size * this.GRID_SIZE * expansionFactor;
            const alpha = layer.alpha * baseFade;
            
            if (alpha > 0.05) {
                // Create complex radial gradient for realistic fire
                const gradient = this.ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, layerSize / 2
                );
                
                const coreAlpha = Math.min(alpha * 1.5, 1.0);
                const edgeAlpha = alpha * 0.3;
                
                gradient.addColorStop(0, layer.color + this.alphaToHex(coreAlpha));
                gradient.addColorStop(0.3, layer.color + this.alphaToHex(alpha * 0.8));
                gradient.addColorStop(0.7, layer.color + this.alphaToHex(alpha * 0.4));
                gradient.addColorStop(1, layer.color + '00');
                
                this.ctx.fillStyle = gradient;
                
                // Add flickering effect to outer layers
                const flicker = i > 2 ? Math.sin(time * 8 + i) * 0.1 + 0.9 : 1.0;
                const finalSize = layerSize / 2 * flicker;
                
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, finalSize, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add glow effect for inner layers
                if (i < 3 && layer.glow) {
                    this.ctx.shadowColor = layer.color;
                    this.ctx.shadowBlur = layer.glow * alpha;
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, finalSize * 0.7, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                }
            }
        }
        
        // Enhanced spark system with trails
        const sparkCount = 12;
        const maxSparkDistance = 25;
        
        for (let i = 0; i < sparkCount; i++) {
            const baseAngle = (i / sparkCount) * Math.PI * 2;
            const angleVariation = Math.sin(time * 2 + i) * 0.3;
            const angle = baseAngle + angleVariation;
            
            const sparkDistance = timeProgress * maxSparkDistance * (0.8 + Math.random() * 0.4);
            const sparkX = centerX + Math.cos(angle) * sparkDistance;
            const sparkY = centerY + Math.sin(angle) * sparkDistance;
            const sparkLife = 1 - timeProgress;
            const sparkSize = sparkLife * (2 + Math.random() * 4);
            
            if (sparkSize > 0.5) {
                const sparkColors = [
                    '#FFFFFF', '#FFFF99', '#FFD700', '#FF8C00', 
                    '#FF4500', '#FF6347', '#FFA500'
                ];
                const sparkColor = sparkColors[Math.floor(Math.random() * sparkColors.length)];
                
                // Spark trail effect
                const trailLength = 8;
                this.ctx.strokeStyle = sparkColor + this.alphaToHex(sparkLife * 0.6);
                this.ctx.lineWidth = sparkSize * 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(
                    centerX + Math.cos(angle) * (sparkDistance - trailLength),
                    centerY + Math.sin(angle) * (sparkDistance - trailLength)
                );
                this.ctx.lineTo(sparkX, sparkY);
                this.ctx.stroke();
                
                // Spark particle
                this.ctx.fillStyle = sparkColor;
                this.ctx.shadowColor = sparkColor;
                this.ctx.shadowBlur = 4;
                this.ctx.beginPath();
                this.ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        }
        
        // Shock wave effect
        if (timeProgress < 0.3) {
            const shockRadius = timeProgress * 40;
            const shockAlpha = (1 - timeProgress / 0.3) * 0.4;
            
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${shockAlpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, shockRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Secondary shock wave
            if (timeProgress > 0.1) {
                const secondShockRadius = (timeProgress - 0.1) * 35;
                const secondShockAlpha = (1 - (timeProgress - 0.1) / 0.2) * 0.2;
                
                this.ctx.strokeStyle = `rgba(255, 215, 0, ${secondShockAlpha})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, secondShockRadius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
        
        // Heat distortion effect (visual simulation)
        if (timeProgress < 0.4) {
            const distortionRadius = timeProgress * 30;
            const distortionIntensity = (1 - timeProgress / 0.4) * 0.3;
            
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 + time;
                const distX = centerX + Math.cos(angle) * distortionRadius;
                const distY = centerY + Math.sin(angle) * distortionRadius;
                
                this.ctx.fillStyle = `rgba(255, 255, 255, ${distortionIntensity * 0.1})`;
                this.ctx.beginPath();
                this.ctx.arc(distX, distY, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Screen shake effect for nearby explosions
        if (timeProgress < 0.15) {
            const shakeIntensity = (1 - timeProgress / 0.15) * 3;
            this.ctx.save();
            this.ctx.translate(
                (Math.random() - 0.5) * shakeIntensity,
                (Math.random() - 0.5) * shakeIntensity
            );
            this.ctx.restore();
        }
    }
    
    alphaToHex(alpha) {
        return Math.floor(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0');
    }
    
    drawPowerUps() {
        for (const powerUp of this.powerUps) {
            if (!powerUp || powerUp.x < 0 || powerUp.y < 0 || 
                powerUp.x >= this.GRID_WIDTH || powerUp.y >= this.GRID_HEIGHT) continue;
                
            this.drawPowerUp(powerUp);
        }
    }
    
    drawPowerUp(powerUp) {
        const x = powerUp.x * this.GRID_SIZE;
        const y = powerUp.y * this.GRID_SIZE;
        const centerX = x + this.GRID_SIZE / 2;
        const centerY = y + this.GRID_SIZE / 2;
        const time = Date.now() * 0.004;
        
        // Enhanced floating animation with rotation
        const floatOffset = Math.sin(time * 1.5 + powerUp.x * 2) * 3;
        const rotationAngle = time * 0.5;
        const adjustedCenterY = centerY + floatOffset;
        
        // Enhanced power-up colors with more variety
        let primaryColor, secondaryColor, tertiaryColor, glowColor, particleColor;
        switch (powerUp.type) {
            case 'extraBomb':
                primaryColor = '#FF2D00';
                secondaryColor = '#FF6B00';
                tertiaryColor = '#FFB347';
                glowColor = '#FFD700';
                particleColor = '#FFA500';
                break;
            case 'power':
                primaryColor = '#8B0000';
                secondaryColor = '#DC143C';
                tertiaryColor = '#FF69B4';
                glowColor = '#FF1493';
                particleColor = '#FF69B4';
                break;
            case 'speed':
                primaryColor = '#006B8F';
                secondaryColor = '#00CED1';
                tertiaryColor = '#87CEEB';
                glowColor = '#00FFFF';
                particleColor = '#40E0D0';
                break;
            default:
                primaryColor = '#FFD700';
                secondaryColor = '#FFA500';
                tertiaryColor = '#FFFF99';
                glowColor = '#FFFF00';
                particleColor = '#F0E68C';
                break;
        }
        
        // Multi-layered glow effect
        const pulseIntensity = Math.sin(time * 3) * 0.3 + 0.7;
        const pulseSize = 1 + Math.sin(time * 2.5) * 0.15;
        
        // Outer glow ring
        const outerGlowRadius = 25 * pulseSize;
        const outerGlow = this.ctx.createRadialGradient(
            centerX, adjustedCenterY, 0,
            centerX, adjustedCenterY, outerGlowRadius
        );
        outerGlow.addColorStop(0, glowColor + Math.floor(pulseIntensity * 60).toString(16).padStart(2, '0'));
        outerGlow.addColorStop(0.5, glowColor + Math.floor(pulseIntensity * 30).toString(16).padStart(2, '0'));
        outerGlow.addColorStop(1, glowColor + '00');
        
        this.ctx.fillStyle = outerGlow;
        this.ctx.beginPath();
        this.ctx.arc(centerX, adjustedCenterY, outerGlowRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner glow ring
        const innerGlowRadius = 18 * pulseSize;
        const innerGlow = this.ctx.createRadialGradient(
            centerX, adjustedCenterY, 0,
            centerX, adjustedCenterY, innerGlowRadius
        );
        innerGlow.addColorStop(0, glowColor + Math.floor(pulseIntensity * 120).toString(16).padStart(2, '0'));
        innerGlow.addColorStop(0.7, glowColor + Math.floor(pulseIntensity * 60).toString(16).padStart(2, '0'));
        innerGlow.addColorStop(1, glowColor + '00');
        
        this.ctx.fillStyle = innerGlow;
        this.ctx.beginPath();
        this.ctx.arc(centerX, adjustedCenterY, innerGlowRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Power-up shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + 2, y + this.GRID_SIZE - 1, 10, 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Main power-up body with enhanced gradient
        const bodyRadius = 14;
        const bodyGradient = this.ctx.createRadialGradient(
            centerX - 4, adjustedCenterY - 4, 2,
            centerX, adjustedCenterY, bodyRadius
        );
        bodyGradient.addColorStop(0, tertiaryColor);
        bodyGradient.addColorStop(0.3, secondaryColor);
        bodyGradient.addColorStop(0.7, primaryColor);
        bodyGradient.addColorStop(1, this.darkenColor(primaryColor, 0.4));
        
        this.ctx.save();
        this.ctx.translate(centerX, adjustedCenterY);
        this.ctx.rotate(rotationAngle);
        
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, bodyRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Enhanced geometric shape overlay based on power-up type
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        switch (powerUp.type) {
            case 'extraBomb':
                // Hexagon shape for bombs (more distinctive)
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2) / 6;
                    const x = Math.cos(angle) * 10;
                    const y = Math.sin(angle) * 10;
                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                this.ctx.closePath();
                this.ctx.fill();
                
                // Add inner circles for bomb-like appearance
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'power':
                // Enhanced star shape with more points
                this.ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI * 2) / 8 - Math.PI / 2;
                    const radius = i % 2 === 0 ? 9 : 4;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                this.ctx.closePath();
                this.ctx.fill();
                
                // Add center circle
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'speed':
                // Lightning bolt background shape
                this.ctx.beginPath();
                // Larger lightning bolt background
                this.ctx.moveTo(-4, -10);
                this.ctx.lineTo(3, -4);
                this.ctx.lineTo(-1, -4);
                this.ctx.lineTo(4, 10);
                this.ctx.lineTo(-3, 4);
                this.ctx.lineTo(1, 4);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Electric energy radiating lines
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 1;
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const innerRadius = 8;
                    const outerRadius = 12;
                    const startX = Math.cos(angle) * innerRadius;
                    const startY = Math.sin(angle) * innerRadius;
                    const endX = Math.cos(angle) * outerRadius;
                    const endY = Math.sin(angle) * outerRadius;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(startX, startY);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.stroke();
                }
                break;
        }
        
        this.ctx.restore();
        
        // Enhanced highlight with gradient
        const highlightGradient = this.ctx.createRadialGradient(
            centerX - 6, adjustedCenterY - 6, 0,
            centerX - 6, adjustedCenterY - 6, 8
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
        
        this.ctx.fillStyle = highlightGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX - 6, adjustedCenterY - 6, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Enhanced graphical icons instead of letters
        this.ctx.save();
        this.ctx.translate(centerX, adjustedCenterY);
        
        // Draw type-specific icons
        switch (powerUp.type) {
            case 'extraBomb':
                // Draw a bomb icon
                this.ctx.fillStyle = 'white';
                this.ctx.shadowColor = glowColor;
                this.ctx.shadowBlur = 4;
                
                // Bomb body (black sphere)
                this.ctx.fillStyle = '#333';
                this.ctx.beginPath();
                this.ctx.arc(0, 1, 7, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Bomb highlight
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(-2, -1, 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Fuse
                this.ctx.strokeStyle = '#8B4513';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(0, -6);
                this.ctx.lineTo(2, -10);
                this.ctx.stroke();
                
                // Spark at fuse tip
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(2, -10, 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Additional sparks
                this.ctx.fillStyle = '#FF4500';
                this.ctx.beginPath();
                this.ctx.arc(0, -9, 1, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'power':
                // Draw an improved flame icon
                this.ctx.fillStyle = 'white';
                this.ctx.shadowColor = glowColor;
                this.ctx.shadowBlur = 8;
                
                // Main flame shape (more dynamic and realistic)
                this.ctx.beginPath();
                this.ctx.moveTo(0, 9);
                this.ctx.quadraticCurveTo(-6, 6, -4, 1);
                this.ctx.quadraticCurveTo(-5, -3, -2, -6);
                this.ctx.quadraticCurveTo(-1, -9, 0, -10);
                this.ctx.quadraticCurveTo(1, -9, 2, -6);
                this.ctx.quadraticCurveTo(5, -3, 4, 1);
                this.ctx.quadraticCurveTo(6, 6, 0, 9);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Secondary flame layer (orange)
                this.ctx.fillStyle = '#FF8C00';
                this.ctx.beginPath();
                this.ctx.moveTo(0, 7);
                this.ctx.quadraticCurveTo(-4, 4, -3, 0);
                this.ctx.quadraticCurveTo(-3, -4, -1, -6);
                this.ctx.quadraticCurveTo(0, -8, 0, -8);
                this.ctx.quadraticCurveTo(0, -8, 1, -6);
                this.ctx.quadraticCurveTo(3, -4, 3, 0);
                this.ctx.quadraticCurveTo(4, 4, 0, 7);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Inner flame (bright yellow)
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.moveTo(0, 5);
                this.ctx.quadraticCurveTo(-2, 3, -2, 0);
                this.ctx.quadraticCurveTo(-2, -3, -1, -5);
                this.ctx.quadraticCurveTo(0, -6, 0, -6);
                this.ctx.quadraticCurveTo(0, -6, 1, -5);
                this.ctx.quadraticCurveTo(2, -3, 2, 0);
                this.ctx.quadraticCurveTo(2, 3, 0, 5);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Hot core (white-yellow)
                this.ctx.fillStyle = '#FFFF99';
                this.ctx.beginPath();
                this.ctx.moveTo(0, 3);
                this.ctx.quadraticCurveTo(-1, 1, -1, -1);
                this.ctx.quadraticCurveTo(0, -3, 0, -4);
                this.ctx.quadraticCurveTo(0, -3, 1, -1);
                this.ctx.quadraticCurveTo(1, 1, 0, 3);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Flame flicker details
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(-1, -2, 0.5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(1, -1, 0.5, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'speed':
                // Draw a lightning bolt icon
                this.ctx.fillStyle = 'white';
                this.ctx.shadowColor = glowColor;
                this.ctx.shadowBlur = 8;
                
                // Lightning bolt main shape
                this.ctx.beginPath();
                this.ctx.moveTo(-3, -9);
                this.ctx.lineTo(2, -3);
                this.ctx.lineTo(-1, -3);
                this.ctx.lineTo(3, 9);
                this.ctx.lineTo(-2, 3);
                this.ctx.lineTo(1, 3);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Lightning bolt glow effect
                this.ctx.strokeStyle = glowColor;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // Electric sparks around the bolt
                this.ctx.fillStyle = glowColor;
                for (let i = 0; i < 4; i++) {
                    const sparkAngle = (i / 4) * Math.PI * 2;
                    const sparkRadius = 12;
                    const sparkX = Math.cos(sparkAngle) * sparkRadius;
                    const sparkY = Math.sin(sparkAngle) * sparkRadius;
                    const sparkSize = 1 + Math.random();
                    
                    this.ctx.beginPath();
                    this.ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // Additional energy lines
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const lineAngle = (i / 3) * Math.PI * 2;
                    const lineRadius = 10;
                    const startX = Math.cos(lineAngle) * (lineRadius - 3);
                    const startY = Math.sin(lineAngle) * (lineRadius - 3);
                    const endX = Math.cos(lineAngle) * lineRadius;
                    const endY = Math.sin(lineAngle) * lineRadius;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(startX, startY);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.stroke();
                }
                break;
                
            default:
                // Default question mark for unknown types
                this.ctx.fillStyle = 'white';
                this.ctx.shadowColor = glowColor;
                this.ctx.shadowBlur = 4;
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('?', 0, 0);
                break;
        }
        
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
        
        // Enhanced particle system
        const particleCount = 6;
        for (let i = 0; i < particleCount; i++) {
            const particleAngle = time * 0.8 + (i / particleCount) * Math.PI * 2;
            const particleDistance = 20 + Math.sin(time * 2 + i * 0.7) * 6;
            const particleX = centerX + Math.cos(particleAngle) * particleDistance;
            const particleY = adjustedCenterY + Math.sin(particleAngle) * particleDistance;
            const particleSize = 1.5 + Math.sin(time * 3 + i * 1.5) * 0.8;
            const particleAlpha = 0.6 + Math.sin(time * 4 + i * 2) * 0.4;
            
            if (particleSize > 0.5) {
                // Particle trail
                this.ctx.strokeStyle = particleColor + Math.floor(particleAlpha * 60).toString(16).padStart(2, '0');
                this.ctx.lineWidth = particleSize * 0.3;
                this.ctx.beginPath();
                const trailDistance = particleDistance - 4;
                const trailX = centerX + Math.cos(particleAngle) * trailDistance;
                const trailY = adjustedCenterY + Math.sin(particleAngle) * trailDistance;
                this.ctx.moveTo(trailX, trailY);
                this.ctx.lineTo(particleX, particleY);
                this.ctx.stroke();
                
                // Main particle
                this.ctx.fillStyle = 'white';
                this.ctx.shadowColor = particleColor;
                this.ctx.shadowBlur = 6;
                this.ctx.beginPath();
                this.ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
                
                // Particle core
                this.ctx.fillStyle = particleColor;
                this.ctx.beginPath();
                this.ctx.arc(particleX, particleY, particleSize * 0.6, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Energy waves for special effects
        if (Math.sin(time * 2) > 0.7) {
            const waveRadius = 30 + Math.sin(time * 8) * 5;
            this.ctx.strokeStyle = glowColor + '40';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, adjustedCenterY, waveRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Type-specific special effects
        switch (powerUp.type) {
            case 'extraBomb':
                // Explosion preview effect
                if (Math.random() < 0.1) {
                    this.ctx.fillStyle = 'rgba(255, 69, 0, 0.3)';
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, adjustedCenterY, 20, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                break;
            case 'power':
                // Power aura rings
                for (let ring = 0; ring < 2; ring++) {
                    const ringRadius = 18 + ring * 8 + Math.sin(time * 3 + ring) * 2;
                    const ringAlpha = 0.2 - ring * 0.1;
                    this.ctx.strokeStyle = glowColor + Math.floor(ringAlpha * 255).toString(16).padStart(2, '0');
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, adjustedCenterY, ringRadius, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
                break;
            case 'speed':
                // Speed lines trailing effect
                for (let line = 0; line < 4; line++) {
                    const lineAngle = (line / 4) * Math.PI * 2 + time;
                    const lineLength = 12;
                    const startX = centerX + Math.cos(lineAngle) * 16;
                    const startY = adjustedCenterY + Math.sin(lineAngle) * 16;
                    const endX = startX + Math.cos(lineAngle) * lineLength;
                    const endY = startY + Math.sin(lineAngle) * lineLength;
                    
                    this.ctx.strokeStyle = particleColor + '60';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(startX, startY);
                    this.ctx.lineTo(endX, endY);
                    this.ctx.stroke();
                }
                break;
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new BombermanGame();
});