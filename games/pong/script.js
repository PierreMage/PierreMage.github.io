// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerScoreElement = document.getElementById('playerScore');
const computerScoreElement = document.getElementById('computerScore');
const player1Label = document.getElementById('player1Label');
const player2Label = document.getElementById('player2Label');
const controlsText = document.getElementById('controlsText');
const playPauseButton = document.getElementById('playPauseButton');
const resetButton = document.getElementById('resetButton');
const gameModeRadios = document.querySelectorAll('input[name="gameMode"]');

// Game state
let gameRunning = false;
let gameAnimationId = null;
let gameMode = 'single'; // 'single' or 'two'
let gameDifficulty = 'medium'; // 'easy', 'medium', 'hard'
let ballSpeedSetting = 'normal'; // 'normal', 'fast', 'faster', 'extreme'

// Ball speed multipliers
const ballSpeedMultipliers = {
    normal: 1.0,
    fast: 1.4,
    faster: 1.8,
    extreme: 2.3
};

// Difficulty settings
const difficultySettings = {
    easy: {
        ballSpeed: 3,
        playerSpeed: 10,
        aiSpeed: 4,
        aiReactionDelay: 50, // AI is slower to react
        errorRate: 0.15 // 15% chance of making mistakes
    },
    medium: {
        ballSpeed: 5,
        playerSpeed: 8,
        aiSpeed: 6,
        aiReactionDelay: 35, // Normal AI reaction
        errorRate: 0.08 // 8% chance of making mistakes
    },
    hard: {
        ballSpeed: 7,
        playerSpeed: 8,
        aiSpeed: 8,
        aiReactionDelay: 20, // Fast AI reaction
        errorRate: 0.03 // 3% chance of making mistakes
    }
};

// Game objects
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 8,
    velocityX: 5,
    velocityY: 3,
    speed: 5
};

const playerPaddle = {
    x: 10,
    y: 0, // Will be set correctly on initialization
    width: 10,
    height: 100,
    speed: 8
};

const computerPaddle = {
    x: canvas.width - 20,
    y: 0, // Will be set correctly on initialization
    width: 10,
    height: 100,
    speed: 6
};

// Score
let playerScore = 0;
let computerScore = 0;

// Audio context for sound effects
let audioContext;
let soundEnabled = true;

// Initialize audio context
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API not supported');
        soundEnabled = false;
    }
}

// Sound effect functions
function playSound(frequency, duration, type = 'sine') {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Specific pong sound effects
const sounds = {
    paddleHit: () => playSound(800, 0.1, 'square'),      // High beep for paddle hits
    wallBounce: () => playSound(400, 0.1, 'square'),     // Mid beep for wall bounces
    score: () => {                                        // Lower tone sequence for scoring
        playSound(300, 0.2, 'square');
        setTimeout(() => playSound(200, 0.3, 'square'), 100);
    },
    gameStart: () => {                                    // Rising tone for game start
        playSound(440, 0.1, 'sine');
        setTimeout(() => playSound(554, 0.1, 'sine'), 100);
        setTimeout(() => playSound(659, 0.2, 'sine'), 200);
    }
};

// Input handling
const keys = {};
const touchState = {
    leftPaddleTouchY: null,
    rightPaddleTouchY: null
};

// Detect touch device
function isTouchDevice() {
    return (('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           (navigator.msMaxTouchPoints > 0));
}


document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
});

// Difficulty management
function applyDifficultySettings() {
    const settings = difficultySettings[gameDifficulty];
    const speedMultiplier = ballSpeedMultipliers[ballSpeedSetting];
    
    // Update speeds based on difficulty and ball speed setting
    ball.speed = settings.ballSpeed * speedMultiplier;
    playerPaddle.speed = settings.playerSpeed;
    computerPaddle.speed = settings.aiSpeed;
    
    // Reset ball velocity with new speed
    const direction = ball.velocityX > 0 ? 1 : -1;
    ball.velocityX = direction * ball.speed;
    ball.velocityY = ball.velocityY > 0 ? ball.speed * 0.6 : -ball.speed * 0.6;
}

function updateDifficulty() {
    const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked');
    if (selectedDifficulty) {
        gameDifficulty = selectedDifficulty.value;
        applyDifficultySettings();
        console.log(`Difficulty changed to: ${gameDifficulty}`);
    }
}

function updateBallSpeed() {
    const selectedSpeed = document.querySelector('input[name="ballSpeed"]:checked');
    if (selectedSpeed) {
        ballSpeedSetting = selectedSpeed.value;
        applyDifficultySettings();
        console.log(`Ball speed changed to: ${ballSpeedSetting} (${ballSpeedMultipliers[ballSpeedSetting]}x)`);
    }
}

// Game functions
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    const settings = difficultySettings[gameDifficulty];
    const speedMultiplier = ballSpeedMultipliers[ballSpeedSetting];
    const finalBallSpeed = settings.ballSpeed * speedMultiplier;
    ball.velocityX = (Math.random() > 0.5 ? 1 : -1) * finalBallSpeed;
    ball.velocityY = (Math.random() - 0.5) * finalBallSpeed * 0.8;
}

function updatePlayerPaddle() {
    let newY = playerPaddle.y;
    let inputDetected = false;
    
    // Priority 1: Direct paddle touch (absolute positioning)
    if (touchState.leftPaddleTouchY !== null) {
        const targetY = touchState.leftPaddleTouchY - playerPaddle.height / 2;
        newY = targetY;
        inputDetected = true;
    }
    // Priority 2: Keyboard (incremental movement)
    else {
        let keyboardUp = false, keyboardDown = false;
        
        if (gameMode === 'single') {
            keyboardUp = keys['w'] || keys['ArrowUp'];
            keyboardDown = keys['s'] || keys['ArrowDown'];
        } else {
            keyboardUp = keys['w'];
            keyboardDown = keys['s'];
        }
        
        if (keyboardUp || keyboardDown) {
            if (keyboardUp) {
                newY = playerPaddle.y - playerPaddle.speed;
            }
            if (keyboardDown) {
                newY = playerPaddle.y + playerPaddle.speed;
            }
            inputDetected = true;
        }
    }
    
    if (inputDetected) {
        playerPaddle.y = Math.max(0, Math.min(canvas.height - playerPaddle.height, newY));
    }
}

function updatePlayer2Paddle() {
    if (gameMode === 'single') {
        // AI with difficulty-based behavior
        const paddleCenter = computerPaddle.y + computerPaddle.height / 2;
        const ballY = ball.y;
        const settings = difficultySettings[gameDifficulty];
        
        // AI reaction zone varies by difficulty
        const reactionZone = settings.aiReactionDelay;
        
        // Check for AI error (occasional mistakes)
        const makeError = Math.random() < settings.errorRate;
        
        let newY = computerPaddle.y;
        
        if (makeError) {
            // AI makes a mistake - choose random error type
            const errorType = Math.random();
            if (errorType < 0.4) {
                // Error type 1: Move in wrong direction (40% of errors)
                if (paddleCenter < ballY - reactionZone) {
                    newY = computerPaddle.y - computerPaddle.speed; // Move up instead of down
                } else if (paddleCenter > ballY + reactionZone) {
                    newY = computerPaddle.y + computerPaddle.speed; // Move down instead of up
                }
            } else if (errorType < 0.7) {
                // Error type 2: Overshoot/undershoot (30% of errors)
                const overshootFactor = 1 + Math.random() * 0.8; // 1.0 to 1.8x speed
                if (paddleCenter < ballY - reactionZone) {
                    newY = computerPaddle.y + computerPaddle.speed * overshootFactor;
                } else if (paddleCenter > ballY + reactionZone) {
                    newY = computerPaddle.y - computerPaddle.speed * overshootFactor;
                }
            }
            // Error type 3: Hesitation/no movement (30% of errors) - newY stays the same
        } else {
            // Normal AI behavior
            if (paddleCenter < ballY - reactionZone) {
                newY = computerPaddle.y + computerPaddle.speed;
            } else if (paddleCenter > ballY + reactionZone) {
                newY = computerPaddle.y - computerPaddle.speed;
            }
        }
        
        computerPaddle.y = Math.max(0, Math.min(canvas.height - computerPaddle.height, newY));
    } else {
        // Two-player mode: human controls
        let newY = computerPaddle.y;
        let inputDetected = false;
        
        if (touchState.rightPaddleTouchY !== null) {
            const targetY = touchState.rightPaddleTouchY - computerPaddle.height / 2;
            newY = targetY;
            inputDetected = true;
        } else {
            if (keys['ArrowUp'] || keys['ArrowDown']) {
                if (keys['ArrowUp']) {
                    newY = computerPaddle.y - computerPaddle.speed;
                }
                if (keys['ArrowDown']) {
                    newY = computerPaddle.y + computerPaddle.speed;
                }
                inputDetected = true;
            }
        }
        
        if (inputDetected) {
            computerPaddle.y = Math.max(0, Math.min(canvas.height - computerPaddle.height, newY));
        }
    }
}

function updateBall() {
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    
    // Ball collision with top and bottom walls
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.velocityY = -ball.velocityY;
        sounds.wallBounce();
    }
    
    // Ball collision with player paddle
    if (ball.x - ball.radius <= playerPaddle.x + playerPaddle.width &&
        ball.y >= playerPaddle.y &&
        ball.y <= playerPaddle.y + playerPaddle.height &&
        ball.velocityX < 0) {
        
        ball.velocityX = -ball.velocityX;
        // Add some spin based on where the ball hits the paddle
        const hitPos = (ball.y - playerPaddle.y) / playerPaddle.height;
        ball.velocityY = (hitPos - 0.5) * ball.speed * 1.5;
        sounds.paddleHit();
    }
    
    // Ball collision with computer paddle
    if (ball.x + ball.radius >= computerPaddle.x &&
        ball.y >= computerPaddle.y &&
        ball.y <= computerPaddle.y + computerPaddle.height &&
        ball.velocityX > 0) {
        
        ball.velocityX = -ball.velocityX;
        // Add some spin based on where the ball hits the paddle
        const hitPos = (ball.y - computerPaddle.y) / computerPaddle.height;
        ball.velocityY = (hitPos - 0.5) * ball.speed * 1.5;
        sounds.paddleHit();
    }
    
    // Ball goes out of bounds
    if (ball.x < 0) {
        computerScore++;
        computerScoreElement.textContent = computerScore;
        sounds.score();
        resetBall();
    } else if (ball.x > canvas.width) {
        playerScore++;
        playerScoreElement.textContent = playerScore;
        sounds.score();
        resetBall();
    }
}

function drawRect(x, y, width, height, color = '#00ff00') {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawCircle(x, y, radius, color = '#00ff00') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawNet() {
    const netWidth = 4;
    const netHeight = 10;
    const gap = 15;
    
    ctx.fillStyle = '#00ff00';
    for (let i = 0; i < canvas.height; i += netHeight + gap) {
        ctx.fillRect(canvas.width / 2 - netWidth / 2, i, netWidth, netHeight);
    }
}

function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw net
    drawNet();
    
    // Draw paddles
    drawRect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height);
    drawRect(computerPaddle.x, computerPaddle.y, computerPaddle.width, computerPaddle.height);
    
    // Draw ball
    drawCircle(ball.x, ball.y, ball.radius);
}

function gameLoop() {
    if (!gameRunning) return;
    
    updatePlayerPaddle();
    updatePlayer2Paddle();
    updateBall();
    render();
    
    gameAnimationId = requestAnimationFrame(gameLoop);
}

function togglePlayPause() {
    if (gameRunning) {
        pauseGame();
    } else {
        startGame();
    }
}

function startGame() {
    if (gameRunning) return;
    
    // Initialize audio context on first user interaction (required by browsers)
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    gameRunning = true;
    updatePlayPauseButton();
    
    sounds.gameStart();
    gameLoop();
}

function pauseGame() {
    gameRunning = false;
    updatePlayPauseButton();
    
    if (gameAnimationId) {
        cancelAnimationFrame(gameAnimationId);
        gameAnimationId = null;
    }
}

function updatePlayPauseButton() {
    if (gameRunning) {
        playPauseButton.textContent = 'Pause';
        playPauseButton.title = 'Pause the game';
    } else {
        playPauseButton.textContent = 'Play';
        playPauseButton.title = 'Start the game';
    }
}

function resetGame() {
    pauseGame();
    
    // Reset scores
    playerScore = 0;
    computerScore = 0;
    playerScoreElement.textContent = playerScore;
    computerScoreElement.textContent = computerScore;
    
    // Reset positions
    playerPaddle.y = canvas.height / 2 - playerPaddle.height / 2;
    computerPaddle.y = canvas.height / 2 - computerPaddle.height / 2;
    resetBall();
    
    // Render initial state
    render();
    
    // Make sure button shows correct state
    updatePlayPauseButton();
}

// Game mode change function
function updateGameMode() {
    const selectedMode = document.querySelector('input[name="gameMode"]:checked').value;
    gameMode = selectedMode;
    
    if (gameMode === 'single') {
        player1Label.textContent = 'Player: ';
        player2Label.textContent = 'Computer: ';
        updateControlsText();
    } else {
        player1Label.textContent = 'Player 1: ';
        player2Label.textContent = 'Player 2: ';
        updateControlsText();
    }
    
    // Reset game when mode changes
    resetGame();
}

// Update controls text based on device type and game mode
function updateControlsText() {
    const isMobile = isTouchDevice() || window.innerWidth <= 768;
    
    if (gameMode === 'single') {
        if (isMobile) {
            controlsText.textContent = 'Controls: Touch and drag the left paddle or touch the left side of the screen';
        } else {
            controlsText.textContent = 'Controls: Use W/S keys or Arrow Up/Down to move your paddle. Spacebar to play/pause.';
        }
    } else {
        if (isMobile) {
            controlsText.textContent = 'Controls: Touch and drag each paddle to move them';
        } else {
            controlsText.textContent = 'Controls: Player 1 uses W/S keys, Player 2 uses Arrow Up/Down keys. Spacebar to play/pause.';
        }
    }
}


// Direct paddle touch detection
function addPaddleTouchListeners() {
    canvas.addEventListener('touchstart', handlePaddleTouchStart, {passive: false});
    canvas.addEventListener('touchmove', handlePaddleTouchMove, {passive: false});
    canvas.addEventListener('touchend', handlePaddleTouchEnd, {passive: false});
}

// Check if a touch is over a paddle area
function getTouchedPaddle(touchX, touchY, canvasRect) {
    // Convert screen coordinates to canvas coordinates
    const canvasX = (touchX - canvasRect.left) * (canvas.width / canvasRect.width);
    const canvasY = (touchY - canvasRect.top) * (canvas.height / canvasRect.height);
    
    // Define touch areas for paddles (slightly larger than actual paddles for easier touch)
    const touchPadding = 20;
    
    // Left paddle area
    if (canvasX >= playerPaddle.x - touchPadding && 
        canvasX <= playerPaddle.x + playerPaddle.width + touchPadding &&
        canvasY >= playerPaddle.y - touchPadding &&
        canvasY <= playerPaddle.y + playerPaddle.height + touchPadding) {
        return { paddle: 'left', y: canvasY };
    }
    
    // Right paddle area (only in two-player mode)
    if (gameMode === 'two' &&
        canvasX >= computerPaddle.x - touchPadding && 
        canvasX <= computerPaddle.x + computerPaddle.width + touchPadding &&
        canvasY >= computerPaddle.y - touchPadding &&
        canvasY <= computerPaddle.y + computerPaddle.height + touchPadding) {
        return { paddle: 'right', y: canvasY };
    }
    
    // In single player mode, any touch on the left half of screen controls left paddle
    if (gameMode === 'single' && canvasX < canvas.width / 2) {
        return { paddle: 'left', y: canvasY };
    }
    
    return null;
}

function handlePaddleTouchStart(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const touchedPaddle = getTouchedPaddle(touch.clientX, touch.clientY, rect);
        
        if (touchedPaddle) {
            if (touchedPaddle.paddle === 'left') {
                touchState.leftPaddleTouchY = touchedPaddle.y;
            } else if (touchedPaddle.paddle === 'right') {
                touchState.rightPaddleTouchY = touchedPaddle.y;
            }
        }
    }
}

function handlePaddleTouchMove(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const touchedPaddle = getTouchedPaddle(touch.clientX, touch.clientY, rect);
        
        if (touchedPaddle) {
            if (touchedPaddle.paddle === 'left') {
                touchState.leftPaddleTouchY = touchedPaddle.y;
            } else if (touchedPaddle.paddle === 'right') {
                touchState.rightPaddleTouchY = touchedPaddle.y;
            }
        }
    }
}

function handlePaddleTouchEnd(e) {
    e.preventDefault();
    
    // If no more touches, clear touch states
    if (e.touches.length === 0) {
        touchState.leftPaddleTouchY = null;
        touchState.rightPaddleTouchY = null;
    } else {
        // Check if remaining touches are still on paddles
        const rect = canvas.getBoundingClientRect();
        let leftStillTouched = false;
        let rightStillTouched = false;
        
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const touchedPaddle = getTouchedPaddle(touch.clientX, touch.clientY, rect);
            
            if (touchedPaddle) {
                if (touchedPaddle.paddle === 'left') {
                    leftStillTouched = true;
                    touchState.leftPaddleTouchY = touchedPaddle.y;
                } else if (touchedPaddle.paddle === 'right') {
                    rightStillTouched = true;
                    touchState.rightPaddleTouchY = touchedPaddle.y;
                }
            }
        }
        
        if (!leftStillTouched) {
            touchState.leftPaddleTouchY = null;
        }
        if (!rightStillTouched) {
            touchState.rightPaddleTouchY = null;
        }
    }
}

// Sound toggle functionality
const soundToggle = document.getElementById('soundToggle');

function toggleSound() {
    soundEnabled = !soundEnabled;
    updateSoundButton();
}

function updateSoundButton() {
    if (soundEnabled) {
        soundToggle.textContent = 'Sound On';
        soundToggle.className = 'sound-enabled';
    } else {
        soundToggle.textContent = 'Sound Off';
        soundToggle.className = 'sound-disabled';
    }
}

// Event listeners
playPauseButton.addEventListener('click', togglePlayPause);
resetButton.addEventListener('click', resetGame);
soundToggle.addEventListener('click', toggleSound);

// Game mode change listeners
gameModeRadios.forEach(radio => {
    radio.addEventListener('change', updateGameMode);
});

// Difficulty change listeners
const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
difficultyRadios.forEach(radio => {
    radio.addEventListener('change', updateDifficulty);
});

// Ball speed change listeners
const ballSpeedRadios = document.querySelectorAll('input[name="ballSpeed"]');
ballSpeedRadios.forEach(radio => {
    radio.addEventListener('change', updateBallSpeed);
});

// Handle special key shortcuts
document.addEventListener('keydown', (e) => {
    // Prevent arrow keys from scrolling the page
    if (['ArrowUp', 'ArrowDown'].includes(e.code)) {
        e.preventDefault();
    }
    
    // Spacebar to toggle play/pause
    if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
    }
});

// Initialize touch controls
function initializeTouchControls() {
    addPaddleTouchListeners();
}

// Handle window resize for responsive controls
window.addEventListener('resize', () => {
    updateControlsText();
});

// Initialize game
initAudio(); // Initialize audio system
initializeTouchControls();
applyDifficultySettings(); // Apply initial difficulty
updateGameMode();
resetGame();
