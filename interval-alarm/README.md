# Interval Alarm ⏰

A precise interval alarm application that beeps at configurable round-minute intervals.

## Features

- **Precise Timing**: Beeps only at exact round intervals (e.g., 11:00:00, 11:05:00, 11:10:00)
- **Configurable Intervals**: Set any interval from 1 to 60 minutes
- **Audio Alerts**: Triple beep sound pattern using Web Audio API with HTML5 audio fallback
- **Visual Feedback**: Status indicators and pulsing lights
- **Real-time Clock**: Shows current time and next alarm time
- **Alarm History**: Tracks when alarms were triggered
- **Responsive Design**: Works on desktop and mobile devices

## How It Works

The alarm calculates the next round interval based on your selected minutes:

- **5-minute intervals**: Alarms at 11:00:00, 11:05:00, 11:10:00, etc.
- **15-minute intervals**: Alarms at 11:00:00, 11:15:00, 11:30:00, etc.
- **30-minute intervals**: Alarms at 11:00:00, 11:30:00, 12:00:00, etc.

## Usage

1. Open `index.html` in your web browser
2. Set your desired interval in minutes (1-60)
3. Click "Start Alarm" to begin
4. The alarm will beep at precise round intervals
5. Click "Stop Alarm" when finished

## Files

- `index.html` - Main application page
- `style.css` - Styling and animations
- `script.js` - Alarm logic and audio functionality
- `README.md` - This documentation

## Browser Compatibility

- Modern browsers with Web Audio API support
- Falls back to HTML5 audio for older browsers
- Requires user interaction to enable audio (browser autoplay policy)

## Technical Details

The alarm uses precise timing calculations to ensure it only triggers at exact round intervals. It checks the time every second and triggers when the current time matches the calculated next alarm time (within 1-second tolerance).

The audio system uses Web Audio API to generate synthetic beep tones, with HTML5 audio as a fallback for maximum browser compatibility.