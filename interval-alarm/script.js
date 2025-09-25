class IntervalAlarm {
    constructor() {
        this.isActive = false;
        this.intervalMinutes = 5;
        this.audioContext = null;
        this.nextAlarmTime = null;
        this.secondsUntilAlarm = 0; // Countdown approach like Pomodoro
        this.historyData = []; // Store history data for persistence

        this.initializeElements();
        this.bindEvents();
        this.loadState();
        this.loadHistoryData();
        this.updateClock();
        
        // Update clock every second
        setInterval(() => this.updateClock(), 1000);
        
        // Auto-save state every 10 seconds when active
        setInterval(() => {
            if (this.isActive) {
                this.saveState();
            }
        }, 10000);
    }
    
    initializeElements() {
        this.minutesInput = document.getElementById('minutes');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.nextAlarmDisplay = document.getElementById('nextAlarm');
        this.statusLight = document.getElementById('statusLight');
        this.statusText = document.getElementById('statusText');
        this.alarmHistory = document.getElementById('alarmHistory');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startAlarm());
        this.stopBtn.addEventListener('click', () => this.stopAlarm());
        this.minutesInput.addEventListener('change', () => this.updateInterval());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }
    
    updateClock() {
        const now = new Date();
        this.currentTimeDisplay.textContent = this.formatTime(now);

        if (this.isActive && this.nextAlarmTime) {
            this.nextAlarmDisplay.textContent = this.formatTime(this.nextAlarmTime);

            // Calculate actual remaining time (prevents drift)
            const remainingMs = this.nextAlarmTime.getTime() - now.getTime();
            this.secondsUntilAlarm = Math.max(0, Math.ceil(remainingMs / 1000));

            // Update document title with countdown
            this.updateTitle();

            // Check if alarm should trigger
            if (this.secondsUntilAlarm <= 0) {
                this.triggerAlarm();
                this.calculateNextAlarmTime();
            }
        } else {
            // Reset title when not active
            document.title = 'Interval Alarm';
        }
    }

    updateTitle() {
        if (this.isActive && this.secondsUntilAlarm > 0) {
            const minutes = Math.floor(this.secondsUntilAlarm / 60);
            const seconds = this.secondsUntilAlarm % 60;
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            document.title = `${timeString} - Interval Alarm`;
        } else if (this.isActive) {
            document.title = 'Alarm Ready - Interval Alarm';
        } else {
            document.title = 'Interval Alarm';
        }
    }
    
    formatTime(date) {
        return date.toTimeString().split(' ')[0]; // HH:MM:SS format
    }
    
    updateInterval() {
        this.intervalMinutes = parseInt(this.minutesInput.value) || 5;
        if (this.isActive) {
            this.calculateNextAlarmTime();
        }
    }
    
    calculateNextAlarmTime() {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        // Find the next round interval
        const intervalInMinutes = this.intervalMinutes;
        const nextIntervalMinutes = Math.ceil((currentMinutes + 1) / intervalInMinutes) * intervalInMinutes;
        
        // Create the next alarm time
        this.nextAlarmTime = new Date();
        this.nextAlarmTime.setHours(Math.floor(nextIntervalMinutes / 60));
        this.nextAlarmTime.setMinutes(nextIntervalMinutes % 60);
        this.nextAlarmTime.setSeconds(0);
        this.nextAlarmTime.setMilliseconds(0);
        
        // If the calculated time is for the next day, adjust accordingly
        if (nextIntervalMinutes >= 24 * 60) {
            this.nextAlarmTime.setDate(this.nextAlarmTime.getDate() + 1);
            this.nextAlarmTime.setHours(0);
            this.nextAlarmTime.setMinutes(0);
        }
        
        // Calculate seconds until alarm (countdown approach like Pomodoro)
        this.secondsUntilAlarm = Math.max(0, Math.ceil((this.nextAlarmTime.getTime() - now.getTime()) / 1000));
    }
    
    async startAlarm() {
        if (this.isActive) return;

        this.isActive = true;
        this.intervalMinutes = parseInt(this.minutesInput.value) || 5;
        
        this.calculateNextAlarmTime();
        
        // Update UI
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.minutesInput.disabled = true;
        this.statusLight.classList.add('active');
        this.statusText.textContent = `Alarm Active (${this.intervalMinutes}min intervals)`;

        // Update title immediately
        this.updateTitle();

        this.addToHistory(`Alarm started - ${this.intervalMinutes} minute intervals`);
        
        // Test audio immediately to ensure it works
        console.log('Testing audio on start...');
        await this.testAudio();
        
        // Save state
        this.saveState();
    }

    async testAudio() {
        console.log('Testing audio system...');
        await this.playBeep(true); // Test mode
    }
    
    stopAlarm() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.nextAlarmTime = null;
        
        // Update UI
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.minutesInput.disabled = false;
        this.statusLight.classList.remove('active', 'beeping');
        this.statusText.textContent = 'Alarm Off';
        this.nextAlarmDisplay.textContent = '--:--:--';

        // Reset title
        this.updateTitle();

        this.addToHistory('Alarm stopped');
        this.saveState();
    }
    
    
    async triggerAlarm() {
        const now = new Date();

        // Visual feedback
        this.statusLight.classList.add('beeping');
        setTimeout(() => {
            this.statusLight.classList.remove('beeping');
        }, 2000);

        // Play beep sound
        await this.playBeep();

        // Add to history
        this.addToHistory(`⏰ ALARM: ${this.formatTime(now)}`);

        console.log(`ALARM! Time: ${this.formatTime(now)}`);
    }
    
    async playBeep(isTest = false) {
        // Ensure we have a working audio context
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Failed to create AudioContext:', e);
                return;
            }
        }

        // Resume audio context if suspended (important for background tabs)
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('AudioContext resumed for alarm');
            } catch (e) {
                console.warn('Failed to resume AudioContext:', e);
            }
        }

        try {
            // Create 3 separate beeps (each needs its own oscillator)
            for (let i = 0; i < 3; i++) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                const startTime = this.audioContext.currentTime + (i * 0.3);
                const duration = 0.2;

                oscillator.frequency.setValueAtTime(800, startTime);
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
                gainNode.gain.setValueAtTime(0.3, startTime + duration - 0.01);
                gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            }

            console.log('Alarm beep played successfully');
        } catch (e) {
            // Audio failed, fail silently like Pomodoro
            console.warn('Audio failed:', e);
        }

        // Always show browser notification (like Pomodoro does)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ ALARM!', {
                body: `Alarm at ${this.formatTime(new Date())}`,
                requireInteraction: true,
                icon: '⏰'
            });
        } else if ('Notification' in window && Notification.permission === 'default') {
            // Request permission if not yet requested
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('⏰ ALARM!', {
                        body: `Alarm at ${this.formatTime(new Date())}`,
                        requireInteraction: true,
                        icon: '⏰'
                    });
                }
            });
        }
    }
    
    
    saveState() {
        const state = {
            isActive: this.isActive,
            intervalMinutes: this.intervalMinutes,
            nextAlarmTime: this.nextAlarmTime?.getTime(), // Store as timestamp
            secondsUntilAlarm: this.secondsUntilAlarm,
            timestamp: Date.now()
        };
        localStorage.setItem('alarmState', JSON.stringify(state));
    }
    
    loadState() {
        const savedState = localStorage.getItem('alarmState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                const timeDiff = Math.floor((Date.now() - state.timestamp) / 1000);
                
                // Only restore state if it's recent (within 1 hour)
                if (timeDiff < 3600) {
                    this.intervalMinutes = state.intervalMinutes || 15;
                    this.minutesInput.value = this.intervalMinutes;
                    
                    if (state.isActive && state.nextAlarmTime) {
                        // Check if the saved next alarm time is still in the future
                        const savedNextAlarm = new Date(state.nextAlarmTime);
                        const now = new Date();
                        
                        if (savedNextAlarm > now) {
                            // Resume the alarm with countdown approach
                            this.nextAlarmTime = savedNextAlarm;
                            this.isActive = true;
                            
                            // No need to adjust countdown - updateClock() will calculate it from nextAlarmTime
                            
                            // Update UI to active state
                            this.startBtn.disabled = true;
                            this.stopBtn.disabled = false;
                            this.minutesInput.disabled = true;
                            this.statusLight.classList.add('active');
                            this.statusText.textContent = `Alarm Active (${this.intervalMinutes}min intervals)`;
                            
                            console.log('Alarm state restored - next alarm at:', this.formatTime(this.nextAlarmTime), `(${this.secondsUntilAlarm}s)`);
                        }
                    }
                }
            } catch (e) {
                console.warn('Failed to load alarm state:', e);
            }
        }
    }
    
    addToHistory(message) {
        const now = new Date();
        const timestamp = this.formatTime(now);

        // Add to data structure first (this works even in background tabs)
        const historyEntry = {
            timestamp: now.getTime(),
            message: message,
            formattedTime: timestamp
        };

        this.historyData.unshift(historyEntry);

        // Limit history to 10 items
        if (this.historyData.length > 10) {
            this.historyData = this.historyData.slice(0, 10);
        }

        // Save to localStorage immediately (works in background tabs)
        this.saveHistoryData();

        // Update DOM (may be throttled in background tabs, but will be restored on visibility)
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        if (!this.alarmHistory) return; // Safety check

        // Clear existing history
        this.alarmHistory.innerHTML = '';

        if (this.historyData.length === 0) {
            const noHistory = document.createElement('p');
            noHistory.className = 'no-history';
            noHistory.textContent = 'No alarms yet';
            this.alarmHistory.appendChild(noHistory);
            return;
        }

        // Add all history items from data
        this.historyData.forEach(entry => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.textContent = `${entry.formattedTime} - ${entry.message}`;
            this.alarmHistory.appendChild(historyItem);
        });
    }

    saveHistoryData() {
        try {
            localStorage.setItem('alarmHistory', JSON.stringify(this.historyData));
        } catch (e) {
            console.warn('Failed to save alarm history:', e);
        }
    }

    loadHistoryData() {
        try {
            const saved = localStorage.getItem('alarmHistory');
            if (saved) {
                this.historyData = JSON.parse(saved);
                this.updateHistoryDisplay();
            }
        } catch (e) {
            console.warn('Failed to load alarm history:', e);
            this.historyData = [];
        }
    }

    clearHistory() {
        // Confirm with user before clearing
        if (this.historyData.length === 0) {
            return; // Nothing to clear
        }

        if (confirm('Are you sure you want to clear all alarm history?')) {
            this.historyData = [];
            this.saveHistoryData();
            this.updateHistoryDisplay();
            console.log('Alarm history cleared');
        }
    }

    handleVisibilityChange() {
        // Always refresh history display when tab becomes visible (even if not active)
        this.updateHistoryDisplay();

        // Force an immediate clock update to recalculate timing
        // (updateClock now handles all timing calculations automatically)
        this.updateClock();

        console.log('Visibility change: Clock updated, timing recalculated');
    }
}

// Initialize the alarm when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.alarmInstance = new IntervalAlarm();

    // Request notification permission for background tab functionality
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});

// Save state before page unload
window.addEventListener('beforeunload', () => {
    if (window.alarmInstance) {
        window.alarmInstance.saveState();
    }
});

// Handle visibility changes to maintain accurate timing
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.alarmInstance) {
        // Page became visible again, recalculate timing
        console.log('Page visible again - recalculating alarm timing');
        window.alarmInstance.handleVisibilityChange();
    }
});

// Handle window focus/blur for additional background tab support
window.addEventListener('focus', () => {
    if (window.alarmInstance) {
        console.log('Window focused - checking alarm state');
        window.alarmInstance.handleVisibilityChange();
    }
});

window.addEventListener('blur', () => {
    if (window.alarmInstance) {
        console.log('Window blurred - saving state');
        window.alarmInstance.saveState();
    }
});
