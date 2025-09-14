# Tetris Game

A fully functional Tetris game built with HTML5, CSS3, and JavaScript. Features mobile touch support and 8-bit style audio.

## Features

- **Classic Tetris gameplay** with all 7 tetromino shapes (I, O, T, S, Z, J, L)
- **Mobile-friendly** with touch controls and responsive design
- **8-bit style audio** with background music and sound effects
- **Progressive difficulty** - speed increases with level
- **Intuitive touch gestures** for mobile/tablet devices:
  - Single tap or swipe up to rotate pieces
  - Double-tap to pause/unpause
  - Swipe left/right to move pieces
  - Swipe down for hard drop
- **Clean gesture-only interface** - no on-screen buttons
- **Audio controls** to toggle music and sound effects separately
- **Pause functionality**
- **Score tracking** with traditional Tetris scoring system

## How to Play

### Desktop Controls
- **Arrow Keys**: Move and rotate pieces
  - ← → : Move left/right
  - ↓ : Soft drop
  - ↑ : Rotate piece
- **Spacebar**: Hard drop or pause game

### Tablet Controls
- **Pure gesture interface** - no on-screen buttons
- **Touch gestures**:
  - Single tap: Rotate piece (with 300ms delay)
  - Double-tap: Pause/unpause game
  - Swipe up: Rotate piece (instant)
  - Swipe left/right: Move pieces horizontally
  - Swipe down: Hard drop
- **Clean, distraction-free gameplay**

### Mobile Controls
- **Pure gesture interface** - no on-screen buttons
- **Touch gestures**:
  - Single tap: Rotate piece (with 300ms delay)
  - Double-tap: Pause/unpause game  
  - Swipe up: Rotate piece (instant)
  - Swipe left/right: Move pieces horizontally
  - Swipe down: Hard drop
- **Intuitive swipe-based controls**

### Scoring
- **Lines cleared**:
  - Single: 100 × level
  - Double: 300 × level  
  - Triple: 500 × level
  - Tetris (4 lines): 800 × level
- **Soft drop**: 1 point per cell
- **Hard drop**: 2 points per cell

### Level Progression
- Level increases every 10 lines cleared
- Speed increases with each level
- Maximum speed reached at higher levels

## Technical Features

- **Responsive design** that works on desktop, tablet, and mobile
- **Canvas-based rendering** for smooth graphics
- **Web Audio API** for dynamic 8-bit style sound generation
- **Touch event handling** for mobile gestures
- **Local high score tracking**
- **Optimized for mobile performance**

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6 Classes
- Web Audio API (for sound)
- Touch Events (for mobile)

## Files

- `index.html` - Main game page
- `styles.css` - Responsive styling and animations
- `tetris.js` - Complete game logic and controls
- `README.md` - This documentation

## Getting Started

Simply open `index.html` in your web browser to start playing!

For mobile devices, add to your home screen for a full-screen app-like experience.