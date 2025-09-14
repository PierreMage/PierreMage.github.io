// Tetris Game Implementation
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // Game constants
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.CELL_SIZE = 30;
        
        // Game state
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.dropTime = 0;
        this.dropInterval = 1000; // milliseconds
        
        // Audio
        this.sfxEnabled = true;
        this.audioContext = null;
        
        // Mobile and tablet controls
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.lastTapTime = 0;
        this.tapTimeout = null;
        
        // Initialize
        this.initializeBoard();
        this.initializeAudio();
        this.setupEventListeners();
        this.showStartScreen();
    }
    
    // Tetromino shapes and colors
    tetrominoes = {
        I: {
            shape: [
                [1, 1, 1, 1]
            ],
            color: '#00FFFF'
        },
        O: {
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: '#FFFF00'
        },
        T: {
            shape: [
                [0, 1, 0],
                [1, 1, 1]
            ],
            color: '#800080'
        },
        S: {
            shape: [
                [0, 1, 1],
                [1, 1, 0]
            ],
            color: '#00FF00'
        },
        Z: {
            shape: [
                [1, 1, 0],
                [0, 1, 1]
            ],
            color: '#FF0000'
        },
        J: {
            shape: [
                [1, 0, 0],
                [1, 1, 1]
            ],
            color: '#0000FF'
        },
        L: {
            shape: [
                [0, 0, 1],
                [1, 1, 1]
            ],
            color: '#FFA500'
        }
    };
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 1024;
    }
    
    detectTablet() {
        return (/iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 769 && window.innerWidth <= 1024) ||
               (window.innerWidth >= 769 && window.innerWidth <= 1024 && 'ontouchstart' in window);
    }
    
    initializeBoard() {
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
    }
    
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    playSoundEffect(frequency, duration = 0.1) {
        if (!this.audioContext || !this.sfxEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playTetrisSound() {
        if (!this.audioContext || !this.sfxEnabled) return;
        
        // Play a triumphant ascending sequence for Tetris (4 lines)
        const tetrisNotes = [440, 523.25, 659.25, 880]; // A4, C5, E5, A5
        
        tetrisNotes.forEach((freq, index) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.type = 'square';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.2);
            }, index * 100);
        });
    }
    
    playGameOverSound() {
        if (!this.audioContext || !this.sfxEnabled) return;
        
        // Play a descending "sad" sequence for game over
        const gameOverNotes = [659.25, 523.25, 440, 349.23]; // E5, C5, A4, F4
        
        gameOverNotes.forEach((freq, index) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.005, this.audioContext.currentTime + 0.4);
                
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.4);
            }, index * 150);
        });
    }
    
    setupEventListeners() {
        // Desktop keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused) return;

            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.moveRight();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.moveDown();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case ' ':
                    e.preventDefault();
                    this.hardDrop();
                    break;
            }
        });

        // Pause functionality
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && this.gameRunning) {
                e.preventDefault();
                this.togglePause();
            }
        });
        
        // UI buttons
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause());
        document.getElementById('sfxToggle').addEventListener('click', () => this.toggleSFX());
        
        // Canvas touch events for gestures
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), {passive: false});
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), {passive: false});
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), {passive: false});
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
    }
    
    handleTouchMove(e) {
        e.preventDefault();
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const deltaTime = Date.now() - this.touchStartTime;
        const currentTime = Date.now();
        
        // Handle pause/unpause with double-tap
        if (deltaTime < 200 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
            // This was a tap, not a swipe
            if (currentTime - this.lastTapTime < 300) {
                // Double tap - toggle pause
                if (this.tapTimeout) {
                    clearTimeout(this.tapTimeout);
                    this.tapTimeout = null;
                }
                this.togglePause();
                this.lastTapTime = 0;
                return;
            } else {
                // First tap - wait for potential second tap
                this.lastTapTime = currentTime;
                if (this.gameRunning && !this.gamePaused) {
                    // If game is running, set timeout to rotate after delay if no second tap
                    this.tapTimeout = setTimeout(() => {
                        this.rotatePiece();
                        this.tapTimeout = null;
                    }, 300);
                }
                return;
            }
        }
        
        if (!this.gameRunning || this.gamePaused) return;
        
        // Swipe detection
        const minSwipeDistance = 30;
        const maxSwipeTime = 300;
        
        if (deltaTime < maxSwipeTime) {
            if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
                // Vertical swipe
                if (deltaY < 0) {
                    // Upward swipe - rotate piece
                    this.rotatePiece();
                } else {
                    // Downward swipe - hard drop
                    this.hardDrop();
                }
            } else if (Math.abs(deltaX) > minSwipeDistance) {
                // Horizontal swipe
                if (deltaX > 0) {
                    this.moveRight();
                } else {
                    this.moveLeft();
                }
            }
        }
    }
    
    generatePiece() {
        const types = Object.keys(this.tetrominoes);
        const type = types[Math.floor(Math.random() * types.length)];
        const tetromino = this.tetrominoes[type];
        
        return {
            type: type,
            shape: tetromino.shape.map(row => [...row]),
            color: tetromino.color,
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
            y: 0
        };
    }
    
    isValidMove(piece, deltaX = 0, deltaY = 0, newShape = null) {
        const shape = newShape || piece.shape;
        const newX = piece.x + deltaX;
        const newY = piece.y + deltaY;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardX = newX + x;
                    const boardY = newY + y;
                    
                    if (boardX < 0 || boardX >= this.BOARD_WIDTH ||
                        boardY >= this.BOARD_HEIGHT ||
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        
        if (this.isValidMove(this.currentPiece, 0, 0, rotated)) {
            this.currentPiece.shape = rotated;
            this.playSoundEffect(523.25, 0.08); // C5 - pleasant rotation sound
            this.draw();
        }
    }
    
    moveLeft() {
        if (this.currentPiece && this.isValidMove(this.currentPiece, -1, 0)) {
            this.currentPiece.x--;
            this.playSoundEffect(440, 0.04); // A4 - subtle move sound
            this.draw();
        }
    }
    
    moveRight() {
        if (this.currentPiece && this.isValidMove(this.currentPiece, 1, 0)) {
            this.currentPiece.x++;
            this.playSoundEffect(440, 0.04); // A4 - subtle move sound
            this.draw();
        }
    }
    
    moveDown() {
        if (this.currentPiece && this.isValidMove(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            this.score += 1;
            this.updateScore();
            this.draw();
            return true;
        }
        return false;
    }
    
    hardDrop() {
        if (!this.currentPiece) return;
        
        let dropDistance = 0;
        while (this.moveDown()) {
            dropDistance++;
        }
        
        if (dropDistance > 0) {
            this.score += dropDistance * 2;
            this.updateScore();
            this.playSoundEffect(261.63, 0.15); // C4 - satisfying drop sound
        }
        
        this.lockPiece();
    }
    
    lockPiece() {
        if (!this.currentPiece) return;
        
        // Place piece on board
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // Check for completed lines
        this.clearLines();
        
        // Spawn next piece
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.generatePiece();
        
        // Check for game over
        if (!this.isValidMove(this.currentPiece)) {
            this.gameOver = true;
            this.gameRunning = false;

            this.showGameOver();
            this.playGameOverSound();
        }
        
        this.draw();
        this.drawNext();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // Check the same row again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            
            // Scoring system
            const scores = [0, 100, 300, 500, 800];
            this.score += scores[linesCleared] * this.level;
            
            // Level progression
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            
            this.updateScore();
            // Different sounds for different line clears
            if (linesCleared === 4) {
                this.playTetrisSound(); // Special Tetris sound
            } else {
                this.playSoundEffect(783.99, 0.25); // G5 - line clear sound
            }
        }
    }
    
    updateScore() {
        document.querySelector('.score').textContent = this.score.toLocaleString();
        document.querySelector('.level').textContent = this.level;
        document.querySelector('.lines').textContent = this.lines;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawCell(x, y, this.board[y][x]);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawCell(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            this.currentPiece.color
                        );
                    }
                }
            }
        }
        
        // Draw grid
        this.drawGrid();
    }
    
    drawCell(x, y, color) {
        const pixelX = x * this.CELL_SIZE;
        const pixelY = y * this.CELL_SIZE;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX, pixelY, this.CELL_SIZE, this.CELL_SIZE);
        
        // Add border for 3D effect
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pixelX, pixelY, this.CELL_SIZE, this.CELL_SIZE);
        
        // Add inner shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.ctx.fillRect(pixelX + this.CELL_SIZE - 3, pixelY, 3, this.CELL_SIZE);
        this.ctx.fillRect(pixelX, pixelY + this.CELL_SIZE - 3, this.CELL_SIZE, 3);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.CELL_SIZE, 0);
            this.ctx.lineTo(x * this.CELL_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.CELL_SIZE);
            this.ctx.lineTo(this.canvas.width, y * this.CELL_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawNext() {
        if (!this.nextPiece) return;
        
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const cellSize = 20;
        const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * cellSize) / 2;
        const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * cellSize) / 2;
        
        for (let y = 0; y < this.nextPiece.shape.length; y++) {
            for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                if (this.nextPiece.shape[y][x]) {
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(
                        offsetX + x * cellSize,
                        offsetY + y * cellSize,
                        cellSize,
                        cellSize
                    );
                    
                    this.nextCtx.strokeStyle = '#FFF';
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.strokeRect(
                        offsetX + x * cellSize,
                        offsetY + y * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
    }
    
    gameLoop(timestamp) {
        if (!this.gameRunning || this.gamePaused) {
            requestAnimationFrame((ts) => this.gameLoop(ts));
            return;
        }
        
        if (timestamp - this.dropTime > this.dropInterval) {
            if (!this.moveDown()) {
                this.lockPiece();
            }
            this.dropTime = timestamp;
        }
        
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }
    
    startGame() {
        this.initializeBoard();
        this.currentPiece = this.generatePiece();
        this.nextPiece = this.generatePiece();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = true;
        this.gamePaused = false;
        this.gameOver = false;
        this.dropInterval = 1000;
        
        this.updateScore();
        this.hideOverlay();
        this.draw();
        this.drawNext();
        
        // Reset pause button text
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) {
            pauseButton.textContent = '⏸ PAUSE';
        }
        
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }
    
    restartGame() {
        this.startGame();
    }
    
    togglePause() {
        if (!this.gameRunning || this.gameOver) return;
        
        this.gamePaused = !this.gamePaused;
        
        // Update pause button text
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) {
            pauseButton.textContent = this.gamePaused ? '▶ RESUME' : '⏸ PAUSE';
        }
        
        if (this.gamePaused) {
            this.showPauseScreen();
        } else {
            this.hideOverlay();
        }
    }
    
    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        const button = document.getElementById('sfxToggle');
        button.textContent = this.sfxEnabled ? '♫ ON' : '♫ OFF';
        button.classList.toggle('off', !this.sfxEnabled);
    }
    
    showStartScreen() {
        const overlay = document.getElementById('gameOverlay');
        const title = document.getElementById('overlayTitle');
        const message = document.getElementById('overlayMessage');
        const startBtn = document.getElementById('startButton');
        const restartBtn = document.getElementById('restartButton');
        
        title.textContent = 'TETRIS';
        message.textContent = 'Press START to begin';
        startBtn.style.display = 'inline-block';
        restartBtn.style.display = 'none';
        overlay.style.display = 'flex';
    }
    
    showPauseScreen() {
        const overlay = document.getElementById('gameOverlay');
        const title = document.getElementById('overlayTitle');
        const message = document.getElementById('overlayMessage');
        const startBtn = document.getElementById('startButton');
        const restartBtn = document.getElementById('restartButton');
        
        title.textContent = 'PAUSED';
        
        // Device-specific pause instructions
        if (this.isTablet || this.isMobile) {
            message.textContent = 'Double-tap to continue';
        } else {
            message.textContent = 'Press SPACE or double-tap to continue';
        }
        
        startBtn.style.display = 'none';
        restartBtn.style.display = 'none';
        overlay.style.display = 'flex';
    }
    
    showGameOver() {
        const overlay = document.getElementById('gameOverlay');
        const title = document.getElementById('overlayTitle');
        const message = document.getElementById('overlayMessage');
        const startBtn = document.getElementById('startButton');
        const restartBtn = document.getElementById('restartButton');
        
        title.textContent = 'GAME OVER';
        message.textContent = `Final Score: ${this.score.toLocaleString()}`;
        startBtn.style.display = 'none';
        restartBtn.style.display = 'inline-block';
        overlay.style.display = 'flex';
    }
    
    hideOverlay() {
        document.getElementById('gameOverlay').style.display = 'none';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TetrisGame();
});