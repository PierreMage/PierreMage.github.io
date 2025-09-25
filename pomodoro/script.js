class PomodoroTimer {
    constructor() {
        this.modes = { pomodoro: 25, shortBreak: 5, longBreak: 15 };
        this.currentMode = 'pomodoro';
        this.timeLeft = this.modes.pomodoro * 60;
        this.isRunning = false;
        this.intervalId = null;
        this.completedPomodoros = 0;
        this.currentSession = 1;
        this.audioContext = null; // Reusable AudioContext for background tab reliability

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
        this.startPauseBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        this.skipBtn.addEventListener('click', () => this.skipTimer());

        this.modeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });

        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

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

        window.addEventListener('beforeunload', () => this.saveState());
        setInterval(() => this.saveState(), 1000);
    }
    
    toggleTimer() {
        this.isRunning ? this.pauseTimer() : this.startTimer();
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
        clearInterval(this.intervalId);
        this.intervalId = null;
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
    
    async completeTimer() {
        this.pauseTimer();
        await this.playNotification();
        this.timeDisplay.classList.add('timer-complete');

        setTimeout(() => this.timeDisplay.classList.remove('timer-complete'), 1500);

        if (this.currentMode === 'pomodoro') {
            this.completedPomodoros++;
            this.currentSession++;
        }

        this.autoProgressMode();
        this.updateProgressDots();
        this.updateSessionInfo();
    }

    autoProgressMode() {
        if (this.currentMode === 'pomodoro') {
            const nextMode = this.completedPomodoros % 4 === 0 ? 'longBreak' : 'shortBreak';
            this.switchMode(nextMode);
        } else {
            this.switchMode('pomodoro');
        }
    }

    switchMode(mode) {
        if (!this.modes[mode]) return;

        this.pauseTimer();
        this.currentMode = mode;
        this.timeLeft = this.modes[mode] * 60;
        this.updateDisplay();
        this.updateTheme();
        this.updateModeTab();
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        this.timeDisplay.textContent = timeString;

        // Get active task name for title
        const taskName = this.getActiveTaskName();
        const titleSuffix = taskName ? taskName : 'Pomodoro Timer';
        document.title = `${timeString} - ${titleSuffix}`;
    }

    getActiveTaskName() {
        // Access the global taskManager if it exists
        if (typeof taskManager !== 'undefined' && taskManager && taskManager.activeTaskId) {
            const activeTask = taskManager.tasks.find(t => t.id === taskManager.activeTaskId);
            if (activeTask) {
                return activeTask.name;
            }
        }
        return null;
    }

    updateTheme() {
        document.body.className = this.currentMode;
    }

    updateModeTab() {
        this.modeTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === this.currentMode);
        });
    }

    updateProgressDots() {
        this.progressDots.forEach((dot, index) => {
            dot.classList.remove('active', 'completed');

            const cyclePosition = this.completedPomodoros % 4;
            if (index < cyclePosition) {
                dot.classList.add('completed');
            } else if (index === cyclePosition && this.currentMode === 'pomodoro') {
                dot.classList.add('active');
            }
        });
    }

    updateSessionInfo() {
        const currentInCycle = (this.completedPomodoros % 4) + 1;
        this.sessionCount.textContent = `Session ${currentInCycle} of 4`;
    }

    async playNotification() {
        await this.playBeep();

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pomodoro Timer', {
                body: this.currentMode === 'pomodoro' ? 'Time for a break!' : 'Time to focus!'
            });
        }
    }

    async playBeep() {
        // Ensure we have a working audio context
        if (!this.audioContext) {
            try {
                // @ts-ignore - webkitAudioContext for Safari compatibility
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

            } catch (e) {
                console.warn('Failed to resume AudioContext:', e);
            }
        }

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.5);


        } catch (e) {
            // Audio failed, fail silently
            console.warn('Pomodoro audio failed:', e);
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
        const saved = localStorage.getItem('pomodoroState');
        if (!saved) {
            this.updateSessionInfo();
            return;
        }

        try {
            const state = JSON.parse(saved);
            const timeDiff = Math.floor((Date.now() - state.timestamp) / 1000);

            // Only restore state if less than 1 hour old
            if (timeDiff < 3600) {
                this.currentMode = state.currentMode;
                this.completedPomodoros = state.completedPomodoros;
                this.currentSession = state.currentSession;

                if (state.isRunning) {
                    this.timeLeft = Math.max(0, state.timeLeft - timeDiff);
                    if (this.timeLeft > 0) this.startTimer();
                } else {
                    this.timeLeft = state.timeLeft;
                }
            } else {
                this.timeLeft = this.modes[this.currentMode] * 60;
            }
        } catch (e) {
            this.timeLeft = this.modes[this.currentMode] * 60;
        }

        this.updateSessionInfo();
    }
}

class TaskManager {
    constructor(pomodoroTimer) {
        this.pomodoroTimer = pomodoroTimer;
        this.tasks = [];
        this.activeTaskId = null;

        // Get DOM elements
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        this.activeTaskDisplay = document.getElementById('activeTaskDisplay');
        this.clearTasksBtn = document.getElementById('clearTasksBtn');

        this.bindEvents();
        this.loadTaskData();
        this.updateDisplay();
    }
    
    bindEvents() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        this.clearTasksBtn.addEventListener('click', () => this.clearAllTasks());
    }
    
    addTask() {
        const taskText = this.taskInput.value.trim();
        if (!taskText) return;

        const newTask = {
            id: Date.now().toString(),
            name: taskText,
            completed: false,
            pomodorosCompleted: 0
        };

        this.tasks.unshift(newTask);  // Add to beginning instead of end
        this.taskInput.value = '';
        this.updateDisplay();
        this.saveTaskData();
    }

    selectTask(taskId) {
        this.activeTaskId = taskId;
        this.updateDisplay();
        this.saveTaskData();
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;

        // If this was the active task and now completed, clear it
        if (task.completed && this.activeTaskId === taskId) {
            this.activeTaskId = null;
        }

        this.updateDisplay();
        this.saveTaskData();
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);

        if (this.activeTaskId === taskId) {
            this.activeTaskId = null;
        }

        this.updateDisplay();
        this.saveTaskData();
    }

    clearAllTasks() {
        if (this.tasks.length === 0) return;

        if (confirm('Are you sure you want to clear all tasks? This cannot be undone.')) {
            this.tasks = [];
            this.activeTaskId = null;
            this.updateDisplay();
            this.saveTaskData();
        }
    }
    


    onPomodoroComplete() {
        if (this.activeTaskId) {
            const activeTask = this.tasks.find(t => t.id === this.activeTaskId);
            if (activeTask) {
                activeTask.pomodorosCompleted++;
                this.updateDisplay();
                this.saveTaskData();
            }
        }
    }


    
    updateDisplay() {
        this.updateActiveTaskDisplay();
        this.updateTaskList();
    }

    updateActiveTaskDisplay() {
        const activeTask = this.tasks.find(t => t.id === this.activeTaskId);
        const activeTaskLabel = this.activeTaskDisplay.querySelector('.active-task-label');

        if (activeTask) {
            // Show the next pomodoro number (completed + 1)
            const nextPomodoroNumber = activeTask.pomodorosCompleted + 1;
            activeTaskLabel.textContent = `#${nextPomodoroNumber} ${activeTask.name}`;
        } else {
            activeTaskLabel.textContent = 'No active task';
        }
    }

    updateTaskList() {
        if (this.tasks.length === 0) {
            this.taskList.innerHTML = '<div class="no-tasks">Tasks will appear here</div>';
            return;
        }

        this.taskList.innerHTML = this.tasks.map(task => {
            const isActive = this.activeTaskId === task.id;
            const isCompleted = task.completed;

            return `
                <div class="task-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}"
                     onclick="taskManager.selectTask('${task.id}')">
                    <div class="task-checkbox ${isCompleted ? 'checked' : ''}"
                         onclick="event.stopPropagation(); taskManager.toggleTaskComplete('${task.id}')">
                    </div>
                    <div class="task-content">
                        <div class="task-name">${this.escapeHtml(task.name)}</div>
                        <div class="task-stats">
                            🍅 ${task.pomodorosCompleted}
                            ${isActive ? '• Active' : ''}
                            ${isCompleted ? '• Completed' : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn delete"
                                onclick="event.stopPropagation(); taskManager.deleteTask('${task.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTaskData() {
        const data = {
            tasks: this.tasks,
            activeTaskId: this.activeTaskId
        };
        localStorage.setItem('pomodoroTaskData', JSON.stringify(data));
    }

    loadTaskData() {
        try {
            const data = localStorage.getItem('pomodoroTaskData');
            if (data) {
                const parsed = JSON.parse(data);
                this.tasks = parsed.tasks || [];
                this.activeTaskId = parsed.activeTaskId || null;
            }
        } catch (error) {
            console.error('Error loading task data:', error);
            this.tasks = [];
            this.activeTaskId = null;
        }
    }
}

// Global variable for task manager
let taskManager;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const timer = new PomodoroTimer();
    taskManager = new TaskManager(timer);

    // Connect task manager to pomodoro completion
    const originalCompleteTimer = timer.completeTimer.bind(timer);
    timer.completeTimer = async function() {
        await originalCompleteTimer();
        if (this.currentMode === 'pomodoro') {
            taskManager.onPomodoroComplete();
        }
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});
