// Main game controller

function updateGame() {
    if (gameState.gameWon || gameState.crashed) return;
    
    // Start music if not playing
    startGameMusic();
    
    updatePhysics();
    updateParticles();
    
    // Send player position to other players (multiplayer)
    sendPlayerPosition();
    
    // Fade the flash effect quickly
    if (gameState.flashIntensity > 0) {
        gameState.flashIntensity -= 0.15;
        if (gameState.flashIntensity < 0) gameState.flashIntensity = 0;
    }
    
    // Update pad glow effects
    gameState.landingPads.forEach(pad => {
        if (pad.visited) {
            pad.glow = (pad.glow + 0.1) % (Math.PI * 2);
        }
    });
    
    // Update pickup animations
    gameState.pickups.forEach(pickup => {
        pickup.glow = (pickup.glow + 0.05) % (Math.PI * 2);
        pickup.bobOffset = (pickup.bobOffset + 0.03) % (Math.PI * 2);
    });
    
    // Update star twinkle
    gameState.stars.forEach(star => {
        star.twinkle += 0.05;
    });
    
    // Camera follows lander at 40% of screen width
    const cameraTarget = gameState.lander.x - canvas.width * 0.4;
    gameState.cameraX += (cameraTarget - gameState.cameraX) * 0.1; // Smooth follow
    
    // Generate more terrain/pads if needed
    if (gameState.lander.x + canvas.width > worldEndX - PAD_SPACING) {
        generateMoreTerrainAndPads();
    }
    
    // Victory condition removed - game continues until crash
}

function resetGame() {
    // Cancel any pending game over screen timeout
    if (typeof cancelGameOverTimeout === 'function') {
        cancelGameOverTimeout();
    }
    
    // Clean up multiplayer data
    cleanupPlayerData();
    
    generatedChunks = new Set();
    worldEndX = 0;
    gameState = {
        lander: {
            x: 100,
            y: 100,
            vx: 0,
            vy: 0,
            angle: 0,
            fuel: 100,
            landed: false,
            onPad: null,
            upgradedLegs: false
        },
        terrain: [],
        landingPads: [],
        pickups: [],
        visitedPads: new Set(),
        particles: [],
        stars: [],
        planets: [],
        asteroids: [],
        startTime: Date.now(),
        gameWon: false,
        crashed: false,
        flashIntensity: 0,
        lastThrustTime: 0,
        thrustTapCount: 0,
        musicPlaying: false,
        thrustersActive: false,
        rotationActive: false,
        invulnerable: false,
        invulnerableTimer: 0,
        cameraX: 0,
        fuelEfficiencyActive: false,
        fuelEfficiencyTimer: 0,
        fuelEfficiencyMultiplier: 0.5,
        pickupAttractorActive: false,
        pickupAttractorTimer: 0,
        pickupAttractorRange: 120
    };
    
    generateStars();
    generatePlanets(); // Generate planets for midground parallax
    generateAsteroids(); // Generate floating asteroids
    // Generate initial terrain chunks
    generateTerrainChunk(0);
    generateTerrainChunk(1);
    
    document.getElementById('victory').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    
    // Restart music
    restartGameMusic();
    
    // Make sure rocket sound is stopped
    stopRocketSound();
    
    // Make sure hiss sound is stopped
    stopHissSound();
}

function startGame() {
    if (gameStarted) return;
    
    // Play start sound
    playStartSound();
    
    gameStarted = true;
    gameState.startTime = Date.now();
    
    // Show game UI
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
    
    // Show appropriate controls based on device
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const keyboardControls = document.getElementById('keyboardControls');
    const mobileControls = document.getElementById('mobileControls');
    
    if (hasTouch && isMobile) {
        keyboardControls.style.display = 'none';
        mobileControls.style.display = 'block';
    } else {
        keyboardControls.style.display = 'block';
        mobileControls.style.display = 'none';
    }
    
    // Initialize terrain and game state
    generatedChunks = new Set();
    worldEndX = 0;
    gameState.terrain = [];
    gameState.landingPads = [];
    
    // Generate initial chunks
    generateTerrainChunk(0); // Generate first chunk
    generateTerrainChunk(1); // Generate second chunk for smooth start
    
    // Start music
    startGameMusic();
    
    // Debug audio after user interaction
    debugAudio();
}

function gameLoop() {
    handleInput();
    if (gameStarted) {
        updateGame();
    }
    render();
    requestAnimationFrame(gameLoop);
}

// Initialize the game
function initGame() {
    // Initialize stars (for background on start screen)
    generateStars();
    generatePlanets(); // Generate planets for midground parallax
    generateAsteroids(); // Generate floating asteroids
    
    // Set up start button event
    document.getElementById('startButton').addEventListener('click', startGame);
    
    // Start the game loop
    gameLoop();
}

// Start the game when the page loads
window.addEventListener('load', initGame); 