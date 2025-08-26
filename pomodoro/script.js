class PomodoroTimer {
    constructor() {
        // Timer configurations (in minutes)
        this.modes = {
            pomodoro: 25,
            shortBreak: 5,
            longBreak: 15
        };
        
        // State management
        this.currentMode = 'pomodoro';
        this.timeLeft = this.modes[this.currentMode] * 60; // Convert to seconds
        this.isRunning = false;
        this.intervalId = null;
        this.completedPomodoros = 0;
        this.currentSession = 1;
        
        // DOM elements
        this.timeDisplay = document.getElementById('timeDisplay');
        this.startPauseBtn = document.getElementById('startPauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.skipBtn = document.getElementById('skipBtn');
        this.sessionCount = document.getElementById('sessionCount');
        this.modeTabs = document.querySelectorAll('.mode-tab');
        this.progressDots = document.querySelectorAll('.dot');
        
        this.init();
    }
    
    init() {
        this.loadState();
        this.bindEvents();
        this.updateDisplay();
        this.updateTheme();
        this.updateProgressDots();
    }
    
    bindEvents() {
        // Start/Pause button
        this.startPauseBtn.addEventListener('click', () => this.toggleTimer());
        
        // Reset button
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        
        // Skip button
        this.skipBtn.addEventListener('click', () => this.skipTimer());
        
        // Mode tabs
        this.modeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.switchMode(mode);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleTimer();
            } else if (e.code === 'KeyR') {
                e.preventDefault();
                this.resetTimer();
            } else if (e.code === 'KeyS') {
                e.preventDefault();
                this.skipTimer();
            }
        });
        
        // Save state before page unload
        window.addEventListener('beforeunload', () => this.saveState());
        
        // Auto-save state periodically
        setInterval(() => this.saveState(), 1000);
    }
    
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.isRunning = true;
        this.startPauseBtn.querySelector('.btn-text').textContent = 'PAUSE';
        
        this.intervalId = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.completeTimer();
            }
        }, 1000);
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.startPauseBtn.querySelector('.btn-text').textContent = 'START';
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    resetTimer() {
        this.pauseTimer();
        this.timeLeft = this.modes[this.currentMode] * 60;
        this.updateDisplay();
    }
    
    skipTimer() {
        this.pauseTimer();
        this.completeTimer();
    }
    
    completeTimer() {
        this.pauseTimer();
        this.playNotification();
        this.timeDisplay.classList.add('timer-complete');
        
        setTimeout(() => {
            this.timeDisplay.classList.remove('timer-complete');
        }, 1500);
        
        // Update session tracking
        if (this.currentMode === 'pomodoro') {
            this.completedPomodoros++;
            this.currentSession++;
        }
        
        // Auto-progress to next mode
        this.autoProgressMode();
        this.updateProgressDots();
        this.updateSessionInfo();
    }
    
    autoProgressMode() {
        if (this.currentMode === 'pomodoro') {
            // After 4 pomodoros, take a long break
            if (this.completedPomodoros % 4 === 0) {
                this.switchMode('longBreak');
            } else {
                this.switchMode('shortBreak');
            }
        } else {
            // After any break, return to pomodoro
            this.switchMode('pomodoro');
        }
    }
    
    switchMode(mode) {
        if (this.modes[mode]) {
            this.pauseTimer();
            this.currentMode = mode;
            this.timeLeft = this.modes[mode] * 60;
            this.updateDisplay();
            this.updateTheme();
            this.updateModeTab();
        }
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update document title
        document.title = `${this.timeDisplay.textContent} - Pomodoro Timer`;
    }
    
    updateTheme() {
        document.body.className = this.currentMode;
    }
    
    updateModeTab() {
        this.modeTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.mode === this.currentMode) {
                tab.classList.add('active');
            }
        });
    }
    
    updateProgressDots() {
        this.progressDots.forEach((dot, index) => {
            dot.classList.remove('active', 'completed');
            
            if (index < this.completedPomodoros % 4) {
                dot.classList.add('completed');
            } else if (index === this.completedPomodoros % 4 && this.currentMode === 'pomodoro') {
                dot.classList.add('active');
            }
        });
    }
    
    updateSessionInfo() {
        const currentInCycle = (this.completedPomodoros % 4) + 1;
        this.sessionCount.textContent = `Session ${currentInCycle} of 4`;
    }

    playNotification() {
        // Simple beep sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported');
        }

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pomodoro Timer', {
                body: this.currentMode === 'pomodoro' ? 'Time for a break!' : 'Time to focus!'
            });
        }
    }

    saveState() {
        const state = {
            currentMode: this.currentMode,
            timeLeft: this.timeLeft,
            isRunning: this.isRunning,
            completedPomodoros: this.completedPomodoros,
            currentSession: this.currentSession,
            timestamp: Date.now()
        };
        localStorage.setItem('pomodoroState', JSON.stringify(state));
    }

    loadState() {
        const savedState = localStorage.getItem('pomodoroState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                const timeDiff = Math.floor((Date.now() - state.timestamp) / 1000);

                if (timeDiff < 3600) {
                    this.currentMode = state.currentMode;
                    this.completedPomodoros = state.completedPomodoros;
                    this.currentSession = state.currentSession;

                    if (state.isRunning) {
                        this.timeLeft = Math.max(0, state.timeLeft - timeDiff);
                        if (this.timeLeft > 0) {
                            this.startTimer();
                        }
                    } else {
                        this.timeLeft = state.timeLeft;
                    }
                } else {
                    this.timeLeft = this.modes[this.currentMode] * 60;
                }
            } catch (e) {
                this.timeLeft = this.modes[this.currentMode] * 60;
            }
        }
        this.updateSessionInfo();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.pomodoroTimer = new PomodoroTimer();

    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});
