// Terrain generation functions

function generateTerrainChunk(chunkIndex) {
    if (generatedChunks.has(chunkIndex)) return;
    
    const chunkStartX = chunkIndex * CHUNK_WIDTH;
    const points = [];
    const pads = [];
    
    // Add a vertical wall at x = 0 for the leftmost chunk, matching the terrain height
    let startHeight = canvas.height * 0.7;
    if (gameState.terrain.length > 0) {
        startHeight = gameState.terrain[gameState.terrain.length - 1].y;
    }
    if (chunkIndex === 0) {
        // Wall from top to the starting terrain height
        points.push({ x: 0, y: 0 });
        points.push({ x: 0, y: startHeight });
    }
    
    // Get height from previous chunk if it exists
    if (gameState.terrain.length > 0) {
        startHeight = gameState.terrain[gameState.terrain.length - 1].y;
    }
    
    // Create a path through this chunk
    const pathPoints = [];
    const numPathPoints = 4;
    for (let i = 0; i < numPathPoints; i++) {
        pathPoints.push({
            x: chunkStartX + (CHUNK_WIDTH * i) / (numPathPoints - 1),
            y: canvas.height * (0.4 + Math.random() * 0.4) // Vary between 40% and 80% of screen height
        });
    }
    
    // Generate smooth terrain following the path
    let x = chunkStartX;
    while (x <= chunkStartX + CHUNK_WIDTH) {
        // Find the two control points we're between
        const segment = (x - chunkStartX) / CHUNK_WIDTH * (numPathPoints - 1);
        const index = Math.floor(segment);
        const t = segment - index;
        
        let y;
        if (index >= numPathPoints - 1) {
            y = pathPoints[numPathPoints - 1].y;
        } else {
            // Smooth interpolation between path points
            const p0 = pathPoints[Math.max(0, index - 1)];
            const p1 = pathPoints[index];
            const p2 = pathPoints[index + 1];
            const p3 = pathPoints[Math.min(numPathPoints - 1, index + 2)];
            
            // Catmull-Rom spline interpolation
            const t2 = t * t;
            const t3 = t2 * t;
            y = (2 * p1.y + (-p0.y + p2.y) * t +
                (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3) * 0.5;
            
            // Add small random variation
            y += Math.sin(x * 0.05) * 10;
        }
        
        points.push({ x, y });
        x += TERRAIN_SEGMENT;
    }
    
    // Add landing pads
    const padX = chunkStartX + CHUNK_WIDTH / 2; // One pad in middle of chunk
    const padIndex = Math.floor((padX - chunkStartX) / TERRAIN_SEGMENT);
    const padY = points[padIndex].y;
    
    // Flatten terrain around pad
    const flattenRadius = Math.floor(PAD_WIDTH / TERRAIN_SEGMENT);
    for (let i = padIndex - flattenRadius; i <= padIndex + flattenRadius; i++) {
        if (i >= 0 && i < points.length) {
            points[i].y = padY;
        }
    }
    
    // Create smooth approach to pad
    const smoothRadius = flattenRadius * 2;
    for (let i = padIndex - smoothRadius; i < padIndex - flattenRadius; i++) {
        if (i >= 0) {
            const t = (i - (padIndex - smoothRadius)) / flattenRadius;
            const smoothT = t * t * (3 - 2 * t);
            points[i].y = points[i].y * (1 - smoothT) + padY * smoothT;
        }
    }
    for (let i = padIndex + flattenRadius + 1; i <= padIndex + smoothRadius; i++) {
        if (i < points.length) {
            const t = (i - (padIndex + flattenRadius)) / flattenRadius;
            const smoothT = t * t * (3 - 2 * t);
            points[i].y = padY * (1 - smoothT) + points[i].y * smoothT;
        }
    }
    
    // Add pad
    pads.push({
        x: padX - PAD_WIDTH / 2,
        y: padY,
        width: PAD_WIDTH,
        id: Math.floor(chunkStartX / CHUNK_WIDTH),
        visited: false,
        glow: 0
    });
    
    // Add pickups (randomly in some chunks)
    if (Math.random() < 0.4 && chunkIndex > 0) { // 40% chance, but not in first chunk
        const pickupX = chunkStartX + CHUNK_WIDTH * 0.25 + Math.random() * CHUNK_WIDTH * 0.5;
        const pickupIndex = Math.floor((pickupX - chunkStartX) / TERRAIN_SEGMENT);
        const pickupY = points[pickupIndex].y - 60; // Float higher above terrain for easier collection
        
        const pickups = [];
        
        // Fuel efficiency module pickup - 35% chance of spawning
        if (Math.random() < 0.35) {
            pickups.push({
                x: pickupX,
                y: pickupY,
                type: 'fuelEfficiency',
                collected: false,
                glow: Math.random() * Math.PI * 2,
                bobOffset: Math.random() * Math.PI * 2
            });
        }
        
        // Pickup attractor - 22% chance of spawning (uncommon)
        if (Math.random() < 0.22 && pickups.length === 0) {
            pickups.push({
                x: pickupX,
                y: pickupY,
                type: 'pickupAttractor',
                collected: false,
                glow: Math.random() * Math.PI * 2,
                bobOffset: Math.random() * Math.PI * 2,
                rainbowHue: Math.random() * 360 // For rainbow effect
            });
        }
        
        // Upgraded landing legs pickup - only spawn if not already upgraded and no other pickups
        if (!gameState.lander.upgradedLegs && pickups.length === 0) {
            pickups.push({
                x: pickupX,
                y: pickupY,
                type: 'upgradedLegs',
                collected: false,
                glow: Math.random() * Math.PI * 2,
                bobOffset: Math.random() * Math.PI * 2
            });
        }
        
        // Only add pickups if there are any to add
        if (pickups.length > 0) {
            gameState.pickups.push(...pickups);
        }
    }
    
    // Add to game state
    gameState.terrain.push(...points);
    gameState.landingPads.push(...pads);
    generatedChunks.add(chunkIndex);
    worldEndX = Math.max(worldEndX, chunkStartX + CHUNK_WIDTH);
}

function updateTerrainGeneration() {
    // Calculate which chunks should exist based on lander position
    const currentChunk = Math.floor(gameState.lander.x / CHUNK_WIDTH);
    const viewDistance = 2; // Generate this many chunks ahead
    
    for (let i = Math.max(0, currentChunk - 1); i <= currentChunk + viewDistance; i++) {
        generateTerrainChunk(i);
    }
}

function generateMoreTerrainAndPads() {
    updateTerrainGeneration();
}

function getTerrainHeightAt(x) {
    // Make sure terrain exists at this x position
    const chunkIndex = Math.floor(x / CHUNK_WIDTH);
    generateTerrainChunk(chunkIndex);
    
    // Find the terrain points that bracket this x position
    for (let i = 0; i < gameState.terrain.length - 1; i++) {
        const p1 = gameState.terrain[i];
        const p2 = gameState.terrain[i + 1];
        
        if (x >= p1.x && x <= p2.x) {
            const t = (x - p1.x) / (p2.x - p1.x);
            return p1.y + (p2.y - p1.y) * t;
        }
    }
    
    // If we somehow got here, return a safe height
    return canvas.height * 0.7;
}

// Generate stars
function generateStars() {
    gameState.stars = [];
    for (let i = 0; i < Math.floor(canvas.width * canvas.height / 5000); i++) {
        gameState.stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.6,
            brightness: Math.random() * 0.8 + 0.2,
            twinkle: Math.random() * Math.PI * 2
        });
    }
}

// Generate planets for midground parallax effect
function generatePlanets() {
    gameState.planets = [];
    const numPlanets = Math.floor(canvas.width / 200) + 8; // More planets for the larger area
    
    for (let i = 0; i < numPlanets; i++) {
        const planet = {
            x: Math.random() * canvas.width * 20, // Spread planets across a much wider area
            y: Math.random() * canvas.height * 0.4 + canvas.height * 0.1, // Upper 40% of screen, offset down a bit
            radius: Math.random() * 120 + 60, // Size between 60-180 pixels (much bigger!)
            parallaxFactor: 0.3 + Math.random() * 0.3, // Parallax between 0.3-0.6 (slower than foreground)
            hue: Math.random() * 360, // Random color hue
            saturation: 40 + Math.random() * 40, // Saturation between 40-80%
            lightness: 30 + Math.random() * 40, // Lightness between 30-70%
            glowIntensity: 0.3 + Math.random() * 0.4, // Glow intensity for atmospheric effect
            rotationSpeed: (Math.random() - 0.5) * 0.003 // Much slower rotation (was 0.02, now 0.003)
        };
        
        // Add some variety with planet types
        const planetType = Math.random();
        if (planetType < 0.3) {
            // Gas giant - larger with rings
            planet.radius *= 1.5;
            planet.hasRings = true;
            planet.ringRadius = planet.radius * 1.8;
            planet.lightness = Math.min(planet.lightness + 20, 80);
        } else if (planetType < 0.6) {
            // Rocky planet - smaller, more saturated
            planet.radius *= 0.8;
            planet.saturation = Math.min(planet.saturation + 30, 90);
            planet.hasRings = false;
        } else {
            // Ice/desert planet - varying lightness
            planet.lightness = Math.random() > 0.5 ? 
                Math.min(planet.lightness + 30, 90) : // Ice planet (bright)
                Math.max(planet.lightness - 20, 15);  // Desert planet (dark)
            planet.hasRings = false;
        }
        
        gameState.planets.push(planet);
    }
}

// Generate floating asteroids for foreground parallax effect
function generateAsteroids() {
    gameState.asteroids = [];
    const numAsteroids = Math.floor(canvas.width / 150) + 10; // More asteroids for the larger area
    
    for (let i = 0; i < numAsteroids; i++) {
        const asteroid = {
            x: Math.random() * canvas.width * 20, // Spread asteroids across a much wider area
            y: Math.random() * canvas.height * 0.35 + canvas.height * 0.05, // Upper 35% of screen, starting at 5%
            size: Math.random() * 25 + 8, // Size between 8-33 pixels
            parallaxFactor: 0.7 + Math.random() * 0.2, // Parallax between 0.7-0.9 (closer than planets)
            rotation: Math.random() * Math.PI * 2, // Random initial rotation
            rotationSpeed: (Math.random() - 0.5) * 0.005, // Slower rotation speed
            drift: {
                x: (Math.random() - 0.5) * 0.3, // Horizontal drift
                y: (Math.random() - 0.5) * 0.2  // Vertical drift
            },
            shape: Math.floor(Math.random() * 3), // 0, 1, or 2 for different shapes
            color: {
                hue: 200 + Math.random() * 60, // Bluish to cyan hues (200-260)
                saturation: 20 + Math.random() * 30, // Low saturation for rock-like appearance
                lightness: 25 + Math.random() * 25 // Fairly dark
            }
        };
        
        gameState.asteroids.push(asteroid);
    }
} 