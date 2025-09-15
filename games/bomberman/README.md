# Bomberman Game

A fully functional clone of the classic Bomberman game built with HTML5, CSS3, and JavaScript. The game is responsive and works on both desktop and mobile devices.

## Features

### Core Game Mechanics
- **Player Movement**: Smooth character movement with collision detection
- **Bomb Placement**: Strategic bomb placement with timer and explosion mechanics
- **Chain Reactions**: Bombs can trigger other bombs for massive explosions
- **Destructible Environment**: Break blocks to clear paths and find power-ups
- **Enemy AI**: Intelligent enemies that move around the level
- **Power-ups**: Collect items to enhance your abilities

### Power-ups
- **💣 Extra Bomb**: Increase your bomb capacity
- **💥 Power**: Expand explosion range
- **👟 Speed**: Move faster around the level

### Game Features
- **Multi-level Progression**: Increasing difficulty with more enemies
- **Lives System**: Three lives to complete as many levels as possible
- **Score System**: Points for destroying enemies and collecting power-ups
- **Pause/Resume**: Pause the game at any time
- **Sound Effects**: Audio feedback for all game actions
- **Responsive Design**: Works on desktop, tablet, and mobile

## Controls

### Desktop (Keyboard)
- **Arrow Keys**: Move player
- **Spacebar**: Place bomb
- **Escape**: Pause/resume game

### Mobile/Tablet (Touch)
- **D-pad**: Touch controls for movement
- **💣 Button**: Place bomb
- **⏸ Button**: Pause game
- **🔊/🔇 Button**: Toggle sound

## Game Rules

1. **Objective**: Destroy all enemies on each level to advance
2. **Movement**: Navigate through the maze avoiding walls and enemies
3. **Bombs**: Place bombs to destroy blocks and enemies
4. **Safety**: Stay away from your own explosions!
5. **Power-ups**: Collect items that appear when blocks are destroyed
6. **Lives**: You have 3 lives - lose one each time you're caught in an explosion or touch an enemy

## Technical Details

### Files Structure
- `index.html` - Main game interface and layout
- `style.css` - Responsive styling and animations
- `game.js` - Complete game engine and logic
- `sounds.js` - Web Audio API sound system

### Technologies Used
- **HTML5 Canvas**: For game rendering
- **CSS3**: Responsive design with mobile-first approach
- **JavaScript ES6+**: Modern JavaScript features and classes
- **Web Audio API**: Procedural sound generation

### Browser Compatibility
- Modern browsers with HTML5 Canvas support
- Web Audio API for sound (optional, game works without sound)
- Touch events for mobile devices
- Responsive design for all screen sizes

## Game Architecture

### Core Classes
- `BombermanGame`: Main game controller
- `SoundManager`: Audio system management

### Key Systems
- **Game Loop**: 60 FPS animation loop using requestAnimationFrame
- **Collision Detection**: Pixel-perfect collision system
- **Input Handling**: Unified keyboard and touch input
- **State Management**: Game states (start, playing, paused, game over)
- **Responsive Canvas**: Dynamic canvas sizing for all devices

### Performance Features
- **Efficient Rendering**: Only draws visible game objects
- **Optimized Collision**: Uses grid-based collision detection
- **Memory Management**: Proper cleanup of audio contexts and animation frames

## Installation

1. Download all files to your web server or local directory
2. Open `index.html` in a modern web browser
3. Start playing!

No build process or dependencies required - it's pure vanilla JavaScript!

## Future Enhancements

- Multiple player support
- Additional power-up types
- Boss enemies
- Level editor
- High score system
- More visual effects

## License

This project is open source and available under the MIT License.