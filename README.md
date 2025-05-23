# Neon Lunar Lander - Codebase Summary

## Game Overview

**Neon Lunar Lander** is a retro-styled lunar lander game with a neon aesthetic. The objective is to visit as many landing pads as possible before crashing, with fuel being replenished each time a new pad is visited.

### Game Features
- **Infinite horizontally scrolling world** with procedurally generated terrain
- **Numbered landing pads** that refuel the lander when visited
- **Upgradeable landing legs** pickup that makes landing more forgiving
- **Particle effects** for explosions, thrust, and celebrations
- **Neon visual theme** with glowing effects and retro colors
- **Complete audio system** with music, sound effects, and ambient sounds
- **Camera system** that follows the player smoothly
- **Forcefield barrier** at x=0 preventing backward movement

## Core Game Mechanics

### Landing System
- Landing requires low velocity and proper angle alignment
- **Normal legs**: Max velocity 1.5 vertical, 1.0 horizontal, angle tolerance 0.5 radians
- **Upgraded legs**: Max velocity 3.0 vertical, 2.5 horizontal, angle tolerance 1.2 radians
- Landing on pads refuels the lander (decreasing by 2% per unique pad visited)
- Double-tap thrust (↑) while landed to launch from pad with brief invulnerability

### Physics
- **Lunar gravity**: 0.02 units/frame² (much lighter than Earth)
- **Thrust**: 0.08 units when firing engines
- **Fuel consumption**: 0.2% per frame while thrusting
- **Rotation**: 0.02 radians per frame with left/right keys

## File Structure & Architecture

### HTML (`index.html`)
- Canvas-based game with overlay UI elements
- Audio elements for all sound effects
- Start screen, game over screen, and victory screen
- Modular JavaScript architecture with separate concerns

### CSS (`styles.css`)
- **Neon theme**: Dark space background with glowing cyan (#00ffff) elements
- **Typography**: Courier New monospace font for retro feel
- **UI styling**: Semi-transparent overlays with neon borders and shadows

### JavaScript Modules

#### `js/gameState.js` (83 lines)
**Core game data and constants**
- Global game state object containing lander properties, terrain, pads, particles
- Constants: `CHUNK_WIDTH` (1200px), `PAD_SPACING` (600px), `PAD_WIDTH` (80px)
- Canvas setup and resize handling
- Particle creation and update utilities

#### `js/terrain.js` (187 lines)  
**World generation system**
- **Chunk-based terrain generation**: Generates 1200px wide chunks on-demand
- **Catmull-Rom spline interpolation** for smooth terrain curves
- **Landing pad placement**: One pad per chunk at center, terrain flattened around pads
- **Pickup spawning**: 40% chance per chunk for upgradeable legs pickup
- **Forcefield at x=0**: Vertical barrier preventing leftward movement
- **Dynamic generation**: Creates chunks 2 ahead of player position

#### `js/physics.js` (281 lines)
**Game physics and collision detection**
- **Landing detection**: Checks pad collision with velocity/angle tolerances
- **Terrain collision**: Uses interpolated height checking
- **Pickup collision**: Bounding box detection for upgradeable legs
- **Explosion system**: Multi-stage particle explosions with 350+ particles
- **Launch mechanics**: Random velocity vector with invulnerability period
- **Crash handling**: Dramatic visual effects with multiple shockwaves

#### `js/renderer.js` (329 lines)
**Complete visual rendering system**
- **Space background**: Gradient with twinkling stars
- **Terrain rendering**: Neon cyan outline with gradient fill
- **Landing pads**: Yellow (unvisited) or green (visited) with numbers
- **Lander**: Pink/magenta spacecraft with normal or upgraded orange legs  
- **Pickups**: Animated gear icon for upgraded legs with bobbing motion
- **Particles**: Alpha-faded colored squares with size variation
- **Thrust effects**: Animated flame gradient with particle trails
- **Camera system**: Smooth following at 40% screen width offset

#### `js/input.js` (90 lines)
**Input handling system**
- **Key mapping**: Arrow keys for thrust/rotation, space for restart
- **Double-tap detection**: Launch mechanism with 300ms timing window
- **Audio integration**: Triggers rocket/hiss sounds based on input state
- **State management**: Tracks thruster and rotation activity for audio

#### `js/audio.js` (136 lines)
**Comprehensive audio system**
- **8 audio files**: Background music, rocket thrust, explosions, landing, etc.
- **Volume management**: Individual volume levels for each sound
- **Audio state tracking**: Prevents overlapping sounds and manages loops
- **Error handling**: Graceful fallbacks for audio playback issues
- **Debug utilities**: Audio testing and diagnostics

#### `js/game.js` (159 lines)
**Main game loop and control**
- **Game loop**: Handles updates, rendering, and state management
- **Camera system**: Smooth following with lerped movement
- **Animation updates**: Pad glow effects, pickup bobbing, star twinkling
- **World expansion**: Triggers terrain generation based on player position
- **Game state management**: Start, reset, crash, and victory handling
- **Music control**: Background music management throughout game states

## Audio Assets
- **game-music.mp3**: Looping background music (3.9MB)
- **rocket-sound.mp3**: Thruster sound effect (327KB)
- **hiss.mp3**: Rotation thruster sound (698KB)  
- **explode.mp3**: Crash explosion sound (29KB)
- **start.mp3**: Game start sound (27KB)
- **legs-upgrade.mp3**: Pickup collection sound (10KB)
- **land.wav**: Landing sound effect (115KB)
- **launch.wav**: Pad launch sound (79KB)

## Technical Implementation Details

### Rendering Pipeline
1. Clear canvas with space gradient background
2. Draw twinkling stars
3. Render terrain with neon glow effects
4. Draw holographic forcefield at x=0
5. Render landing pads with visit status
6. Draw animated pickups with bobbing motion
7. Render lander with rotation and leg upgrades
8. Draw particle effects with alpha blending
9. Apply screen flash effects during explosions
10. Render thrust flames and particle trails
11. Update UI overlays

### Terrain Generation Algorithm
1. **Chunk-based**: Generate 1200px wide sections on-demand
2. **Control points**: Create 4 path points per chunk with height variation
3. **Spline interpolation**: Use Catmull-Rom for smooth curves
4. **Noise addition**: Small sine wave variations for detail
5. **Pad integration**: Flatten terrain around landing pad locations
6. **Smooth transitions**: Gradual approach slopes to pads

### Collision Detection
- **Landing pads**: AABB collision with velocity/angle checking
- **Terrain**: Point-to-line interpolated height testing  
- **Pickups**: Simple bounding box overlap detection
- **Boundaries**: Prevent movement past x=0 and below terrain

### Performance Optimizations
- **Chunk-based rendering**: Only generate visible world sections
- **Particle limits**: Automatic cleanup of expired particles
- **Audio management**: Prevent overlapping sound loops
- **Smooth camera**: Lerped following to reduce jarring movement

## Game Balance & Progression
- **Fuel system**: 100% initial, -2% capacity per unique pad visited
- **Difficulty curve**: Natural increase as fuel capacity decreases
- **Upgrade system**: Landing legs make precision easier
- **Score tracking**: Pads visited and time survived
- **No victory condition**: Endless survival challenge

## Future Development - Pickup System Expansion

### Core Gameplay Enhancers
- [x] **Fuel Efficiency Module** 🔋 ✅ **IMPLEMENTED**
  - Reduces fuel consumption from 0.2% to 0.1% per frame while thrusting
  - Duration: 45 seconds
  - Spawn rate: Common (35%)

- [ ] **Emergency Fuel Pod** ⛽
  - Adds 15-25% fuel instantly (doesn't increase capacity)
  - Single-use pickup
  - Spawn rate: Rare (10-15%)


### Control & Precision Pickups
- [ ] **Gyroscopic Stabilizer** ⚖️
  - Reduces rotation sensitivity and adds auto-stabilization
  - Slight drift toward upright position when not rotating
  - Duration: 45 seconds
  - Spawn rate: Uncommon (20-25%)

- [ ] **Precision Thrusters** 🎯
  - Allows variable thrust control (light tap = 0.04, full = 0.08)
  - Duration: 30 seconds
  - Spawn rate: Common (30-40%)

### Emergency & Defense
- [ ] **Shield Generator** 🛡️
  - One-time crash protection (survives one collision)
  - Single-use pickup with dramatic visual effect
  - Spawn rate: Very Rare (5-10%)

- [ ] **Emergency Brake** 🔴
  - Instant velocity reduction by 50% when collected
  - Single-use with brief invulnerability period
  - Spawn rate: Rare (10-15%)

### Advanced Mechanics
- [ ] **Gravity Dampener** 🌙
  - Reduces gravity from 0.02 to 0.01 for easier flight
  - Duration: 25-35 seconds
  - Spawn rate: Rare (10-15%)

- [ ] **Fuel Capacity Stabilizer** 🔒
  - Prevents fuel capacity degradation for next 3-5 pads
  - Maintains long-term progression challenge
  - Spawn rate: Very Rare (5-10%)

- [ ] **Magnetic Landing Assist** 🧲
  - Slight attraction to landing pads when close
  - Increases landing tolerance (between normal and upgraded legs)
  - Duration: 60 seconds
  - Spawn rate: Uncommon (20-25%)

- [x] **Pickup Attractor** 🚀 ✅ **IMPLEMENTED**
  - Attracts pickups to the lander when close
  - Duration: 190 seconds
  - Spawn rate: Uncommon (22%)

### Implementation Notes
- **Visual Design**: Use neon aesthetic with category-specific colors
  - Fuel items: Blue/cyan glowing effects
  - Control items: Purple/magenta circuit patterns
  - Emergency items: Red/orange warning symbols
  - Advanced items: Multi-colored rainbow effects
- **Audio**: Unique pickup sounds for different categories
- **Balance**: Maintain core challenge while adding strategic depth
