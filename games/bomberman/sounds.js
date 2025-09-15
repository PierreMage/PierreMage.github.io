class SoundManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.volume = 0.7;
        
        // Create audio context
        this.audioContext = null;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            console.error('Web Audio API is not supported in this browser');
        }
        
        // Initialize sounds
        this.loadSounds();
    }
    
    loadSounds() {
        // Use simple oscillator-based sounds for better compatibility
        this.createSound('explosion', (time) => {
            return this.createExplosionSound(time);
        });
        
        this.createSound('powerup', (time) => {
            return this.createPowerupSound(time);
        });
        
        this.createSound('placeBomb', (time) => {
            return this.createPlaceBombSound(time);
        });
        
        this.createSound('playerDie', (time) => {
            return this.createPlayerDieSound(time);
        });
        
        this.createSound('enemyDie', (time) => {
            return this.createEnemyDieSound(time);
        });
        
        this.createSound('levelComplete', (time) => {
            return this.createLevelCompleteSound(time);
        });
        
        this.createSound('gameStart', (time) => {
            return this.createGameStartSound(time);
        });
    }
    
    createSound(name, soundGenerator) {
        this.sounds[name] = soundGenerator;
    }
    
    play(name) {
        if (this.muted || !this.audioContext) return;
        
        const currentTime = this.audioContext.currentTime;
        const soundGenerator = this.sounds[name];
        
        if (soundGenerator) {
            soundGenerator(currentTime);
        }
    }
    
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
    
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }
    
    createOscillator(type, frequency, startTime, duration, gainValue = 1) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = gainValue * this.volume;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        oscillator.stop(startTime + duration);
        
        return { oscillator, gainNode };
    }
    
    // Sound generators for game events
    createExplosionSound(time) {
        // Low frequency noise burst
        const { gainNode } = this.createOscillator('sawtooth', 100, time, 0.8, 0.5);
        gainNode.gain.setValueAtTime(0.8 * this.volume, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.8);
        
        // High frequency noise to simulate debris
        for (let i = 0; i < 10; i++) {
            const freq = 200 + Math.random() * 600;
            const startTime = time + Math.random() * 0.2;
            this.createOscillator('square', freq, startTime, 0.1, 0.2);
        }
    }
    
    createPowerupSound(time) {
        // Ascending tones for powerup
        for (let i = 0; i < 3; i++) {
            const freq = 300 + (i * 200);
            this.createOscillator('sine', freq, time + (i * 0.1), 0.15, 0.3);
        }
    }
    
    createPlaceBombSound(time) {
        // Simple "click" sound
        this.createOscillator('sine', 220, time, 0.1, 0.2);
        this.createOscillator('sine', 440, time + 0.05, 0.1, 0.1);
    }
    
    createPlayerDieSound(time) {
        // Descending tones for player death
        for (let i = 0; i < 5; i++) {
            const freq = 400 - (i * 50);
            this.createOscillator('sawtooth', freq, time + (i * 0.1), 0.2, 0.3);
        }
    }
    
    createEnemyDieSound(time) {
        // Quick downward sweep
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, time);
        oscillator.frequency.exponentialRampToValueAtTime(80, time + 0.3);
        
        gainNode.gain.setValueAtTime(0.4 * this.volume, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(time);
        oscillator.stop(time + 0.3);
    }
    
    createLevelCompleteSound(time) {
        // Triumphant ascending notes
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        
        for (let i = 0; i < notes.length; i++) {
            this.createOscillator('sine', notes[i], time + (i * 0.15), 0.3, 0.3);
        }
    }
    
    createGameStartSound(time) {
        // Startup fanfare
        const notes = [392.00, 392.00, 523.25, 392.00, 659.25]; // G4, G4, C5, G4, E5
        const durations = [0.2, 0.2, 0.2, 0.2, 0.4];
        
        for (let i = 0; i < notes.length; i++) {
            const startTime = time + (i * durations[i]);
            this.createOscillator('sine', notes[i], startTime, durations[i], 0.3);
        }
    }
}

// Export as global
window.soundManager = new SoundManager();