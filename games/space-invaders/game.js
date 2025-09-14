class SpaceInvaders {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'start'; // 'start', 'playing', 'paused', 'gameOver'
        
        // Game dimensions
        this.gameWidth = 800;
        this.gameHeight = 600;
        
        // Game objects
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.particles = [];
        
        // Game stats
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.enemySpeed = 0.3;
        this.enemyDirection = 1;
        this.enemyDropDistance = 15;
        this.gameStartTime = 0;
        this.shootingEnabled = false;
        
        // Input handling
        this.keys = {};
        
        // Sound system
        this.audioContext = null;
        this.sounds = {};
        
        // Initialize game
        this.initAudio();
        this.initEventListeners();
        this.resizeCanvas();
        this.gameLoop();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    createSounds() {
        // Enhanced shoot sound
        this.sounds.shoot = () => {
            if (!this.audioContext) return;
            
            const now = this.audioContext.currentTime;
            
            // Main laser sound (higher pitched)
            const oscillator1 = this.audioContext.createOscillator();
            const gainNode1 = this.audioContext.createGain();
            
            oscillator1.connect(gainNode1);
            gainNode1.connect(this.audioContext.destination);
            
            oscillator1.type = 'square';
            oscillator1.frequency.setValueAtTime(1200, now);
            oscillator1.frequency.exponentialRampToValueAtTime(600, now + 0.08);
            oscillator1.frequency.exponentialRampToValueAtTime(300, now + 0.15);
            
            gainNode1.gain.setValueAtTime(0.4, now);
            gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            
            oscillator1.start(now);
            oscillator1.stop(now + 0.15);
            
            // Secondary harmonic for richness
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode2 = this.audioContext.createGain();
            
            oscillator2.connect(gainNode2);
            gainNode2.connect(this.audioContext.destination);
            
            oscillator2.type = 'sawtooth';
            oscillator2.frequency.setValueAtTime(2400, now);
            oscillator2.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
            
            gainNode2.gain.setValueAtTime(0.15, now);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            
            oscillator2.start(now);
            oscillator2.stop(now + 0.08);
        };
        
        // Enemy hit sound
        this.sounds.enemyHit = () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
        
        // Enhanced player hit/death sound
        this.sounds.playerHit = () => {
            if (!this.audioContext) return;
            
            const now = this.audioContext.currentTime;
            
            // Dramatic descending tone
            const oscillator1 = this.audioContext.createOscillator();
            const gainNode1 = this.audioContext.createGain();
            
            oscillator1.connect(gainNode1);
            gainNode1.connect(this.audioContext.destination);
            
            oscillator1.type = 'square';
            oscillator1.frequency.setValueAtTime(400, now);
            oscillator1.frequency.exponentialRampToValueAtTime(50, now + 0.5);
            
            gainNode1.gain.setValueAtTime(0.6, now);
            gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            
            oscillator1.start(now);
            oscillator1.stop(now + 0.5);
            
            // Explosion noise component
            const noiseBuffer = this.audioContext.createBuffer(1, 8192, this.audioContext.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            
            for (let i = 0; i < 8192; i++) {
                noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / 8192, 2);
            }
            
            const noiseSource = this.audioContext.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            
            const noiseGain = this.audioContext.createGain();
            const noiseFilter = this.audioContext.createBiquadFilter();
            
            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.audioContext.destination);
            
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(2000, now);
            noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
            
            noiseGain.gain.setValueAtTime(0.4, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            
            noiseSource.start(now);
            noiseSource.stop(now + 0.3);
        };
        
        // Move sound
        this.sounds.move = () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(120, this.audioContext.currentTime + 0.05);
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
        
        // Game over sound
        this.sounds.gameOver = () => {
            if (!this.audioContext) return;
            
            const now = this.audioContext.currentTime;
            
            // Dramatic descending sequence
            const frequencies = [440, 370, 311, 262, 220, 185, 147, 110];
            
            frequencies.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(freq, now + index * 0.1);
                
                gainNode.gain.setValueAtTime(0, now + index * 0.1);
                gainNode.gain.linearRampToValueAtTime(0.3, now + index * 0.1 + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.15);
                
                oscillator.start(now + index * 0.1);
                oscillator.stop(now + index * 0.1 + 0.15);
            });
            
            // Final low rumble
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(55, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(27, this.audioContext.currentTime + 0.8);
                
                gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.8);
            }, 600);
        };
    }
    
    initEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.shoot();
                }
            }
            
            if (e.code === 'KeyP' && this.gameState === 'playing') {
                this.pauseGame();
            }
            
            if (e.code === 'KeyP' && this.gameState === 'paused') {
                this.resumeGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mobile touch events
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const shootBtn = document.getElementById('shootBtn');
        
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['ArrowLeft'] = true;
        });
        
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['ArrowLeft'] = false;
        });
        
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['ArrowRight'] = true;
        });
        
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['ArrowRight'] = false;
        });
        
        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.shoot();
            }
        });
        
        // Button events
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }
    
    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate scale to fit the canvas while maintaining aspect ratio
        const scaleX = containerWidth / this.gameWidth;
        const scaleY = (containerHeight * 0.8) / this.gameHeight;
        const scale = Math.min(scaleX, scaleY);
        
        this.canvas.width = this.gameWidth * scale;
        this.canvas.height = this.gameHeight * scale;
        
        // Reset transform before scaling to prevent accumulation
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(scale, scale);
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.enemySpeed = 0.3;
        this.gameStartTime = Date.now();
        this.shootingEnabled = false;
        
        this.initPlayer();
        this.initEnemies();
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        
        this.hideAllScreens();
        this.updateUI();
        
        // Resume audio context if needed
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    restartGame() {
        this.startGame();
    }
    
    pauseGame() {
        this.gameState = 'paused';
        document.getElementById('pauseScreen').classList.remove('hidden');
    }
    
    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('pauseScreen').classList.add('hidden');
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = `Final Score: ${this.score}`;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    hideAllScreens() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('pauseScreen').classList.add('hidden');
    }
    
    initPlayer() {
        this.player = {
            x: this.gameWidth / 2 - 15,
            y: this.gameHeight - 60,
            width: 30,
            height: 20,
            speed: 6,
            lastShot: 0,
            shootCooldown: 200
        };
    }
    
    initEnemies() {
        this.enemies = [];
        const rows = 4;
        const cols = 8;
        const enemyWidth = 30;
        const enemyHeight = 20;
        const startX = 100;
        const startY = 100;
        const spacingX = 50;
        const spacingY = 40;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.enemies.push({
                    x: startX + col * spacingX,
                    y: startY + row * spacingY,
                    width: enemyWidth,
                    height: enemyHeight,
                    type: row < 1 ? 'small' : row < 3 ? 'medium' : 'large',
                    points: row < 1 ? 30 : row < 3 ? 20 : 10,
                    lastShot: Math.random() * 2000
                });
            }
        }
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.player.lastShot > this.player.shootCooldown) {
            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 2,
                y: this.player.y,
                width: 4,
                height: 10,
                speed: 8
            });
            
            this.player.lastShot = now;
            this.sounds.shoot();
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies();
        this.updateEnemyBullets();
        this.updateParticles();
        this.checkCollisions();
        this.checkWinCondition();
        this.updateUI();
    }
    
    updatePlayer() {
        // Movement
        if ((this.keys['ArrowLeft'] || this.keys['KeyA']) && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if ((this.keys['ArrowRight'] || this.keys['KeyD']) && this.player.x < this.gameWidth - this.player.width) {
            this.player.x += this.player.speed;
        }
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y -= bullet.speed;
            
            if (bullet.y < 0) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updateEnemies() {
        if (this.enemies.length === 0) return;
        
        let moveDown = false;
        
        // Check if any enemy hits the edge
        for (const enemy of this.enemies) {
            if ((enemy.x <= 0 && this.enemyDirection === -1) || 
                (enemy.x >= this.gameWidth - enemy.width && this.enemyDirection === 1)) {
                moveDown = true;
                break;
            }
        }
        
        if (moveDown) {
            this.enemyDirection *= -1;
            for (const enemy of this.enemies) {
                enemy.y += this.enemyDropDistance;
            }
            this.sounds.move();
        } else {
            for (const enemy of this.enemies) {
                enemy.x += this.enemySpeed * this.enemyDirection;
            }
        }
        
        // Enemy shooting (authentic Space Invaders behavior)
        const now = Date.now();
        
        // Enable shooting after 3 seconds of gameplay
        if (!this.shootingEnabled && now - this.gameStartTime > 3000) {
            this.shootingEnabled = true;
        }
        
        if (this.shootingEnabled) {
            // Only bottom row enemies can shoot
            const bottomRowEnemies = this.getBottomRowEnemies();
            
            for (const enemy of bottomRowEnemies) {
                if (now - enemy.lastShot > 2000 + Math.random() * 3000) {
                    this.enemyBullets.push({
                        x: enemy.x + enemy.width / 2 - 2,
                        y: enemy.y + enemy.height,
                        width: 4,
                        height: 10,
                        speed: 2
                    });
                    enemy.lastShot = now;
                }
            }
        }
        
        // Check if enemies reached player
        for (const enemy of this.enemies) {
            if (enemy.y + enemy.height >= this.player.y) {
                this.gameOver();
                return;
            }
        }
    }
    
    updateEnemyBullets() {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.y += bullet.speed;
            
            if (bullet.y > this.gameHeight) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        // Player bullets vs enemies
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (this.isColliding(bullet, enemy)) {
                    // Create explosion particles
                    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    
                    // Update score
                    this.score += enemy.points;
                    
                    // Remove bullet and enemy
                    this.bullets.splice(i, 1);
                    this.enemies.splice(j, 1);
                    
                    this.sounds.enemyHit();
                    break;
                }
            }
        }
        
        // Enemy bullets vs player
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            if (this.isColliding(bullet, this.player)) {
                this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
                this.enemyBullets.splice(i, 1);
                this.lives--;
                this.sounds.playerHit();
                
                if (this.lives <= 0) {
                    // Play game over sound
                    this.sounds.gameOver();
                    setTimeout(() => {
                        this.gameOver();
                    }, 1000); // Delay game over screen to let sound play
                    return;
                }
                break;
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 20,
                maxLife: 20
            });
        }
    }
    
    getBottomRowEnemies() {
        const columns = {};
        
        // Group enemies by column (x position)
        for (const enemy of this.enemies) {
            const col = Math.round(enemy.x / 50); // Approximate column based on spacing
            if (!columns[col] || enemy.y > columns[col].y) {
                columns[col] = enemy;
            }
        }
        
        // Return the bottom enemy from each column
        return Object.values(columns);
    }
    
    checkWinCondition() {
        if (this.enemies.length === 0) {
            this.level++;
            this.enemySpeed += 0.2;
            this.gameStartTime = Date.now();
            this.shootingEnabled = false;
            this.initEnemies();
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
        
        // Display lives as green hearts to match theme
        const heartsText = '💚'.repeat(this.lives) + '🖤'.repeat(Math.max(0, 3 - this.lives));
        document.getElementById('lives').textContent = heartsText;
        
        document.getElementById('level').textContent = `Level: ${this.level}`;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.drawPlayer();
            this.drawBullets();
            this.drawEnemies();
            this.drawEnemyBullets();
            this.drawParticles();
        }
    }
    
    drawPlayer() {
        const x = this.player.x;
        const y = this.player.y;
        const ctx = this.ctx;
        
        // Enhanced spaceship design
        ctx.fillStyle = '#00ff00';
        
        // Main body (central rectangle)
        ctx.fillRect(x + 12, y + 8, 6, 12);
        
        // Cockpit/nose cone
        ctx.fillRect(x + 13, y + 6, 4, 2);
        ctx.fillRect(x + 14, y + 4, 2, 2);
        
        // Wings
        ctx.fillRect(x + 8, y + 12, 4, 6);
        ctx.fillRect(x + 18, y + 12, 4, 6);
        
        // Wing tips
        ctx.fillRect(x + 6, y + 14, 2, 2);
        ctx.fillRect(x + 22, y + 14, 2, 2);
        
        // Engine exhausts
        ctx.fillRect(x + 10, y + 18, 2, 2);
        ctx.fillRect(x + 18, y + 18, 2, 2);
        
        // Cockpit window (darker green)
        ctx.fillStyle = '#008800';
        ctx.fillRect(x + 14, y + 8, 2, 2);
        
        // Wing details
        ctx.fillRect(x + 9, y + 15, 2, 2);
        ctx.fillRect(x + 19, y + 15, 2, 2);
        
        // Gun barrels
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x + 11, y + 6, 1, 4);
        ctx.fillRect(x + 18, y + 6, 1, 4);
    }
    
    drawBullets() {
        this.ctx.fillStyle = '#0f0';
        for (const bullet of this.bullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }
    
    drawEnemies() {
        for (const enemy of this.enemies) {
            this.drawAlien(enemy.x, enemy.y, enemy.type);
        }
    }
    
    drawAlien(x, y, type) {
        const ctx = this.ctx;
        
        // Different alien designs based on type
        switch (type) {
            case 'small': // Top row - Octopus-like alien (30 points)
                ctx.fillStyle = '#00ff00';
                
                // Body
                ctx.fillRect(x + 8, y + 4, 14, 8);
                
                // Eyes
                ctx.fillStyle = '#000';
                ctx.fillRect(x + 10, y + 6, 2, 2);
                ctx.fillRect(x + 18, y + 6, 2, 2);
                
                // Tentacles
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(x + 6, y + 12, 2, 4);
                ctx.fillRect(x + 10, y + 12, 2, 6);
                ctx.fillRect(x + 14, y + 12, 2, 4);
                ctx.fillRect(x + 18, y + 12, 2, 6);
                ctx.fillRect(x + 22, y + 12, 2, 4);
                
                // Tentacle ends
                ctx.fillRect(x + 4, y + 16, 2, 2);
                ctx.fillRect(x + 8, y + 18, 2, 2);
                ctx.fillRect(x + 12, y + 16, 2, 2);
                ctx.fillRect(x + 16, y + 18, 2, 2);
                ctx.fillRect(x + 20, y + 18, 2, 2);
                ctx.fillRect(x + 24, y + 16, 2, 2);
                break;
                
            case 'medium': // Middle rows - Crab-like alien (20 points)
                ctx.fillStyle = '#ffaa00';
                
                // Claws
                ctx.fillRect(x + 2, y + 6, 4, 2);
                ctx.fillRect(x + 24, y + 6, 4, 2);
                ctx.fillRect(x + 2, y + 4, 2, 2);
                ctx.fillRect(x + 26, y + 4, 2, 2);
                
                // Body
                ctx.fillRect(x + 6, y + 2, 18, 10);
                
                // Eyes
                ctx.fillStyle = '#000';
                ctx.fillRect(x + 10, y + 4, 2, 2);
                ctx.fillRect(x + 18, y + 4, 2, 2);
                
                // Mouth
                ctx.fillRect(x + 13, y + 8, 4, 2);
                
                // Legs
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(x + 8, y + 12, 2, 4);
                ctx.fillRect(x + 12, y + 12, 2, 6);
                ctx.fillRect(x + 16, y + 12, 2, 6);
                ctx.fillRect(x + 20, y + 12, 2, 4);
                
                // Feet
                ctx.fillRect(x + 6, y + 16, 2, 2);
                ctx.fillRect(x + 10, y + 18, 2, 2);
                ctx.fillRect(x + 18, y + 18, 2, 2);
                ctx.fillRect(x + 22, y + 16, 2, 2);
                break;
                
            case 'large': // Bottom rows - Squid-like alien (10 points)
                ctx.fillStyle = '#ff0000';
                
                // Antenna
                ctx.fillRect(x + 8, y, 2, 4);
                ctx.fillRect(x + 20, y, 2, 4);
                ctx.fillRect(x + 6, y + 2, 2, 2);
                ctx.fillRect(x + 22, y + 2, 2, 2);
                
                // Head
                ctx.fillRect(x + 6, y + 4, 18, 8);
                
                // Eyes
                ctx.fillStyle = '#000';
                ctx.fillRect(x + 10, y + 6, 2, 2);
                ctx.fillRect(x + 18, y + 6, 2, 2);
                
                // Body
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(x + 8, y + 12, 14, 4);
                
                // Tentacles
                ctx.fillRect(x + 4, y + 16, 2, 2);
                ctx.fillRect(x + 8, y + 16, 2, 4);
                ctx.fillRect(x + 12, y + 16, 2, 2);
                ctx.fillRect(x + 16, y + 16, 2, 4);
                ctx.fillRect(x + 20, y + 16, 2, 2);
                ctx.fillRect(x + 24, y + 16, 2, 4);
                break;
        }
    }
    
    drawEnemyBullets() {
        this.ctx.fillStyle = '#f00';
        for (const bullet of this.enemyBullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }
    
    drawParticles() {
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
            this.ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new SpaceInvaders();
});