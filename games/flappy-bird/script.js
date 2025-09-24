class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.gameUI = document.getElementById('gameUI');
        this.currentScoreEl = document.getElementById('currentScore');
        this.finalScoreEl = document.getElementById('finalScore');
        this.bestScoreEl = document.getElementById('bestScore');
        
        // Game state
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('flappyBestScore')) || 0;
        this.difficulty = 'normal';
        
        // Difficulty settings
        this.difficulties = {
            easy: {
                gravity: 0.25,
                flapStrength: -8.5,
                pipeWidth: 50,
                pipeGap: 200,
                pipeSpeed: 1.8,
                pipeSpawnRate: 200, // frames between pipes
                name: 'Easy'
            },
            normal: {
                gravity: 0.3,
                flapStrength: -8.5,
                pipeWidth: 50,
                pipeGap: 170,
                pipeSpeed: 2.2,
                pipeSpawnRate: 170,
                name: 'Normal'
            },
            hard: {
                gravity: 0.4,
                flapStrength: -9,
                pipeWidth: 50,
                pipeGap: 150,
                pipeSpeed: 2.6,
                pipeSpawnRate: 150,
                name: 'Hard'
            }
        };
        
        // Current game settings (will be set based on difficulty)
        this.gravity = 0.5;
        this.flapStrength = -8;
        this.pipeWidth = 50;
        this.pipeGap = 120;
        this.pipeSpeed = 2;
        this.pipeSpawnRate = 120;
        
        // Bird properties
        this.bird = {
            x: 100,
            y: 300,
            width: 25,
            height: 25,
            velocity: 0,
            rotation: 0,
            wingFlap: 0,
            trail: []
        };
        
        // Pipes array
        this.pipes = [];
        this.pipeTimer = 0;
        
        // Visual effects
        this.particles = [];
        this.backgroundOffset = 0;
        
        // Input handling
        this.lastFlapTime = 0;
        this.flapCooldown = 150; // milliseconds between flaps
        
        // Animation
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.updateBestScoreDisplay();
        this.setupEventListeners();
        this.drawStartScreen();
    }
    
    setupEventListeners() {
        // Difficulty selection buttons
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove selected class from all buttons
                difficultyButtons.forEach(b => b.classList.remove('selected'));
                // Add selected class to clicked button
                btn.classList.add('selected');
                // Set difficulty
                this.difficulty = btn.dataset.difficulty;
                this.setDifficulty(this.difficulty);
            });
        });
        
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.resetGame();
            this.startGame();
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                this.handleFlap();
            }
        });
        
        // Touch/click controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleFlap();
        });
        
        this.canvas.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleFlap();
        });
        
        // Prevent scrolling on touch
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
    
    setDifficulty(difficulty) {
        const settings = this.difficulties[difficulty];
        this.gravity = settings.gravity;
        this.flapStrength = settings.flapStrength;
        this.pipeWidth = settings.pipeWidth;
        this.pipeGap = settings.pipeGap;
        this.pipeSpeed = settings.pipeSpeed;
        this.pipeSpawnRate = settings.pipeSpawnRate;
    }
    
    handleFlap() {
        const currentTime = Date.now();
        
        if (this.gameState === 'playing') {
            // Check if enough time has passed since last flap to prevent double-tapping
            if (currentTime - this.lastFlapTime > this.flapCooldown) {
                this.flap();
                this.lastFlapTime = currentTime;
            }
        } else if (this.gameState === 'start') {
            this.startGame();
        } else if (this.gameState === 'gameOver') {
            this.resetGame();
            this.startGame();
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.gameUI.classList.remove('hidden');
        
        this.resetGame();
        this.gameLoop();
    }
    
    resetGame() {
        this.bird.x = 100;
        this.bird.y = 300;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.bird.wingFlap = 0;
        this.bird.trail = [];
        this.pipes = [];
        this.pipeTimer = 0;
        this.score = 0;
        this.particles = [];
        this.lastFlapTime = 0; // Reset flap cooldown
        this.updateScore();
    }
    
    flap() {
        this.bird.velocity = this.flapStrength;
        this.createFlapParticles();
    }
    
    createFlapParticles() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.bird.y + this.bird.height,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 2 + 1,
                size: Math.random() * 3 + 1,
                life: 30,
                maxLife: 30,
                color: `hsl(${Math.random() * 60 + 180}, 70%, 70%)`
            });
        }
    }
    
    createScoreParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.canvas.width / 2,
                y: 50,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 4 + 2,
                life: 40,
                maxLife: 40,
                color: `hsl(${Math.random() * 60 + 40}, 80%, 60%)`
            });
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    drawParticles() {
        this.ctx.save();
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }
    
    updateBird() {
        // Apply gravity
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;
        
        // Update rotation based on velocity
        this.bird.rotation = Math.min(Math.PI / 6, this.bird.velocity * 0.1);
        
        // Update wing flap animation
        this.bird.wingFlap += 0.3;
        
        // Update bird trail
        this.bird.trail.unshift({x: this.bird.x, y: this.bird.y});
        if (this.bird.trail.length > 8) {
            this.bird.trail.pop();
        }
        
        // Check boundaries
        if (this.bird.y < 0) {
            this.bird.y = 0;
            this.bird.velocity = 0;
        }
        
        if (this.bird.y + this.bird.height > this.canvas.height) {
            this.gameOver();
        }
    }
    
    updatePipes() {
        this.pipeTimer++;
        
        // Generate new pipe based on difficulty spawn rate
        if (this.pipeTimer > this.pipeSpawnRate) {
            this.generatePipe();
            this.pipeTimer = 0;
        }
        
        // Update existing pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;
            
            // Remove pipes that are off screen
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
            
            // Check for scoring (pipe passed the bird)
            if (!pipe.scored && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.scored = true;
                this.score++;
                this.updateScore();
                this.createScoreParticles();
                this.currentScoreEl.classList.add('score-popup');
                setTimeout(() => {
                    this.currentScoreEl.classList.remove('score-popup');
                }, 500);
            }
        }
    }
    
    generatePipe() {
        const minHeight = 50;
        const maxHeight = this.canvas.height - this.pipeGap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + this.pipeGap,
            bottomHeight: this.canvas.height - (topHeight + this.pipeGap),
            scored: false
        });
    }
    
    checkCollisions() {
        // Make collision detection slightly more forgiving by reducing effective bird size
        const collisionMargin = 3;
        const effectiveBirdX = this.bird.x + collisionMargin;
        const effectiveBirdY = this.bird.y + collisionMargin;
        const effectiveBirdWidth = this.bird.width - (collisionMargin * 2);
        const effectiveBirdHeight = this.bird.height - (collisionMargin * 2);

        for (const pipe of this.pipes) {
            // Check collision with top pipe
            if (this.isColliding(
                effectiveBirdX, effectiveBirdY, effectiveBirdWidth, effectiveBirdHeight,
                pipe.x, 0, this.pipeWidth, pipe.topHeight
            )) {
                this.gameOver();
                return;
            }

            // Check collision with bottom pipe
            if (this.isColliding(
                effectiveBirdX, effectiveBirdY, effectiveBirdWidth, effectiveBirdHeight,
                pipe.x, pipe.bottomY, this.pipeWidth, pipe.bottomHeight
            )) {
                this.gameOver();
                return;
            }
        }
    }
    
    isColliding(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }
    
    updateScore() {
        this.currentScoreEl.textContent = this.score;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('flappyBestScore', this.bestScore.toString());
        }
        
        // Show game over screen
        this.finalScoreEl.textContent = this.score;
        this.updateBestScoreDisplay();
        this.gameUI.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    updateBestScoreDisplay() {
        this.bestScoreEl.textContent = this.bestScore;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw animated background
        this.drawBackground();
        
        // Draw bird trail
        this.drawBirdTrail();
        
        // Draw pipes
        this.drawPipes();
        
        // Draw bird
        this.drawBird();
        
        // Draw particles
        this.drawParticles();
    }
    
    drawBackground() {
        // Animated background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#66BB6A');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Moving clouds effect
        this.backgroundOffset += 0.5;
        if (this.backgroundOffset > this.canvas.width) {
            this.backgroundOffset = 0;
        }
        
        // Draw clouds
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 3; i++) {
            const x = (this.backgroundOffset + i * 150) % (this.canvas.width + 100) - 50;
            const y = 50 + i * 30;
            this.drawCloud(x, y, 0.8 + i * 0.1);
        }
        this.ctx.restore();
    }
    
    drawCloud(x, y, scale) {
        this.ctx.save();
        this.ctx.scale(scale, scale);
        this.ctx.beginPath();
        this.ctx.arc(x/scale, y/scale, 15, 0, Math.PI * 2);
        this.ctx.arc(x/scale + 15, y/scale, 20, 0, Math.PI * 2);
        this.ctx.arc(x/scale + 30, y/scale, 15, 0, Math.PI * 2);
        this.ctx.arc(x/scale + 15, y/scale - 10, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    drawBirdTrail() {
        if (this.bird.trail.length > 1) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            for (let i = 0; i < this.bird.trail.length - 1; i++) {
                const alpha = (i / this.bird.trail.length) * 0.3;
                this.ctx.globalAlpha = alpha;
                const point = this.bird.trail[i];
                const nextPoint = this.bird.trail[i + 1];
                if (i === 0) {
                    this.ctx.moveTo(point.x + this.bird.width / 2, point.y + this.bird.height / 2);
                }
                this.ctx.lineTo(nextPoint.x + this.bird.width / 2, nextPoint.y + this.bird.height / 2);
            }
            this.ctx.stroke();
            this.ctx.restore();
        }
    }
    
    drawBird() {
        this.ctx.save();
        
        // Move to bird center for rotation
        this.ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
        this.ctx.rotate(this.bird.rotation);
        
        // Wing animation offset
        const wingOffset = Math.sin(this.bird.wingFlap) * 2;
        
        // Draw bird shadow
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(-this.bird.width / 2 + 2, -this.bird.height / 2 + 2, this.bird.width, this.bird.height);
        this.ctx.restore();
        
        // Draw bird body with gradient
        const bodyGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.bird.width);
        bodyGradient.addColorStop(0, '#FFD700');
        bodyGradient.addColorStop(1, '#FFA500');
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fillRect(-this.bird.width / 2, -this.bird.height / 2, this.bird.width, this.bird.height);
        
        // Draw animated wings
        this.ctx.fillStyle = '#FF8C00';
        this.ctx.beginPath();
        this.ctx.ellipse(-this.bird.width / 4, wingOffset, 8, 4, -0.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(-this.bird.width / 4, wingOffset, 6, 3, 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw bird outline
        this.ctx.strokeStyle = '#FF8C00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-this.bird.width / 2, -this.bird.height / 2, this.bird.width, this.bird.height);
        
        // Draw eye with shine
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.width / 4, -this.bird.height / 4, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye shine
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.width / 4 + 1, -this.bird.height / 4 - 1, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw enhanced beak
        const beakGradient = this.ctx.createLinearGradient(this.bird.width / 2, -2, this.bird.width / 2 + 8, 2);
        beakGradient.addColorStop(0, '#FF8C00');
        beakGradient.addColorStop(1, '#FF6347');
        this.ctx.fillStyle = beakGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(this.bird.width / 2, -3);
        this.ctx.lineTo(this.bird.width / 2 + 10, 0);
        this.ctx.lineTo(this.bird.width / 2, 3);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawPipes() {
        for (const pipe of this.pipes) {
            // Top pipe
            this.ctx.fillStyle = '#32CD32';
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            this.ctx.strokeStyle = '#228B22';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            
            // Bottom pipe
            this.ctx.fillStyle = '#32CD32';
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, pipe.bottomHeight);
            this.ctx.strokeStyle = '#228B22';
            this.ctx.strokeRect(pipe.x, pipe.bottomY, this.pipeWidth, pipe.bottomHeight);
            
            // Pipe caps
            const capHeight = 20;
            const capWidth = this.pipeWidth + 6;
            const capOffset = (capWidth - this.pipeWidth) / 2;
            
            // Top cap
            this.ctx.fillStyle = '#228B22';
            this.ctx.fillRect(pipe.x - capOffset, pipe.topHeight - capHeight, capWidth, capHeight);
            this.ctx.strokeRect(pipe.x - capOffset, pipe.topHeight - capHeight, capWidth, capHeight);
            
            // Bottom cap
            this.ctx.fillRect(pipe.x - capOffset, pipe.bottomY, capWidth, capHeight);
            this.ctx.strokeRect(pipe.x - capOffset, pipe.bottomY, capWidth, capHeight);
        }
    }
    
    drawStartScreen() {
        this.draw();
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        this.updateBird();
        this.updatePipes();
        this.updateParticles();
        this.checkCollisions();
        this.draw();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FlappyBird();
});