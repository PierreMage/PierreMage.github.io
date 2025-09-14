# Nokia Snake Game

A faithful recreation of the classic Nokia Snake game using HTML5, CSS3, and JavaScript.

## Features

- **Authentic Nokia Snake Experience**: Recreated with the classic monochrome green-on-black aesthetic
- **Progressive Speed**: Game gets faster as the snake grows, just like the original Nokia version
- **High Score System**: Persistent high score storage using localStorage
- **Game Boy-Style Audio**: Fun, multi-channel chiptune music and polished sound effects
- **Audio Controls**: Toggle background music and sound effects independently
- **Responsive Design**: Works on both desktop and mobile devices
- **Dual Control System**: Desktop keyboard controls and mobile touch/swipe controls
- **Cross-Platform**: Works seamlessly on desktop, mobile phones, and tablets

## How to Play

### Desktop Controls
1. Open `index.html` in your web browser
2. Press **Space** to start the game
3. Use **Arrow keys** or **WASD** to control the snake
4. Press **Space** during gameplay to pause/unpause

### Mobile/Tablet Controls
1. Open `index.html` in your mobile browser
2. **Tap the game board** or **swipe** to start the game
3. **Swipe up/down/left/right** to control the snake direction
4. **Tap** during gameplay to pause/unpause

### Game Rules
- Eat the yellow food to grow and score points
- Avoid hitting walls or the snake's own body
- Game gets faster as your snake grows longer

### Audio Features
- **Background Music**: Catchy Game Boy-style chiptune with melody and bass harmony
  - Multi-channel composition with vibrato effects
  - Seamless looping with musical phrases and bridge sections
  - Volume-balanced for pleasant listening during gameplay
- **Enhanced Sound Effects**: 
  - Power-up style start game arpeggio (C-E-G-C chord)
  - Two-tone food pickup sound (E5-A5 interval)
  - Rich game over sequence with harmonics
- **Audio Controls**: Use the ♪ Music and ♫ SFX buttons to toggle audio independently
- **Optimized Volumes**: SFX volume reduced for better music-to-effects balance
- **Persistent Settings**: Your audio preferences are saved automatically

## Game Specifications (Nokia Snake Authentic)

- **Grid**: 30x30 tiles for smooth gameplay
- **Scoring**: 10 points per food item (classic Nokia scoring)
- **Speed**: Progressive speed increase as snake grows
- **Controls**: Arrow keys with reverse direction blocking
- **High Score**: Automatically saved and persisted

## Files

- `index.html` - Main game HTML structure
- `style.css` - Nokia-style CSS with monochrome theme
- `script.js` - Complete game logic and functionality
- `README.md` - This file

## Browser Compatibility

Works in all modern browsers that support HTML5 Canvas and ES6 classes:
- Chrome 51+
- Firefox 45+
- Safari 10+
- Edge 79+

## Technical Implementation

The game is built using:
- **HTML5 Canvas** for rendering
- **Web Audio API** for Game Boy-style chiptune music and sound effects
- **ES6 Classes** for clean code organization
- **localStorage** for high score and audio preferences persistence
- **CSS3** for authentic Nokia styling
- **Vanilla JavaScript** (no dependencies)

Enjoy playing this nostalgic recreation of one of the most iconic mobile games ever made!