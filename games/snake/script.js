// Snake Game JavaScript

// Sound Manager for sound effects only (no music)
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.soundEnabled = true;
        this.soundGain = null;
        
        this.loadSettings();
        this.initAudio();
    }

    initAudio() {
        try {
            // Create AudioContext with user gesture requirement handling
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain node for sound effects volume control
            this.soundGain = this.audioContext.createGain();
            this.soundGain.connect(this.audioContext.destination);
            
            // Set initial volume
            this.updateVolume();
        } catch (error) {
            console.log('Web Audio API not supported:', error);
        }
    }

    // Resume audio context (required for user gesture)
    async resumeAudio() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.log('Could not resume audio context:', error);
            }
        }
    }

    loadSettings() {
        const soundSetting = localStorage.getItem('snakeSoundEnabled');
        
        if (soundSetting !== null) {
            this.soundEnabled = soundSetting === 'true';
        }
    }

    saveSettings() {
        localStorage.setItem('snakeSoundEnabled', this.soundEnabled.toString());
    }

    updateVolume() {
        if (this.soundGain) {
            this.soundGain.gain.value = this.soundEnabled ? 0.25 : 0;
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.updateVolume();
        this.saveSettings();
        return this.soundEnabled;
    }

    // Create 8-bit style oscillator
    createOscillator(frequency, type = 'square') {
        if (!this.audioContext) return null;
        
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        return oscillator;
    }

    // Play food eating sound (Game Boy-style pickup sound)
    playEatSound() {
        if (!this.audioContext || !this.soundEnabled) return;
        
        this.resumeAudio();
        
        // Create a more pleasant two-tone pickup sound
        const frequencies = [659, 880]; // E5, A5 - pleasing interval
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.createOscillator(freq, 'square');
            const envelope = this.audioContext.createGain();
            
            oscillator.connect(envelope);
            envelope.connect(this.soundGain);
            
            const startTime = this.audioContext.currentTime + (index * 0.05);
            const endTime = startTime + 0.12;
            
            envelope.gain.setValueAtTime(0, startTime);
            envelope.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
            envelope.gain.linearRampToValueAtTime(0.001, endTime);
            
            oscillator.start(startTime);
            oscillator.stop(endTime);
        });
    }

    // Play game over sound (Game Boy-style defeat sound)
    playGameOverSound() {
        if (!this.audioContext || !this.soundEnabled) return;
        
        this.resumeAudio();
        
        // Classic "game over" descending chromatic sequence
        const notes = [
            { freq: 523, duration: 0.2 },  // C5
            { freq: 494, duration: 0.2 },  // B4
            { freq: 466, duration: 0.2 },  // A#4
            { freq: 440, duration: 0.2 },  // A4
            { freq: 415, duration: 0.2 },  // G#4
            { freq: 392, duration: 0.2 },  // G4
            { freq: 370, duration: 0.2 },  // F#4
            { freq: 349, duration: 0.4 },  // F4 - longer final note
        ];
        
        notes.forEach((note, index) => {
            // Create harmonic for richer sound
            [1, 0.5].forEach((harmonic, harmonicIndex) => {
                const oscillator = this.createOscillator(note.freq * harmonic, 'square');
                const envelope = this.audioContext.createGain();
                
                oscillator.connect(envelope);
                envelope.connect(this.soundGain);
                
                const startTime = this.audioContext.currentTime + (index * 0.15);
                const endTime = startTime + note.duration;
                
                const volume = harmonicIndex === 0 ? 0.4 : 0.2; // Main note louder than harmonic
                
                envelope.gain.setValueAtTime(0, startTime);
                envelope.gain.linearRampToValueAtTime(volume, startTime + 0.01);
                envelope.gain.linearRampToValueAtTime(0.001, endTime);
                
                oscillator.start(startTime);
                oscillator.stop(endTime);
            });
        });
    }

    // Play start game sound (Game Boy-style power up)
    playStartSound() {
        if (!this.audioContext || !this.soundEnabled) return;
        
        this.resumeAudio();
        
        // Create ascending arpeggio for start sound
        const notes = [262, 330, 392, 523]; // C4, E4, G4, C5 - C major chord
        
        notes.forEach((freq, index) => {
            const oscillator = this.createOscillator(freq, 'square');
            const envelope = this.audioContext.createGain();
            
            oscillator.connect(envelope);
            envelope.connect(this.soundGain);
            
            const startTime = this.audioContext.currentTime + (index * 0.08);
            const endTime = startTime + 0.2;
            
            envelope.gain.setValueAtTime(0, startTime);
            envelope.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
            envelope.gain.linearRampToValueAtTime(0.001, endTime);
            
            oscillator.start(startTime);
            oscillator.stop(endTime);
        });
    }
}

class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.currentScoreElement = document.getElementById('current-score');
        this.highScoreElement = document.getElementById('high-score');
        this.finalScoreElement = document.getElementById('final-score');
        this.gameOverElement = document.getElementById('gameOver');
        this.restartBtn = document.getElementById('restart-btn');
        this.soundToggleBtn = document.getElementById('sound-toggle');
        this.resetHighScoreBtn = document.getElementById('reset-highscore');
        this.soundStatus = document.getElementById('sound-status');

        // Sound system
        this.soundManager = new SoundManager();

        // Game constants
        this.tileCount = 30; // 30x30 tiles in 450px canvas
        this.tileSize = this.canvas.width / this.tileCount;

        // Game state
        this.snake = [{ x: 10, y: 10 }];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameLoop = null;
        this.inputBuffer = [];
        
        // Touch controls
        this.touchStartX = null;
        this.touchStartY = null;
        this.minSwipeDistance = 30; // Minimum distance for a swipe to register
        
        // Speed settings (Nokia Snake gets faster as snake grows)
        this.baseSpeed = 200; // milliseconds between moves
        this.speedIncrement = 5; // speed increase per food eaten
        this.currentSpeed = this.baseSpeed;

        this.init();
    }

    init() {
        this.loadHighScore();
        this.generateFood();
        this.setupEventListeners();
        this.setupAudioControls();
        this.draw();
    }

    loadHighScore() {
        const savedHighScore = localStorage.getItem('snakeHighScore');
        if (savedHighScore) {
            this.highScore = parseInt(savedHighScore);
            this.highScoreElement.textContent = this.highScore;
        }
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore.toString());
            this.highScoreElement.textContent = this.highScore;
        }
    }
    
    resetHighScore() {
        this.highScore = 0;
        localStorage.removeItem('snakeHighScore');
        this.highScoreElement.textContent = this.highScore;
        
        // Play a confirmation sound
        if (this.soundManager) {
            this.soundManager.playStartSound();
        }
    }

    setupAudioControls() {
        // Initialize button states
        this.updateAudioUI();
        
        // Sound effects toggle
        this.soundToggleBtn.addEventListener('click', () => {
            this.soundManager.toggleSound();
            this.updateAudioUI();
        });
        
        // Reset high score
        this.resetHighScoreBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the high score to 0?')) {
                this.resetHighScore();
            }
        });
    }
    
    updateAudioUI() {
        // Update sound button
        this.soundStatus.textContent = this.soundManager.soundEnabled ? 'ON' : 'OFF';
        if (this.soundManager.soundEnabled) {
            this.soundToggleBtn.classList.remove('disabled');
        } else {
            this.soundToggleBtn.classList.add('disabled');
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning && e.code === 'Space') {
                this.startGame();
                return;
            }

            if (this.gameRunning && e.code === 'Space') {
                this.togglePause();
                return;
            }

            if (this.gameRunning && !this.gamePaused) {
                this.handleDirectionInput(e.code);
            }
            e.preventDefault();
        });

        this.restartBtn.addEventListener('click', () => {
            this.resetGame();
            this.startGame();
        });

        // Touch event listeners
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.touchStartX === null || this.touchStartY === null) return;

            const touch = e.changedTouches[0];
            const touchEndX = touch.clientX;
            const touchEndY = touch.clientY;

            this.handleSwipe(this.touchStartX, this.touchStartY, touchEndX, touchEndY);

            // Reset touch coordinates
            this.touchStartX = null;
            this.touchStartY = null;
        });

        // Prevent scrolling when touching the canvas
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });

        // Add click/tap event for starting game (useful for mobile)
        this.canvas.addEventListener('click', (e) => {
            if (!this.gameRunning) {
                this.startGame();
            }
        });
    }

    handleDirectionInput(keyCode) {
        // Get the current direction (either from current movement or the last input in buffer)
        let currentDx, currentDy;
        if (this.inputBuffer.length > 0) {
            const lastInput = this.inputBuffer[this.inputBuffer.length - 1];
            currentDx = lastInput.dx;
            currentDy = lastInput.dy;
        } else {
            currentDx = this.dx;
            currentDy = this.dy;
        }

        let newDx = currentDx;
        let newDy = currentDy;

        switch (keyCode) {
            case 'ArrowUp':
            case 'KeyW':
                if (currentDy === 0) {
                    newDx = 0;
                    newDy = -1;
                }
                break;
            case 'ArrowDown':
            case 'KeyS':
                if (currentDy === 0) {
                    newDx = 0;
                    newDy = 1;
                }
                break;
            case 'ArrowLeft':
            case 'KeyA':
                if (currentDx === 0) {
                    newDx = -1;
                    newDy = 0;
                }
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (currentDx === 0) {
                    newDx = 1;
                    newDy = 0;
                }
                break;
        }

        // Only add to buffer if direction actually changed
        if (newDx !== currentDx || newDy !== currentDy) {
            // Limit buffer size to prevent excessive queuing
            if (this.inputBuffer.length < 2) {
                this.inputBuffer.push({ dx: newDx, dy: newDy });
            }
        }
    }

    handleSwipe(startX, startY, endX, endY) {
        // If game is not running, start the game on any swipe
        if (!this.gameRunning) {
            this.startGame();
            return;
        }

        // If game is paused, unpause on any swipe
        if (this.gamePaused) {
            this.togglePause();
            return;
        }

        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Check if swipe is long enough
        if (Math.max(absDeltaX, absDeltaY) < this.minSwipeDistance) {
            return;
        }

        // Determine swipe direction based on the larger delta
        if (absDeltaX > absDeltaY) {
            // Horizontal swipe
            if (deltaX > 0) {
                // Swipe right
                this.handleDirectionInput('ArrowRight');
            } else {
                // Swipe left
                this.handleDirectionInput('ArrowLeft');
            }
        } else {
            // Vertical swipe
            if (deltaY > 0) {
                // Swipe down
                this.handleDirectionInput('ArrowDown');
            } else {
                // Swipe up
                this.handleDirectionInput('ArrowUp');
            }
        }
    }

    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.gameOverElement.style.display = 'none';
        
        // Play start sound (no background music)
        this.soundManager.playStartSound();
        
        // Start moving right
        this.dx = 1;
        this.dy = 0;
        
        this.gameLoop = setInterval(() => {
            if (!this.gamePaused) {
                this.update();
                this.draw();
            }
        }, this.currentSpeed);
    }

    togglePause() {
        this.gamePaused = !this.gamePaused;
    }

    resetGame() {
        clearInterval(this.gameLoop);
        
        this.snake = [{ x: 10, y: 10 }];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.currentSpeed = this.baseSpeed;
        this.gameRunning = false;
        this.gamePaused = false;
        this.inputBuffer = [];
        this.touchStartX = null;
        this.touchStartY = null;
        this.updateScore();
        this.generateFood();
        this.gameOverElement.style.display = 'none';
    }

    update() {
        // Process input buffer - apply the next direction change
        if (this.inputBuffer.length > 0) {
            const nextInput = this.inputBuffer.shift();
            this.dx = nextInput.dx;
            this.dy = nextInput.dy;
        }

        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // Check self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }

        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10; // Nokia Snake scoring
            this.updateScore();
            this.generateFood();
            this.increaseSpeed();
            
            // Play eat sound
            this.soundManager.playEatSound();
            
            // Add flash effect to score
            this.currentScoreElement.classList.add('score-flash');
            setTimeout(() => {
                this.currentScoreElement.classList.remove('score-flash');
            }, 300);
        } else {
            this.snake.pop();
        }
    }

    increaseSpeed() {
        // Nokia Snake gets faster as snake grows
        if (this.currentSpeed > 80) { // Minimum speed threshold
            this.currentSpeed = Math.max(80, this.currentSpeed - this.speedIncrement);
            
            // Restart the game loop with new speed
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => {
                if (!this.gamePaused) {
                    this.update();
                    this.draw();
                }
            }, this.currentSpeed);
        }
    }

    generateFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
    }

    updateScore() {
        this.currentScoreElement.textContent = this.score;
    }

    gameOver() {
        clearInterval(this.gameLoop);
        this.gameRunning = false;
        
        // Play game over sound (no background music to stop)
        this.soundManager.playGameOverSound();
        
        this.saveHighScore();
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'block';
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0d4d0d';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake
        this.ctx.fillStyle = '#00ff00';
        for (let segment of this.snake) {
            this.ctx.fillRect(
                segment.x * this.tileSize + 1,
                segment.y * this.tileSize + 1,
                this.tileSize - 2,
                this.tileSize - 2
            );
        }

        // Draw food
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillRect(
            this.food.x * this.tileSize + 1,
            this.food.y * this.tileSize + 1,
            this.tileSize - 2,
            this.tileSize - 2
        );

        // Draw grid lines (subtle)
        this.ctx.strokeStyle = '#1a5a1a';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.tileSize, 0);
            this.ctx.lineTo(i * this.tileSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.tileSize);
            this.ctx.lineTo(this.canvas.width, i * this.tileSize);
            this.ctx.stroke();
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});