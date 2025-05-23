// Audio elements
const gameMusic = document.getElementById('gameMusic');
const startSound = document.getElementById('startSound');
const rocketSound = document.getElementById('rocketSound');
const explodeSound = document.getElementById('explodeSound');
const hissSound = document.getElementById('hissSound');
const legsUpgradeSound = document.getElementById('legsUpgradeSound');
const landSound = document.getElementById('landSound');
const launchSound = document.getElementById('launchSound');

// Set audio volumes
rocketSound.volume = 1.0;
gameMusic.volume = 0.3;
startSound.volume = 0.8;
explodeSound.volume = 1.0;
hissSound.volume = 1;
legsUpgradeSound.volume = 0.8;
landSound.volume = 0.7;
launchSound.volume = 0.8;

// Audio management functions
function playRocketSound() {
    if (rocketSound.paused) {
        console.log("Starting rocket sound");
        rocketSound.currentTime = 0;
        const playPromise = rocketSound.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Rocket sound error:", error);
            });
        }
    }
}

function stopRocketSound() {
    if (!rocketSound.paused) {
        console.log("Stopping rocket sound");
        rocketSound.pause();
    }
}

function playHissSound() {
    if (hissSound.paused) {
        hissSound.currentTime = 0;
        hissSound.play().catch(error => {
            console.error("Hiss sound error:", error);
        });
    }
}

function stopHissSound() {
    if (!hissSound.paused) {
        hissSound.pause();
    }
}

function playExplosionSound() {
    explodeSound.currentTime = 0;
    explodeSound.play().catch(error => {
        console.error("Explosion sound error:", error);
    });
}

function playLandingSound() {
    landSound.currentTime = 0;
    landSound.play().catch(error => {
        console.error("Landing sound error:", error);
    });
}

function playLaunchSound() {
    launchSound.currentTime = 0;
    launchSound.play().catch(error => {
        console.error("Launch sound error:", error);
    });
}

function playLegsUpgradeSound() {
    legsUpgradeSound.currentTime = 0;
    legsUpgradeSound.play().catch(error => {
        console.error("Legs upgrade sound error:", error);
    });
}

function playStartSound() {
    startSound.currentTime = 0;
    startSound.play().catch(error => {
        console.error("Start sound error:", error);
    });
}

function startGameMusic() {
    if (!gameState.musicPlaying) {
        gameMusic.play().catch(error => {
            console.log("Audio playback prevented: ", error);
        });
        gameState.musicPlaying = true;
    }
}

function stopGameMusic() {
    if (gameState.musicPlaying) {
        gameMusic.pause();
        gameState.musicPlaying = false;
    }
}

function restartGameMusic() {
    gameMusic.currentTime = 0;
    gameMusic.play().catch(error => {
        console.log("Audio playback prevented: ", error);
    });
    gameState.musicPlaying = true;
}

// Debug function to check if audio is working
function debugAudio() {
    console.log("Rocket sound ready state:", rocketSound.readyState);
    console.log("Rocket sound paused:", rocketSound.paused);
    console.log("Rocket sound muted:", rocketSound.muted);
    console.log("Rocket sound volume:", rocketSound.volume);
    
    // Force play the sound to test
    rocketSound.play().then(() => {
        console.log("Rocket sound playing successfully");
    }).catch(error => {
        console.error("Rocket sound play error:", error);
    });
    
    // Stop after 2 seconds
    setTimeout(() => {
        rocketSound.pause();
        console.log("Rocket sound stopped after test");
    }, 2000);
} 