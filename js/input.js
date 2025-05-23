// Input handling

const keys = {};

// Mobile touch controls
let touchState = {
    isActive: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    swipeThreshold: 30,
    thrustActive: false,
    rotationDirection: 0, // -1 for left, 1 for right, 0 for none
    lastTouchTime: 0,
    tapCount: 0
};

// Detect if device has touch capability
const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Touch indicator element
let touchIndicator = null;

document.addEventListener('keydown', (e) => {
    // Handle space key to start game when on start screen
    if (!gameStarted && e.code === 'Space') {
        startGame();
        return;
    }
    
    if (!gameStarted) return; // Ignore other key presses before game starts
    
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
    
    // Toggle leaderboard with 'L' key
    if (e.key.toLowerCase() === 'l' && gameStarted) {
        e.preventDefault();
        toggleLeaderboard();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Only add touch event handlers if device supports touch
if (hasTouch) {
    // Touch event handlers
    document.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling and zooming
        
        const touch = e.touches[0];
        touchState.isActive = true;
        touchState.startX = touch.clientX;
        touchState.startY = touch.clientY;
        touchState.currentX = touch.clientX;
        touchState.currentY = touch.clientY;
        
        // Show touch indicator
        if (!touchIndicator) {
            touchIndicator = document.getElementById('touchIndicator');
        }
        showTouchIndicator(touch.clientX, touch.clientY);
        
        // Handle tap to start game
        if (!gameStarted) {
            startGame();
            return;
        }
        
        // Handle tap to restart after crash
        if (gameState.crashed) {
            const now = Date.now();
            if (now - touchState.lastTouchTime < 300) {
                touchState.tapCount++;
                if (touchState.tapCount >= 1) {
                    restartAfterCrash();
                    touchState.tapCount = 0;
                }
            } else {
                touchState.tapCount = 1;
            }
            touchState.lastTouchTime = now;
            return;
        }
        
        // Handle double-tap to launch from pad (same as double-tap up arrow)
        if (gameState.lander.landed) {
            const now = Date.now();
            if (now - gameState.lastThrustTime < 300) {
                gameState.thrustTapCount++;
                if (gameState.thrustTapCount >= 2) {
                    launchFromPad();
                    gameState.thrustTapCount = 0;
                }
            } else {
                gameState.thrustTapCount = 1;
            }
            gameState.lastThrustTime = now;
        }
        
        touchState.lastTouchTime = Date.now();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Prevent scrolling
        
        if (!touchState.isActive || !gameStarted || gameState.crashed) return;
        
        const touch = e.touches[0];
        touchState.currentX = touch.clientX;
        touchState.currentY = touch.clientY;
        
        const deltaX = touchState.currentX - touchState.startX;
        const deltaY = touchState.currentY - touchState.startY;
        
        // Reset previous states
        touchState.thrustActive = false;
        touchState.rotationDirection = 0;
        
        // Update touch indicator position
        updateTouchIndicator(touch.clientX, touch.clientY);
        
        // Determine primary gesture direction
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            // Vertical gesture - thrust control
            if (deltaY < -touchState.swipeThreshold) {
                touchState.thrustActive = true;
                setTouchIndicatorType('thrust');
            }
        } else {
            // Horizontal gesture - rotation control
            if (Math.abs(deltaX) > touchState.swipeThreshold) {
                touchState.rotationDirection = deltaX > 0 ? 1 : -1;
                setTouchIndicatorType('rotate');
            }
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        e.preventDefault();
        
        touchState.isActive = false;
        touchState.thrustActive = false;
        touchState.rotationDirection = 0;
        
        // Hide touch indicator
        hideTouchIndicator();
    }, { passive: false });
}

// Touch indicator functions
function showTouchIndicator(x, y) {
    if (touchIndicator && hasTouch) {
        touchIndicator.style.display = 'block';
        touchIndicator.style.left = x + 'px';
        touchIndicator.style.top = y + 'px';
        touchIndicator.className = 'touch-indicator';
    }
}

function updateTouchIndicator(x, y) {
    if (touchIndicator && hasTouch && touchIndicator.style.display === 'block') {
        touchIndicator.style.left = x + 'px';
        touchIndicator.style.top = y + 'px';
    }
}

function setTouchIndicatorType(type) {
    if (touchIndicator && hasTouch) {
        touchIndicator.className = 'touch-indicator ' + type;
    }
}

function hideTouchIndicator() {
    if (touchIndicator && hasTouch) {
        touchIndicator.style.display = 'none';
        touchIndicator.className = 'touch-indicator';
    }
}

function handleInput() {
    if (!gameStarted) return; // No input handling before game starts
    
    const lander = gameState.lander;
    
    // Combine keyboard and touch input (only use touch if device supports it)
    const thrustInput = keys.ArrowUp || (hasTouch && touchState.thrustActive);
    const leftInput = keys.ArrowLeft || (hasTouch && touchState.rotationDirection === -1);
    const rightInput = keys.ArrowRight || (hasTouch && touchState.rotationDirection === 1);
    
    // Track if thrusters are active this frame
    gameState.thrustersActive = thrustInput && lander.fuel > 0 && !lander.landed;
    
    // Track if rotation is active this frame
    gameState.rotationActive = (leftInput || rightInput) && !lander.landed;
    
    if (!lander.landed) {
        if (leftInput) {
            lander.angle -= 0.02;
        }
        if (rightInput) {
            lander.angle += 0.02;
        }
        if (gameState.thrustersActive) {
            const thrust = 0.08;
            lander.vx += Math.sin(lander.angle) * thrust;
            lander.vy -= Math.cos(lander.angle) * thrust;
            
            // Apply fuel efficiency if active
            const fuelConsumption = gameState.fuelEfficiencyActive ? 
                0.2 * gameState.fuelEfficiencyMultiplier : 0.2;
            lander.fuel -= fuelConsumption;
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

// Set up leaderboard button event
window.addEventListener('load', () => {
    document.getElementById('toggleLeaderboard').addEventListener('click', toggleLeaderboard);
    document.getElementById('changeName').addEventListener('click', changePlayerName);
    document.getElementById('nameInput').addEventListener('keydown', handleNameInputKeypress);
    
    // Show leaderboard by default when game starts
    setTimeout(() => {
        if (gameStarted) {
            document.getElementById('leaderboard').style.display = 'block';
            updateLeaderboards();
        }
    }, 2000);
}); 