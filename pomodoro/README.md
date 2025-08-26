# Pomodoro Timer

A clean, minimal Pomodoro timer web application inspired by pomofocus.io. Built with vanilla HTML, CSS, and JavaScript.

## Features

### Core Functionality
- **Timer Display**: Shows time in MM:SS format with large, clear typography
- **Three Timer Modes**:
  - Pomodoro: 25 minutes (work session)
  - Short Break: 5 minutes
  - Long Break: 15 minutes
- **Control Buttons**:
  - Start/Pause: Toggle timer (Space key)
  - Reset: Restart current timer (R key)
  - Skip: Move to next session (S key)

### Advanced Features
- **Automatic Progression**: After completing a Pomodoro, automatically switches to Short Break. After 4 Pomodoros, switches to Long Break
- **Visual Themes**: Different background colors for each mode
- **Progress Tracking**: Visual dots showing current session (1-4)
- **State Persistence**: Timer continues running even after page refresh using localStorage
- **Audio Notifications**: Plays sound when timer completes
- **Browser Notifications**: Shows desktop notification (with permission)
- **Keyboard Shortcuts**: Space (start/pause), R (reset), S (skip)
- **Responsive Design**: Works on desktop and mobile devices

## Usage

### Getting Started
1. Open `index.html` in your web browser
2. Click "START" to begin your first Pomodoro session
3. The timer will count down from 25:00
4. When complete, it will automatically switch to a 5-minute break

### Controls
- **Mode Tabs**: Click to manually switch between Pomodoro, Short Break, and Long Break
- **START/PAUSE**: Begin or pause the current timer
- **RESET**: Reset the current timer to its initial value
- **SKIP**: Complete the current session and move to the next

### Keyboard Shortcuts
- `Space`: Start/Pause timer
- `R`: Reset timer
- `S`: Skip to next session

## Technical Implementation

### Architecture
- **HTML**: Semantic structure with accessibility in mind
- **CSS**: Modern styling with CSS Grid/Flexbox, responsive design, and smooth transitions
- **JavaScript**: ES6 class-based architecture with proper state management

### Key Components
- `PomodoroTimer` class: Main application logic
- State persistence using localStorage
- Web Audio API for sound notifications
- Notification API for desktop alerts

### Browser Compatibility
- Modern browsers supporting ES6 classes
- Web Audio API (for sound notifications)
- Notification API (for desktop notifications)
- localStorage (for state persistence)

## File Structure
```
pomodoro/
├── index.html          # Main application page
├── style.css           # Styling and themes
├── script.js           # Application logic
├── test.html           # Test suite and manual testing
└── README.md           # This documentation
```

## Testing

### Automated Testing
Open `test.html` to run the automated test suite and view the application in an embedded frame.

### Manual Testing Checklist
- [ ] Timer displays 25:00 initially
- [ ] Start button changes to Pause when clicked
- [ ] Timer counts down every second
- [ ] Reset button resets timer to initial value
- [ ] Mode tabs switch between different timer modes
- [ ] Background color changes with mode
- [ ] Progress dots show current session
- [ ] Skip button advances to next mode
- [ ] Keyboard shortcuts work (Space, R, S)
- [ ] Responsive design works on mobile
- [ ] State persists after page refresh
- [ ] Audio notification plays on completion

## Customization

### Timer Durations
Edit the `modes` object in `script.js`:
```javascript
this.modes = {
    pomodoro: 25,      // minutes
    shortBreak: 5,     // minutes
    longBreak: 15      // minutes
};
```

### Colors and Themes
Modify the CSS custom properties in `style.css`:
```css
body.pomodoro {
    background: linear-gradient(135deg, #ba4949 0%, #d66767 100%);
}
```

### Audio Notifications
The application uses Web Audio API to generate simple beep sounds. You can replace the `playNotification()` method to use custom audio files.

## Browser Support
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## License
This project is open source and available under the MIT License.
