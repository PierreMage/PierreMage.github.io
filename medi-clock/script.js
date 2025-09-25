class MedicationCalculator {
    constructor() {
        this.form = document.getElementById('medication-form');
        this.resultsSection = document.getElementById('results-section');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Real-time calculation on input changes
        const dosingIntervalInput = document.getElementById('dosing-interval');
        const startTimeInput = document.getElementById('start-time');

        // Add event listeners for real-time updates
        dosingIntervalInput.addEventListener('input', () => this.handleInputChange());
        dosingIntervalInput.addEventListener('change', () => this.handleInputChange());
        startTimeInput.addEventListener('input', () => this.handleInputChange());
        startTimeInput.addEventListener('change', () => this.handleInputChange());

        // Initial calculation if values are present
        this.handleInputChange();
    }

    handleInputChange() {
        // Clear any existing error messages
        this.clearErrorMessage();

        const formData = new FormData(this.form);
        const dosingInterval = parseFloat(formData.get('dosing-interval'));
        const startTime = formData.get('start-time');


        // Only calculate if we have valid basic inputs
        if (dosingInterval && startTime) {
            if (this.validateInputs(dosingInterval, startTime)) {
                const schedule = this.calculateSchedule(dosingInterval, startTime);
                this.displayResults(schedule, dosingInterval);
            }
        } else {
            // Hide results if inputs are incomplete
            this.resultsSection.classList.add('hidden');
        }
    }

    validateInputs(dosingInterval, startTime) {
        const errors = [];

        if (!dosingInterval || dosingInterval < 0.5 || dosingInterval > 24) {
            errors.push('Dosing interval must be between 0.5 and 24 hours');
        }

        if (!startTime) {
            errors.push('Please select a start time');
        }

        if (errors.length > 0) {
            this.showError(errors.join('\n'));
            return false;
        }

        return true;
    }

    calculateSchedule(intervalHours, startTime) {
        const schedule = [];
        const startDateTime = this.parseTime(startTime);
        const intervalMinutes = intervalHours * 60;
        const hoursIn24 = 24;
        const minutesIn24Hours = hoursIn24 * 60;

        // Calculate how many doses fit in 24 hours
        const maxDoses = Math.floor(minutesIn24Hours / intervalMinutes);

        // Handle edge case where interval doesn't divide evenly into 24 hours
        const actualCycleDuration = maxDoses * intervalMinutes;
        const timeGap = minutesIn24Hours - actualCycleDuration;

        for (let i = 0; i < maxDoses; i++) {
            const doseTime = new Date(startDateTime);
            doseTime.setMinutes(doseTime.getMinutes() + (i * intervalMinutes));

            // Handle midnight crossover
            const displayTime = this.handleMidnightCrossover(doseTime);

            schedule.push({
                doseNumber: i + 1,
                time: doseTime,
                displayTime: displayTime,
                formattedTime: this.formatTime(displayTime),
                dayOffset: this.getDayOffset(doseTime, startDateTime)
            });
        }

        return {
            doses: schedule,
            intervalHours: intervalHours,
            dosesPerDay: maxDoses,
            timeGap: timeGap > 0 ? Math.round(timeGap) : 0,
            perfectDivision: timeGap === 0
        };
    }

    handleMidnightCrossover(dateTime) {
        // Return the time as-is for proper day offset calculation
        return new Date(dateTime);
    }

    getDayOffset(doseTime, startTime) {
        const startDay = startTime.getDate();
        const doseDay = doseTime.getDate();
        return doseDay - startDay;
    }

    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    displayResults(schedule, intervalHours) {
        // Update schedule info
        document.getElementById('interval-display').textContent =
            intervalHours === 1 ? '1 hour' : `${intervalHours} hours`;
        document.getElementById('doses-count').textContent = schedule.dosesPerDay;

        // Generate schedule list
        const scheduleList = document.getElementById('schedule-list');
        scheduleList.innerHTML = '';

        // Add warning for imperfect divisions
        if (!schedule.perfectDivision && schedule.timeGap > 0) {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'schedule-warning';
            warningDiv.style.cssText = `
                background: #2d3748;
                color: #fbb6ce;
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                border: 1px solid #ed8936;
                font-size: 0.875rem;
            `;
            warningDiv.innerHTML = `
                <strong>⚠️ Note:</strong> Your dosing interval doesn't divide evenly into 24 hours.
                There will be a ${schedule.timeGap}-minute gap before the cycle repeats the next day.
            `;
            scheduleList.appendChild(warningDiv);
        }

        schedule.doses.forEach(dose => {
            const doseElement = this.createDoseElement(dose);
            scheduleList.appendChild(doseElement);
        });

        // Show results section
        this.resultsSection.classList.remove('hidden');
    }

    createDoseElement(dose) {
        const doseDiv = document.createElement('div');
        doseDiv.className = 'dose-item';

        // Add day indicator for doses that cross midnight
        const dayIndicator = dose.dayOffset > 0 ? ' <span class="day-indicator">(Next Day)</span>' : '';

        doseDiv.innerHTML = `
            <span class="dose-number">Dose ${dose.doseNumber}</span>
            <span class="dose-time">${dose.formattedTime}${dayIndicator}</span>
        `;

        return doseDiv;
    }

    clearErrorMessage() {
        const errorDiv = document.querySelector('.error-message');
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }

    showError(message) {
        // Clear any existing error first
        this.clearErrorMessage();

        // Create new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #2d3748;
            color: #fc8181;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            border: 1px solid #e53e3e;
        `;
        errorDiv.textContent = message;
        this.form.insertBefore(errorDiv, this.form.firstChild);

        // Remove error after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MedicationCalculator();
});
