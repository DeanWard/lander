// Input handling

const keys = {};

document.addEventListener('keydown', (e) => {
    if (!gameStarted) return; // Ignore key presses before game starts
    
    keys[e.code] = true;
    
    if (e.code === 'Space' && gameState.crashed) {
        restartAfterCrash();
        return;
    }
    
    if (e.code === 'ArrowUp') {
        const now = Date.now();
        if (now - gameState.lastThrustTime < 300) {
            gameState.thrustTapCount++;
            if (gameState.thrustTapCount >= 2 && gameState.lander.landed) {
                launchFromPad();
                gameState.thrustTapCount = 0;
            }
        } else {
            gameState.thrustTapCount = 1;
        }
        gameState.lastThrustTime = now;
    }
    
    // Additional event to allow playing the sound
    if (!rocketSound.paused) return; // Only if not already playing
    
    if (gameStarted && !gameState.crashed && !gameState.gameWon) {
        // Just prepare the audio - don't actually play yet
        rocketSound.load();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function handleInput() {
    if (!gameStarted) return; // No input handling before game starts
    
    const lander = gameState.lander;
    
    // Track if thrusters are active this frame
    gameState.thrustersActive = keys.ArrowUp && lander.fuel > 0 && !lander.landed;
    
    // Track if rotation is active this frame
    gameState.rotationActive = (keys.ArrowLeft || keys.ArrowRight) && !lander.landed;
    
    if (!lander.landed) {
        if (keys.ArrowLeft) {
            lander.angle -= 0.02;
        }
        if (keys.ArrowRight) {
            lander.angle += 0.02;
        }
        if (gameState.thrustersActive) {
            const thrust = 0.08;
            lander.vx += Math.sin(lander.angle) * thrust;
            lander.vy -= Math.cos(lander.angle) * thrust;
            lander.fuel -= 0.2;
        }
        
        // Handle hiss sound for rotation
        if (gameState.rotationActive) {
            playHissSound();
        } else {
            stopHissSound();
        }
    } else {
        // Make sure hiss sound is stopped when landed
        stopHissSound();
    }
    
    // Handle rocket sound
    if (gameState.thrustersActive) {
        playRocketSound();
    } else {
        stopRocketSound();
    }
}

function restartAfterCrash() {
    // Play start sound
    playStartSound();
    resetGame();
} 