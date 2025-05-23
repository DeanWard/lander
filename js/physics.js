// Physics and collision detection

let gameOverTimeout = null;

function checkLanding() {
    if (gameState.invulnerable) return false;
    const lander = gameState.lander;
    const landerBottom = lander.y + 15;
    const landerLeft = lander.x - 10;
    const landerRight = lander.x + 10;
    
    // Check landing pads
    for (const pad of gameState.landingPads) {
        if (landerLeft >= pad.x && landerRight <= pad.x + pad.width &&
            Math.abs(landerBottom - pad.y) < 5) {
            
            // More forgiving landing parameters with upgraded legs
            const maxVx = lander.upgradedLegs ? 2.5 : 1;
            const maxVy = lander.upgradedLegs ? 3 : 1.5;
            const maxAngle = lander.upgradedLegs ? 1.2 : 0.5;
            
            if (Math.abs(lander.vx) < maxVx && Math.abs(lander.vy) < maxVy && Math.abs(lander.angle) < maxAngle) {
                lander.landed = true;
                lander.onPad = pad.id;
                lander.vx = 0;
                lander.vy = 0;
                
                playLandingSound();
                
                if (!pad.visited) {
                    pad.visited = true;
                    gameState.visitedPads.add(pad.id);
                    // Refill fuel: 2% less for each unique pad visited
                    const padsVisited = gameState.visitedPads.size;
                    lander.fuel = Math.max(0, 100 - (padsVisited - 1) * 2);
                    
                    // Create celebration particles
                    for (let i = 0; i < 20; i++) {
                        createParticle(
                            pad.x + pad.width/2 + (Math.random() - 0.5) * pad.width,
                            pad.y - 10,
                            (Math.random() - 0.5) * 4,
                            -Math.random() * 3,
                            `hsl(${Math.random() * 60 + 120}, 100%, 50%)`,
                            30
                        );
                    }
                }
                return true;
            } else {
                // Crash
                resetLander();
                return false;
            }
        }
    }
    
    // Check terrain collision
    const terrainHeight = getTerrainHeightAt(lander.x);
    if (landerBottom >= terrainHeight) {
        resetLander();
        return false;
    }
    
    return false;
}

function checkPickupCollision() {
    const lander = gameState.lander;
    const landerLeft = lander.x - 15;
    const landerRight = lander.x + 15;
    const landerTop = lander.y - 15;
    const landerBottom = lander.y + 15;
    
    gameState.pickups.forEach(pickup => {
        if (!pickup.collected) {
            const pickupLeft = pickup.x - 15;
            const pickupRight = pickup.x + 15;
            const pickupTop = pickup.y - 15;
            const pickupBottom = pickup.y + 15;
            
            // Check collision
            if (landerRight > pickupLeft && landerLeft < pickupRight &&
                landerBottom > pickupTop && landerTop < pickupBottom) {
                
                pickup.collected = true;
                
                // Apply pickup effect
                if (pickup.type === 'upgradedLegs') {
                    lander.upgradedLegs = true;
                    playLegsUpgradeSound();
                    
                    // Remove all other existing leg pickups from the world
                    gameState.pickups.forEach(otherPickup => {
                        if (otherPickup.type === 'upgradedLegs' && !otherPickup.collected) {
                            otherPickup.collected = true;
                        }
                    });
                    
                    // Create collection particles
                    for (let i = 0; i < 15; i++) {
                        createParticle(
                            pickup.x + (Math.random() - 0.5) * 20,
                            pickup.y + (Math.random() - 0.5) * 20,
                            (Math.random() - 0.5) * 4,
                            -Math.random() * 3,
                            `hsl(${Math.random() * 60 + 60}, 100%, 50%)`,
                            40
                        );
                    }
                } else if (pickup.type === 'fuelEfficiency') {
                    // Activate fuel efficiency module for 45 seconds (2700 frames at 60fps)
                    gameState.fuelEfficiencyActive = true;
                    gameState.fuelEfficiencyTimer = 2700;
                    playLegsUpgradeSound(); // Reuse the same sound effect for now
                    
                    // Create blue/cyan collection particles for fuel items
                    for (let i = 0; i < 20; i++) {
                        createParticle(
                            pickup.x + (Math.random() - 0.5) * 20,
                            pickup.y + (Math.random() - 0.5) * 20,
                            (Math.random() - 0.5) * 4,
                            -Math.random() * 3,
                            `hsl(${Math.random() * 60 + 180}, 100%, 60%)`, // Blue/cyan colors
                            50
                        );
                    }
                } else if (pickup.type === 'pickupAttractor') {
                    // Activate pickup attractor for 190 seconds (11400 frames at 60fps)
                    gameState.pickupAttractorActive = true;
                    gameState.pickupAttractorTimer = 11400;
                    playLegsUpgradeSound(); // Reuse the same sound effect for now
                    
                    // Create rainbow collection particles for advanced items
                    for (let i = 0; i < 25; i++) {
                        const hue = (i / 25) * 360; // Create rainbow spread
                        createParticle(
                            pickup.x + (Math.random() - 0.5) * 20,
                            pickup.y + (Math.random() - 0.5) * 20,
                            (Math.random() - 0.5) * 4,
                            -Math.random() * 3,
                            `hsl(${hue}, 100%, 60%)`, // Rainbow colors
                            60
                        );
                    }
                }
            }
        }
    });
}

function resetLander() {
    gameState.crashed = true;
    gameState.flashIntensity = 1.0; // Bright flash
    
    // Stop all sounds when crashed
    stopGameMusic();
    stopRocketSound();
    stopHissSound();
    
    playExplosionSound();
    
    // MASSIVE explosion with debris scattered across the entire screen
    for (let i = 0; i < 350; i++) {
        const angle = (Math.PI * 2 * i) / 350;
        const speed = 8 + Math.random() * 305; // Extremely fast particles
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        createParticle(
            gameState.lander.x + (Math.random() - 0.5) * 50,
            gameState.lander.y + (Math.random() - 0.5) * 50,
            vx,
            vy - Math.random() * 10,
            `hsl(${Math.random() * 80}, 100%, ${70 + Math.random() * 30}%)`,
            90 + Math.random() * 80
        );
    }
    
    // Giant debris chunks flying everywhere
    for (let i = 0; i < 80; i++) {
        createParticle(
            gameState.lander.x + (Math.random() - 0.5) * 40,
            gameState.lander.y + (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40, // Extreme horizontal speeds
            -Math.random() * 25, // Launch debris high into the air
            `hsl(${Math.random() * 40 + 10}, 100%, 80%)`,
            120 + Math.random() * 80
        );
    }
    
    // First shockwave
    setTimeout(() => {
        for (let i = 0; i < 150; i++) {
            createParticle(
                gameState.lander.x + (Math.random() - 0.5) * 80,
                gameState.lander.y + (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 25,
                -Math.random() * 15,
                `hsl(${Math.random() * 50 + 30}, 100%, 85%)`,
                70
            );
        }
    }, 100);
    
    // Second shockwave
    setTimeout(() => {
        for (let i = 0; i < 120; i++) {
            createParticle(
                gameState.lander.x + (Math.random() - 0.5) * 100,
                gameState.lander.y + (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 20,
                -Math.random() * 10,
                `hsl(${Math.random() * 60}, 85%, 65%)`,
                50
            );
        }
    }, 200);
    
    // Final shockwave with sparks
    setTimeout(() => {
        for (let i = 0; i < 100; i++) {
            createParticle(
                gameState.lander.x + (Math.random() - 0.5) * 120,
                gameState.lander.y + (Math.random() - 0.5) * 120,
                (Math.random() - 0.5) * 15,
                -Math.random() * 8,
                `hsl(${Math.random() * 80 + 40}, 90%, 70%)`,
                40
            );
        }
    }, 350);
    
    // Show game over screen after explosion - store timeout ID
    gameOverTimeout = setTimeout(() => {
        document.getElementById('gameOver').style.display = 'block';
        gameOverTimeout = null; // Clear the reference
    }, 800);
    
    document.getElementById('padsVisitedGameOver').textContent = gameState.visitedPads.size;
}

function cancelGameOverTimeout() {
    if (gameOverTimeout) {
        clearTimeout(gameOverTimeout);
        gameOverTimeout = null;
    }
}

function launchFromPad() {
    if (gameState.lander.onPad !== null) {
        const pad = gameState.landingPads[gameState.lander.onPad];
        gameState.lander.landed = false;
        gameState.lander.onPad = null;
        
        playLaunchSound();
        
        // Reduced random launch vector
        const angle = (Math.random() - 0.5) * 0.2; // -0.1 to +0.1 radians
        const power = 2 + Math.random() * 1; // 2 to 3
        gameState.lander.vx = Math.sin(angle) * power;
        gameState.lander.vy = -Math.cos(angle) * power;
        
        // Set invulnerability for 1 second (60 frames)
        gameState.invulnerable = true;
        gameState.invulnerableTimer = 60;
        
        // Launch particles
        for (let i = 0; i < 25; i++) {
            createParticle(
                pad.x + pad.width/2 + (Math.random() - 0.5) * pad.width,
                pad.y,
                (Math.random() - 0.5) * 6,
                Math.random() * 3,
                `hsl(${180 + Math.random() * 60}, 100%, 50%)`,
                35
            );
        }
    }
}

function updatePhysics() {
    if (gameState.gameWon || gameState.crashed) return;
    
    // Handle invulnerability timer
    if (gameState.invulnerable) {
        gameState.invulnerableTimer--;
        if (gameState.invulnerableTimer <= 0) {
            gameState.invulnerable = false;
            gameState.invulnerableTimer = 0;
        }
    }
    
    // Handle fuel efficiency timer
    if (gameState.fuelEfficiencyActive) {
        gameState.fuelEfficiencyTimer--;
        if (gameState.fuelEfficiencyTimer <= 0) {
            gameState.fuelEfficiencyActive = false;
            gameState.fuelEfficiencyTimer = 0;
        }
    }
    
    // Handle pickup attractor timer and attraction logic
    if (gameState.pickupAttractorActive) {
        gameState.pickupAttractorTimer--;
        if (gameState.pickupAttractorTimer <= 0) {
            gameState.pickupAttractorActive = false;
            gameState.pickupAttractorTimer = 0;
        } else {
            // Apply attraction force to nearby pickups
            gameState.pickups.forEach(pickup => {
                if (!pickup.collected) {
                    const dx = gameState.lander.x - pickup.x;
                    const dy = gameState.lander.y - pickup.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // If pickup is within attraction range
                    if (distance <= gameState.pickupAttractorRange && distance > 0) {
                        // Calculate attraction force (stronger when closer)
                        const attractionStrength = 0.5; // Base attraction strength
                        const force = attractionStrength * (1 - distance / gameState.pickupAttractorRange);
                        
                        // Normalize direction and apply force
                        const forceX = (dx / distance) * force;
                        const forceY = (dy / distance) * force;
                        
                        // Apply attraction by moving pickup toward lander
                        pickup.x += forceX;
                        pickup.y += forceY;
                    }
                }
            });
        }
    }
    
    const lander = gameState.lander;
    
    if (!lander.landed) {
        // Apply gravity (lunar gravity is about 1/6 of Earth's)
        lander.vy += 0.02;
        
        // Update position
        lander.x += lander.vx;
        lander.y += lander.vy;
        
        // Prevent moving left past the start of the world
        if (lander.x < 0) lander.x = 0;
        
        // Clamp vertical position at the top
        if (lander.y < 0) lander.y = 0;
        if (lander.y > canvas.height) resetLander();
        
        checkLanding();
    }
    
    // Check pickup collisions
    checkPickupCollision();
} 