// Rendering functions

function render() {
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000011');
    gradient.addColorStop(0.3, '#000033');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    gameState.stars.forEach(star => {
        const brightness = star.brightness * (0.5 + 0.5 * Math.sin(star.twinkle));
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.fillRect(star.x, star.y, 2, 2);
    });
    
    // Draw planets (midground with parallax)
    drawPlanets();
    
    // Draw asteroids (foreground parallax, closer than planets)
    drawAsteroids();
    
    if (!gameStarted) {
        return; // Don't render the rest if game hasn't started
    }
    
    // Draw terrain with moon-like regolith appearance
    ctx.strokeStyle = '#8B7B6B'; // Dusty brownish-gray outline
    ctx.lineWidth = 3;
    ctx.shadowColor = '#5D5449';
    ctx.shadowBlur = 5;
    
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    gameState.terrain.forEach((point, i) => {
        let screenX;
        if (point.x === 0) {
            screenX = 0; // Always pin vertical wall to left edge
        } else {
            screenX = point.x - gameState.cameraX;
        }
        ctx.lineTo(screenX, point.y);
    });
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    
    // Fill terrain with realistic moon regolith gradient
    const terrainGradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
    terrainGradient.addColorStop(0, '#A59B8F'); // Lighter dusty gray at surface
    terrainGradient.addColorStop(0.3, '#8B7B6B'); // Medium brownish-gray
    terrainGradient.addColorStop(0.7, '#6B5E52'); // Darker brownish-gray
    terrainGradient.addColorStop(1, '#4A3F35'); // Dark brown underground
    ctx.fillStyle = terrainGradient;
    ctx.fill();
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    // Draw holographic forcefield at x=0
    drawForcefield();
    
    // Draw moon bases around landing pads
    drawMoonBases();
    
    // Draw landing pads
    drawLandingPads();
    
    // Draw pickups
    drawPickups();
    
    // Draw lander
    drawLander();
    
    // Draw ghost players (other multiplayer players)
    drawGhostPlayers();
    
    // Draw attraction field if pickup attractor is active
    if (gameState.pickupAttractorActive) {
        drawAttractionField();
    }
    
    // Draw particles
    drawParticles();
    
    // Draw bright flash overlay during explosion
    if (gameState.flashIntensity > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${gameState.flashIntensity * 0.7})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw thrust effect
    drawThrustEffect();
    
    // Draw landing safety HUD
    drawLandingSafetyHUD();
    
    // Update UI
    updateUI();
}

function drawPlanets() {
    gameState.planets.forEach(planet => {
        // Calculate parallax position
        const parallaxX = planet.x - (gameState.cameraX * planet.parallaxFactor);
        
        // Only draw if planet is visible (with some margin)
        if (parallaxX + planet.radius < -100 || parallaxX - planet.radius > canvas.width + 100) {
            return;
        }
        
        ctx.save();
        ctx.translate(parallaxX, planet.y);
        
        // Planet rotation for subtle animation
        planet.rotation = (planet.rotation || 0) + planet.rotationSpeed;
        ctx.rotate(planet.rotation);
        
        // Planet color
        const planetColor = `hsl(${planet.hue}, ${planet.saturation}%, ${planet.lightness}%)`;
        const glowColor = `hsl(${planet.hue}, ${Math.min(planet.saturation + 20, 100)}%, ${Math.min(planet.lightness + 30, 90)}%)`;
        
        // Draw atmospheric glow
        const glowGradient = ctx.createRadialGradient(0, 0, planet.radius * 0.8, 0, 0, planet.radius * 2);
        glowGradient.addColorStop(0, `hsla(${planet.hue}, ${planet.saturation}%, ${planet.lightness}%, 0)`);
        glowGradient.addColorStop(0.7, `hsla(${planet.hue}, ${planet.saturation}%, ${planet.lightness}%, ${planet.glowIntensity * 0.3})`);
        glowGradient.addColorStop(1, `hsla(${planet.hue}, ${planet.saturation}%, ${planet.lightness}%, 0)`);
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, planet.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw planet body with subtle shading
        const planetGradient = ctx.createRadialGradient(-planet.radius * 0.3, -planet.radius * 0.3, 0, 0, 0, planet.radius);
        planetGradient.addColorStop(0, `hsl(${planet.hue}, ${planet.saturation}%, ${Math.min(planet.lightness + 25, 95)}%)`);
        planetGradient.addColorStop(0.6, planetColor);
        planetGradient.addColorStop(1, `hsl(${planet.hue}, ${Math.min(planet.saturation + 20, 100)}%, ${Math.max(planet.lightness - 30, 5)}%)`);
        
        ctx.fillStyle = planetGradient;
        ctx.beginPath();
        ctx.arc(0, 0, planet.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw rings for gas giants
        if (planet.hasRings) {
            ctx.strokeStyle = `hsla(${planet.hue + 30}, ${Math.max(planet.saturation - 20, 20)}%, ${planet.lightness}%, 0.6)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            // Multiple ring segments for visual interest
            for (let i = 0; i < 3; i++) {
                const ringRadius = planet.ringRadius + (i * 8);
                ctx.beginPath();
                ctx.ellipse(0, 0, ringRadius, ringRadius * 0.3, Math.PI * 0.1, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        // Add subtle surface features for rocky planets
        if (!planet.hasRings && planet.radius < 35) {
            ctx.fillStyle = `hsla(${planet.hue + 60}, ${planet.saturation}%, ${Math.max(planet.lightness - 20, 10)}%, 0.4)`;
            
            // Random surface spots/features
            for (let i = 0; i < 3; i++) {
                const spotX = (Math.random() - 0.5) * planet.radius * 0.8;
                const spotY = (Math.random() - 0.5) * planet.radius * 0.8;
                const spotRadius = Math.random() * planet.radius * 0.15 + planet.radius * 0.05;
                
                ctx.beginPath();
                ctx.arc(spotX, spotY, spotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    });
}

function drawAsteroids() {
    gameState.asteroids.forEach(asteroid => {
        // Update asteroid position with drift
        asteroid.x += asteroid.drift.x;
        asteroid.y += asteroid.drift.y;
        
        // Update rotation
        asteroid.rotation += asteroid.rotationSpeed;
        
        // Calculate parallax position
        const parallaxX = asteroid.x - (gameState.cameraX * asteroid.parallaxFactor);
        const parallaxY = asteroid.y;
        
        // Only draw if asteroid is visible (with some margin)
        if (parallaxX + asteroid.size < -50 || parallaxX - asteroid.size > canvas.width + 50) {
            return;
        }
        
        ctx.save();
        ctx.translate(parallaxX, parallaxY);
        ctx.rotate(asteroid.rotation);
        
        // Asteroid color
        const asteroidColor = `hsl(${asteroid.color.hue}, ${asteroid.color.saturation}%, ${asteroid.color.lightness}%)`;
        const highlightColor = `hsl(${asteroid.color.hue}, ${asteroid.color.saturation}%, ${Math.min(asteroid.color.lightness + 15, 70)}%)`;
        
        ctx.fillStyle = asteroidColor;
        ctx.strokeStyle = highlightColor;
        ctx.lineWidth = 1;
        
        // Draw different asteroid shapes
        ctx.beginPath();
        
        if (asteroid.shape === 0) {
            // Irregular rocky shape
            const points = 8;
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const variance = 0.7 + Math.random() * 0.6; // Random size variation
                const radius = asteroid.size * variance;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
        } else if (asteroid.shape === 1) {
            // Angular crystalline shape
            const x1 = -asteroid.size;
            const y1 = asteroid.size * 0.3;
            const x2 = -asteroid.size * 0.3;
            const y2 = -asteroid.size;
            const x3 = asteroid.size * 0.7;
            const y3 = -asteroid.size * 0.5;
            const x4 = asteroid.size;
            const y4 = asteroid.size * 0.8;
            const x5 = asteroid.size * 0.2;
            const y5 = asteroid.size;
            
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.lineTo(x4, y4);
            ctx.lineTo(x5, y5);
            ctx.closePath();
        } else {
            // Rounded lumpy shape
            const segments = 6;
            for (let i = 0; i < segments; i++) {
                const angle1 = (i / segments) * Math.PI * 2;
                const angle2 = ((i + 1) / segments) * Math.PI * 2;
                const r1 = asteroid.size * (0.8 + Math.sin(i * 0.7) * 0.3);
                const r2 = asteroid.size * (0.8 + Math.sin((i + 1) * 0.7) * 0.3);
                
                const x1 = Math.cos(angle1) * r1;
                const y1 = Math.sin(angle1) * r1;
                const x2 = Math.cos(angle2) * r2;
                const y2 = Math.sin(angle2) * r2;
                
                if (i === 0) {
                    ctx.moveTo(x1, y1);
                }
                
                // Control points for curves
                const cx1 = x1 + Math.cos(angle1 + Math.PI/2) * asteroid.size * 0.2;
                const cy1 = y1 + Math.sin(angle1 + Math.PI/2) * asteroid.size * 0.2;
                const cx2 = x2 + Math.cos(angle2 - Math.PI/2) * asteroid.size * 0.2;
                const cy2 = y2 + Math.sin(angle2 - Math.PI/2) * asteroid.size * 0.2;
                
                ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
            }
            ctx.closePath();
        }
        
        ctx.fill();
        ctx.stroke();
        
        // Add some surface detail
        ctx.fillStyle = highlightColor;
        const numSpots = Math.floor(asteroid.size / 10);
        for (let i = 0; i < numSpots; i++) {
            const spotX = (Math.random() - 0.5) * asteroid.size * 0.6;
            const spotY = (Math.random() - 0.5) * asteroid.size * 0.6;
            const spotSize = Math.random() * 2 + 1;
            
            ctx.beginPath();
            ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    });
}

function drawForcefield() {
    const forcefieldScreenX = 0 - gameState.cameraX;
    if (forcefieldScreenX >= 0 && forcefieldScreenX <= canvas.width) {
        // Animate the forcefield with a moving gradient
        const time = Date.now() * 0.002;
        const grad = ctx.createLinearGradient(forcefieldScreenX - 2, 0, forcefieldScreenX + 2, canvas.height);
        grad.addColorStop(0, 'rgba(0,255,255,0)');
        grad.addColorStop(0.4 + 0.1 * Math.sin(time), 'rgba(0,255,255,0.3)');
        grad.addColorStop(0.5, 'rgba(0,255,255,0.8)');
        grad.addColorStop(0.6 + 0.1 * Math.cos(time), 'rgba(0,255,255,0.3)');
        grad.addColorStop(1, 'rgba(0,255,255,0)');
        ctx.save();
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(time * 2);
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 25 + 10 * Math.abs(Math.sin(time * 2));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(forcefieldScreenX, 0);
        ctx.lineTo(forcefieldScreenX, canvas.height);
        ctx.stroke();
        ctx.restore();
    }
}

function drawLandingPads() {
    gameState.landingPads.forEach(pad => {
        const centerX = pad.x + pad.width / 2 - gameState.cameraX;
        const padScreenX = pad.x - gameState.cameraX;
        
        if (pad.visited) {
            // Animated glow for visited pads
            const glowIntensity = 0.5 + 0.5 * Math.sin(pad.glow);
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 15 * glowIntensity;
            ctx.strokeStyle = '#00ff00';
        } else {
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 8;
            ctx.strokeStyle = '#ffff00';
        }
        
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(padScreenX, pad.y);
        ctx.lineTo(padScreenX + pad.width, pad.y);
        ctx.stroke();
        
        // Pad number
        ctx.shadowBlur = 5;
        ctx.fillStyle = pad.visited ? '#00ff00' : '#ffff00';
        ctx.font = '16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText((pad.id + 1).toString(), centerX, pad.y - 10);
        
        ctx.shadowBlur = 0;
    });
}

function drawMoonBases() {
    gameState.landingPads.forEach(pad => {
        const centerX = pad.x + pad.width / 2;
        const padY = pad.y;
        const baseScreenX = centerX - gameState.cameraX;
        
        // Skip if off-screen
        if (baseScreenX < -200 || baseScreenX > canvas.width + 200) return;
        
        // Use pad ID as seed for consistent but different bases
        const seed = pad.id;
        
        // Deterministic random function based on seed and index
        const seededRandom = (index) => {
            const x = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
            return x - Math.floor(x);
        };
        
        ctx.save();
        
        // Base structures around the landing pad
        const structureRadius = 80; // Area around pad to place structures
        const numStructures = 4 + Math.floor(seededRandom(0) * 4); // 4-7 structures per base
        
        for (let i = 0; i < numStructures; i++) {
            const angle = seededRandom(i + 1) * Math.PI * 2;
            const distance = 40 + seededRandom(i + 10) * 40; // Distance from pad center
            const structureWorldX = centerX + Math.cos(angle) * distance; // World X coordinate
            const structureX = structureWorldX - gameState.cameraX; // Screen X coordinate
            
            // Get the actual terrain height at this X position
            const terrainHeight = getTerrainHeightAt(structureWorldX);
            const structureY = terrainHeight - 2; // Place slightly above terrain surface
            
            // Skip if this structure is off-screen
            if (structureX < -50 || structureX > canvas.width + 50) continue;
            
            const structureType = Math.floor(seededRandom(i + 30) * 5); // 5 different structure types
            
            ctx.save();
            ctx.translate(structureX, structureY);
            
            // Base colors for moon base structures
            const baseColor = '#CCCCCC';
            const accentColor = '#EEEEEE';
            const darkColor = '#999999';
            const lightBlue = '#7FC7FF';
            const orange = '#FFB366';
            
            switch (structureType) {
                case 0: // Storage tank
                    {
                        const tankHeight = 15 + seededRandom(i + 40) * 10;
                        const tankWidth = 8 + seededRandom(i + 50) * 6;
                        
                        // Tank body
                        ctx.fillStyle = baseColor;
                        ctx.strokeStyle = darkColor;
                        ctx.lineWidth = 1;
                        ctx.fillRect(-tankWidth/2, -tankHeight, tankWidth, tankHeight);
                        ctx.strokeRect(-tankWidth/2, -tankHeight, tankWidth, tankHeight);
                        
                        // Tank top (rounded)
                        ctx.beginPath();
                        ctx.ellipse(0, -tankHeight, tankWidth/2, 3, 0, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                        
                        // Tank details
                        ctx.strokeStyle = accentColor;
                        ctx.lineWidth = 0.5;
                        for (let j = 1; j < 3; j++) {
                            const y = -tankHeight + (tankHeight * j / 3);
                            ctx.beginPath();
                            ctx.moveTo(-tankWidth/2, y);
                            ctx.lineTo(tankWidth/2, y);
                            ctx.stroke();
                        }
                        
                        // Pipes
                        ctx.strokeStyle = darkColor;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(tankWidth/2, -tankHeight/2);
                        ctx.lineTo(tankWidth/2 + 8, -tankHeight/2);
                        ctx.lineTo(tankWidth/2 + 8, -tankHeight/2 + 5);
                        ctx.stroke();
                    }
                    break;
                    
                case 1: // Communication tower
                    {
                        const towerHeight = 25 + seededRandom(i + 60) * 15;
                        
                        // Tower base
                        ctx.fillStyle = baseColor;
                        ctx.strokeStyle = darkColor;
                        ctx.lineWidth = 1;
                        ctx.fillRect(-3, -8, 6, 8);
                        ctx.strokeRect(-3, -8, 6, 8);
                        
                        // Tower mast
                        ctx.strokeStyle = accentColor;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(0, -8);
                        ctx.lineTo(0, -towerHeight);
                        ctx.stroke();
                        
                        // Support struts
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(-2, -8);
                        ctx.lineTo(0, -towerHeight/2);
                        ctx.lineTo(2, -8);
                        ctx.stroke();
                        
                        // Antenna/dish at top
                        ctx.fillStyle = lightBlue;
                        ctx.strokeStyle = lightBlue;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.ellipse(0, -towerHeight, 4, 2, 0, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                        
                        // Signal indicator light
                        const blinkPhase = (Date.now() / 1000 + seed) % 2;
                        if (blinkPhase < 1) {
                            ctx.fillStyle = '#FF4444';
                            ctx.beginPath();
                            ctx.arc(0, -towerHeight - 3, 1, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                    break;
                    
                case 2: // Habitat module
                    {
                        const moduleWidth = 12 + seededRandom(i + 70) * 8;
                        const moduleHeight = 8 + seededRandom(i + 80) * 4;
                        
                        // Main module body
                        ctx.fillStyle = baseColor;
                        ctx.strokeStyle = darkColor;
                        ctx.lineWidth = 1;
                        ctx.fillRect(-moduleWidth/2, -moduleHeight, moduleWidth, moduleHeight);
                        ctx.strokeRect(-moduleWidth/2, -moduleHeight, moduleWidth, moduleHeight);
                        
                        // Airlock door
                        ctx.fillStyle = darkColor;
                        const doorWidth = 3;
                        ctx.fillRect(-doorWidth/2, -moduleHeight/2, doorWidth, moduleHeight/2);
                        ctx.strokeRect(-doorWidth/2, -moduleHeight/2, doorWidth, moduleHeight/2);
                        
                        // Windows
                        ctx.fillStyle = lightBlue;
                        const windowSize = 2;
                        ctx.fillRect(-moduleWidth/2 + 2, -moduleHeight + 2, windowSize, windowSize);
                        ctx.fillRect(moduleWidth/2 - 4, -moduleHeight + 2, windowSize, windowSize);
                        
                        // Roof details
                        ctx.strokeStyle = accentColor;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(-moduleWidth/2, -moduleHeight);
                        ctx.lineTo(moduleWidth/2, -moduleHeight);
                        ctx.stroke();
                    }
                    break;
                    
                case 3: // Solar panel array
                    {
                        const panelWidth = 10 + seededRandom(i + 90) * 8;
                        const panelHeight = 6;
                        
                        // Support post
                        ctx.strokeStyle = darkColor;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(0, -12);
                        ctx.stroke();
                        
                        // Panel frame
                        ctx.save();
                        ctx.translate(0, -12);
                        ctx.rotate(Math.PI / 6); // Angled for sun
                        
                        ctx.fillStyle = '#4A4A4A';
                        ctx.strokeStyle = accentColor;
                        ctx.lineWidth = 1;
                        ctx.fillRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight);
                        ctx.strokeRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight);
                        
                        // Solar cells grid
                        ctx.strokeStyle = lightBlue;
                        ctx.lineWidth = 0.5;
                        for (let x = -panelWidth/2 + 2; x < panelWidth/2; x += 2) {
                            ctx.beginPath();
                            ctx.moveTo(x, -panelHeight/2);
                            ctx.lineTo(x, panelHeight/2);
                            ctx.stroke();
                        }
                        for (let y = -panelHeight/2 + 1; y < panelHeight/2; y += 1) {
                            ctx.beginPath();
                            ctx.moveTo(-panelWidth/2, y);
                            ctx.lineTo(panelWidth/2, y);
                            ctx.stroke();
                        }
                        
                        ctx.restore();
                    }
                    break;
                    
                case 4: // Equipment/machinery
                    {
                        const equipWidth = 6 + seededRandom(i + 100) * 4;
                        const equipHeight = 5 + seededRandom(i + 110) * 3;
                        
                        // Main equipment box
                        ctx.fillStyle = darkColor;
                        ctx.strokeStyle = accentColor;
                        ctx.lineWidth = 1;
                        ctx.fillRect(-equipWidth/2, -equipHeight, equipWidth, equipHeight);
                        ctx.strokeRect(-equipWidth/2, -equipHeight, equipWidth, equipHeight);
                        
                        // Control panel
                        ctx.fillStyle = '#333333';
                        ctx.fillRect(-equipWidth/2 + 1, -equipHeight + 1, equipWidth - 2, 2);
                        
                        // Status lights
                        const lights = 2 + Math.floor(seededRandom(i + 120) * 3);
                        for (let l = 0; l < lights; l++) {
                            const lightX = -equipWidth/2 + 2 + l * 2;
                            const lightY = -equipHeight + 2;
                            const lightColor = seededRandom(l + seed) > 0.5 ? '#00FF00' : '#FF0000';
                            
                            ctx.fillStyle = lightColor;
                            ctx.beginPath();
                            ctx.arc(lightX, lightY, 0.5, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        
                        // Cooling vents
                        ctx.strokeStyle = '#666666';
                        ctx.lineWidth = 0.5;
                        for (let v = 0; v < 3; v++) {
                            const ventY = -equipHeight/2 + v - 1;
                            ctx.beginPath();
                            ctx.moveTo(-equipWidth/2 + 1, ventY);
                            ctx.lineTo(equipWidth/2 - 1, ventY);
                            ctx.stroke();
                        }
                    }
                    break;
            }
            
            ctx.restore();
        }
        
        // Add connecting paths/roads between some structures
        if (numStructures > 2) {
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            
            // Connect pad center to nearby structures
            for (let i = 0; i < Math.min(2, numStructures); i++) {
                const angle = seededRandom(i + 200) * Math.PI * 2;
                const distance = 40 + seededRandom(i + 210) * 40;
                const structureWorldX = centerX + Math.cos(angle) * distance;
                const structureX = structureWorldX - gameState.cameraX;
                const structureTerrainHeight = getTerrainHeightAt(structureWorldX);
                const structureY = structureTerrainHeight - 2;
                
                if (structureX > -50 && structureX < canvas.width + 50) {
                    ctx.beginPath();
                    ctx.moveTo(baseScreenX, padY - 2);
                    ctx.lineTo(structureX, structureY);
                    ctx.stroke();
                }
            }
            
            ctx.setLineDash([]); // Reset line dash
        }
        
        ctx.restore();
    });
}

function drawPickups() {
    gameState.pickups.forEach(pickup => {
        if (!pickup.collected) {
            const pickupScreenX = pickup.x - gameState.cameraX;
            const bobbing = Math.sin(pickup.bobOffset) * 3; // Bobbing motion
            const pickupY = pickup.y + bobbing;
            
            if (pickup.type === 'upgradedLegs') {
                // Draw upgraded legs pickup
                const glowIntensity = 0.5 + 0.5 * Math.sin(pickup.glow);
                
                ctx.save();
                ctx.translate(pickupScreenX, pickupY);
                
                // Glow effect
                ctx.shadowColor = '#ffa500';
                ctx.shadowBlur = 15 * glowIntensity;
                
                // Draw gear/wrench icon
                ctx.strokeStyle = '#ffa500';
                ctx.fillStyle = 'rgba(255, 165, 0, 0.6)';
                ctx.lineWidth = 2;
                
                // Outer gear shape
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const radius = i % 2 === 0 ? 12 : 8;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                
                // Inner circle
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Label
                ctx.shadowBlur = 5;
                ctx.fillStyle = '#ffa500';
                ctx.font = '10px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('LEGS', 0, 25);
                
                ctx.restore();
                ctx.shadowBlur = 0;
            } else if (pickup.type === 'fuelEfficiency') {
                // Draw fuel efficiency pickup
                const glowIntensity = 0.5 + 0.5 * Math.sin(pickup.glow);
                
                ctx.save();
                ctx.translate(pickupScreenX, pickupY);
                
                // Glow effect
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 15 * glowIntensity;
                
                // Draw battery icon
                ctx.strokeStyle = '#00ffff';
                ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
                ctx.lineWidth = 2;
                
                // Battery body
                ctx.beginPath();
                ctx.rect(-8, -6, 16, 12);
                ctx.fill();
                ctx.stroke();
                
                // Battery terminal
                ctx.beginPath();
                ctx.rect(8, -3, 3, 6);
                ctx.fill();
                ctx.stroke();
                
                // Battery charge indicator bars
                ctx.fillStyle = '#00ffff';
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(-6 + i * 4, -3, 2, 6);
                }
                
                // Label
                ctx.shadowBlur = 5;
                ctx.fillStyle = '#00ffff';
                ctx.font = '9px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('FUEL+', 0, 25);
                
                ctx.restore();
                ctx.shadowBlur = 0;
            } else if (pickup.type === 'pickupAttractor') {
                // Draw pickup attractor with rainbow effect
                const glowIntensity = 0.5 + 0.5 * Math.sin(pickup.glow);
                
                ctx.save();
                ctx.translate(pickupScreenX, pickupY);
                
                // Update rainbow hue for animation
                pickup.rainbowHue = (pickup.rainbowHue + 2) % 360;
                
                // Create rainbow glow effect
                const rainbowColor = `hsl(${pickup.rainbowHue}, 100%, 50%)`;
                ctx.shadowColor = rainbowColor;
                ctx.shadowBlur = 20 * glowIntensity;
                
                // Draw magnet/attractor icon
                ctx.strokeStyle = rainbowColor;
                ctx.fillStyle = `hsla(${pickup.rainbowHue}, 100%, 50%, 0.6)`;
                ctx.lineWidth = 2;
                
                // Magnet horseshoe shape
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI, false); // Horseshoe arc
                ctx.stroke();
                
                // Magnet poles
                ctx.beginPath();
                ctx.moveTo(-10, 0);
                ctx.lineTo(-10, 8);
                ctx.moveTo(10, 0);
                ctx.lineTo(10, 8);
                ctx.stroke();
                
                // Attraction field lines (animated)
                ctx.lineWidth = 1;
                const fieldIntensity = 0.3 + 0.3 * Math.sin(pickup.glow * 2);
                ctx.globalAlpha = fieldIntensity;
                
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const radius = 15 + 5 * Math.sin(pickup.glow + i);
                    const endX = Math.cos(angle) * radius;
                    const endY = Math.sin(angle) * radius;
                    
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
                
                ctx.globalAlpha = 1;
                
                // Label with rainbow effect
                ctx.shadowBlur = 8;
                ctx.fillStyle = rainbowColor;
                ctx.font = '9px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('MAGNET', 0, 25);
                
                ctx.restore();
                ctx.shadowBlur = 0;
            }
        }
    });
}

function drawLander() {
    const lander = gameState.lander;
    ctx.save();
    ctx.translate(lander.x - gameState.cameraX, lander.y);
    ctx.rotate(lander.angle);
    
    // Lander body with neon effect
    ctx.strokeStyle = '#ff00ff';
    ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 8;
    
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(-8, 5);
    ctx.lineTo(-5, 15);
    ctx.lineTo(5, 15);
    ctx.lineTo(8, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Landing legs
    if (lander.upgradedLegs) {
        // Upgraded legs - thicker, longer, and orange colored
        ctx.strokeStyle = '#ffa500';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffa500';
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        // Left leg
        ctx.moveTo(-5, 10);
        ctx.lineTo(-8, 12);
        ctx.lineTo(-15, 18);
        ctx.moveTo(-8, 12);
        ctx.lineTo(-10, 18);
        // Right leg
        ctx.moveTo(5, 10);
        ctx.lineTo(8, 12);
        ctx.lineTo(15, 18);
        ctx.moveTo(8, 12);
        ctx.lineTo(10, 18);
        // Landing pads
        ctx.moveTo(-16, 18);
        ctx.lineTo(-9, 18);
        ctx.moveTo(9, 18);
        ctx.lineTo(16, 18);
        ctx.stroke();
        
        // Reset stroke style
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
    } else {
        // Normal legs
        ctx.beginPath();
        ctx.moveTo(-5, 10);
        ctx.lineTo(-12, 15);
        ctx.moveTo(5, 10);
        ctx.lineTo(12, 15);
        ctx.stroke();
    }
    
    ctx.restore();
    
    // Draw fuel progress bar above lander (in world space, not rotated with lander)
    const barWidth = 30;  // Reduced from 40 to 30
    const barHeight = 3;  // Reduced from 4 to 3
    const barX = lander.x - gameState.cameraX - barWidth / 2;
    const barY = lander.y - 45; // Increased distance from -30 to -45 pixels above the lander
    
    // Background bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
    
    // Fuel bar color based on fuel level
    const fuelPercent = Math.max(0, lander.fuel) / 100;
    let barColor;
    if (fuelPercent > 0.6) {
        barColor = '#00ff00'; // Green
    } else if (fuelPercent > 0.3) {
        barColor = '#ffff00'; // Yellow
    } else {
        barColor = '#ff0000'; // Red
    }
    
    // Fuel bar with glow effect
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 5;
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barWidth * fuelPercent, barHeight);
    
    // Bar outline
    ctx.shadowBlur = 0;
    ctx.strokeStyle = barColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Optional: Show fuel percentage text next to the bar
    ctx.fillStyle = barColor;
    ctx.font = '10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(lander.fuel)}%`, barX + barWidth / 2, barY - 3);
    
    ctx.shadowBlur = 0;
}

function drawParticles() {
    gameState.particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
        const size = p.size * alpha; // Particles shrink as they fade
        ctx.fillRect(p.x - gameState.cameraX - size/2, p.y - size/2, size, size);
    });
}

function drawThrustEffect() {
    if (keys.ArrowUp && gameState.lander.fuel > 0 && !gameState.lander.landed) {
        const lander = gameState.lander;
        const thrustLength = 20 + Math.random() * 10;
        
        ctx.save();
        ctx.translate(lander.x - gameState.cameraX, lander.y);
        ctx.rotate(lander.angle);
        
        const thrustGradient = ctx.createLinearGradient(0, 15, 0, 15 + thrustLength);
        thrustGradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
        thrustGradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.6)');
        thrustGradient.addColorStop(1, 'rgba(255, 255, 100, 0.0)');
        
        ctx.fillStyle = thrustGradient;
        ctx.beginPath();
        ctx.moveTo(-3, 15);
        ctx.lineTo(3, 15);
        ctx.lineTo(0, 15 + thrustLength);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // Thrust particles
        if (Math.random() < 0.3) {
            const thrustX = lander.x + Math.sin(lander.angle) * 15;
            const thrustY = lander.y + Math.cos(lander.angle) * 15;
            createParticle(
                thrustX + (Math.random() - 0.5) * 6,
                thrustY + (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 2 + lander.vx * 0.5,
                Math.random() * 2 + lander.vy * 0.5,
                `hsl(${Math.random() * 60 + 15}, 100%, 60%)`,
                15
            );
        }
    }
}

function updateUI() {
    document.getElementById('fuel').textContent = Math.floor(gameState.lander.fuel);
    const speed = Math.sqrt(gameState.lander.vx ** 2 + gameState.lander.vy ** 2);
    document.getElementById('speed').textContent = speed.toFixed(1);
    document.getElementById('pads').textContent = gameState.visitedPads.size;
    document.getElementById('time').textContent = Math.floor((Date.now() - gameState.startTime) / 1000);
    
    // Update personal best
    const currentScore = gameState.visitedPads.size;
    const displayBest = Math.max(multiplayer.personalBest || 0, currentScore);
    document.getElementById('personalBest').textContent = displayBest;
    
    // Update ghost count
    const ghostCount = multiplayer && multiplayer.otherPlayers ? multiplayer.otherPlayers.size : 0;
    document.getElementById('ghostCount').textContent = ghostCount;
    
    // Update upgrades display
    const upgradesElement = document.getElementById('upgrades');
    if (gameState.lander.upgradedLegs) {
        upgradesElement.style.display = 'block';
    } else {
        upgradesElement.style.display = 'none';
    }
    
    // Update fuel efficiency display
    const fuelEfficiencyElement = document.getElementById('fuelEfficiency');
    if (gameState.fuelEfficiencyActive) {
        fuelEfficiencyElement.style.display = 'block';
        const remainingSeconds = Math.ceil(gameState.fuelEfficiencyTimer / 60); // Convert frames to seconds
        document.getElementById('fuelEfficiencyTimer').textContent = remainingSeconds;
    } else {
        fuelEfficiencyElement.style.display = 'none';
    }
    
    // Update pickup attractor display
    const pickupAttractorElement = document.getElementById('pickupAttractor');
    if (gameState.pickupAttractorActive) {
        pickupAttractorElement.style.display = 'block';
        const remainingSeconds = Math.ceil(gameState.pickupAttractorTimer / 60); // Convert frames to seconds
        document.getElementById('pickupAttractorTimer').textContent = remainingSeconds;
    } else {
        pickupAttractorElement.style.display = 'none';
    }
}

function drawAttractionField() {
    const lander = gameState.lander;
    const time = Date.now() * 0.003;
    
    ctx.save();
    ctx.translate(lander.x - gameState.cameraX, lander.y);
    
    // Draw attraction field ring with rainbow effect
    const numRings = 3;
    for (let ring = 0; ring < numRings; ring++) {
        const radius = gameState.pickupAttractorRange * (0.7 + ring * 0.15);
        const alpha = 0.15 - ring * 0.04;
        const hue = (time * 60 + ring * 120) % 360;
        
        ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.restore();
    ctx.shadowBlur = 0;
}

// Draw ghost players (other multiplayer players)
function drawGhostPlayers() {
    if (!multiplayer || !multiplayer.otherPlayers) return;
    
    const now = Date.now();
    const fadeOutTime = 5000; // Fade out players after 5 seconds of no updates
    
    multiplayer.otherPlayers.forEach((player, playerId) => {
        // Check if player data is recent enough
        const timeSinceUpdate = now - player.lastUpdated.getTime();
        if (timeSinceUpdate > fadeOutTime) {
            // Remove stale players
            multiplayer.otherPlayers.delete(playerId);
            return;
        }
        
        // Calculate fade-out based on how long since last update
        const fadeAlpha = Math.max(0, 1 - (timeSinceUpdate / fadeOutTime));
        if (fadeAlpha <= 0) return;
        
        // Screen position
        const screenX = player.x - gameState.cameraX;
        const screenY = player.y;
        
        // Skip if off-screen (with some margin)
        if (screenX < -100 || screenX > canvas.width + 100) return;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(player.angle);
        
        // Ghost effect - semi-transparent with unique color
        const hue = Math.abs(playerId.split('_')[1]?.charCodeAt(0) || 0) * 37 % 360;
        const ghostColor = `hsla(${hue}, 70%, 60%, ${0.6 * fadeAlpha})`;
        const glowColor = `hsl(${hue}, 70%, 60%)`;
        
        ctx.strokeStyle = ghostColor;
        ctx.fillStyle = ghostColor.replace('0.6', '0.2');
        ctx.lineWidth = 2;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8 * fadeAlpha;
        
        // Draw ghost lander body
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(-8, 5);
        ctx.lineTo(-5, 15);
        ctx.lineTo(5, 15);
        ctx.lineTo(8, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Landing legs (simplified)
        ctx.beginPath();
        ctx.moveTo(-5, 10);
        ctx.lineTo(-12, 15);
        ctx.moveTo(5, 10);
        ctx.lineTo(12, 15);
        ctx.stroke();
        
        // Draw thrust effect if thrusters are active
        if (player.thrustersActive && fadeAlpha > 0.3) {
            const thrustLength = 15 + Math.random() * 8;
            const thrustAlpha = 0.4 * fadeAlpha;
            
            const thrustGradient = ctx.createLinearGradient(0, 15, 0, 15 + thrustLength);
            thrustGradient.addColorStop(0, `hsla(${hue + 30}, 80%, 70%, ${thrustAlpha})`);
            thrustGradient.addColorStop(0.5, `hsla(${hue + 60}, 90%, 80%, ${thrustAlpha * 0.7})`);
            thrustGradient.addColorStop(1, `hsla(${hue + 90}, 100%, 90%, 0)`);
            
            ctx.fillStyle = thrustGradient;
            ctx.beginPath();
            ctx.moveTo(-2, 15);
            ctx.lineTo(2, 15);
            ctx.lineTo(0, 15 + thrustLength);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
        
        // Draw player name above the ghost
        if (fadeAlpha > 0.5) {
            ctx.save();
            ctx.fillStyle = `hsla(${hue}, 70%, 80%, ${fadeAlpha})`;
            ctx.font = '12px Courier New';
            ctx.textAlign = 'center';
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 3;
            ctx.fillText(player.name || 'Ghost', screenX, screenY - 25);
            ctx.restore();
        }
        
        // Draw velocity trail for moving ghosts
        const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        if (speed > 1 && fadeAlpha > 0.4) {
            const trailLength = Math.min(speed * 3, 30);
            const trailX = screenX - player.vx * 2;
            const trailY = screenY - player.vy * 2;
            
            ctx.save();
            ctx.strokeStyle = `hsla(${hue}, 50%, 70%, ${0.3 * fadeAlpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(trailX, trailY);
            ctx.stroke();
            ctx.restore();
        }
    });
    
    ctx.shadowBlur = 0;
}

// Update leaderboards
async function updateLeaderboards() {
    if (!gameStarted) return;
    
    // Update player identity display
    document.getElementById('currentPlayerName').textContent = multiplayer.playerName || 'Loading...';
    
    try {
        // Get current session leaderboard
        const currentLeaderboard = await getLeaderboard(5);
        const currentScoresDiv = document.getElementById('currentScores');
        currentScoresDiv.innerHTML = '';
        
        currentLeaderboard.forEach((entry, index) => {
            const div = document.createElement('div');
            div.style.marginBottom = '2px';
            div.style.color = index === 0 ? '#ffff00' : index === 1 ? '#ffffff' : index === 2 ? '#ff8800' : '#aaaaaa';
            
            const isCurrentPlayer = entry.player_id === multiplayer.playerId;
            const playerName = isCurrentPlayer ? 'YOU' : (entry.player_name || 'Anonymous');
            div.innerHTML = `${index + 1}. ${playerName}: ${entry.best_score}`;
            
            if (isCurrentPlayer) {
                div.style.fontWeight = 'bold';
                div.style.textShadow = '0 0 5px #00ff00';
            }
            
            currentScoresDiv.appendChild(div);
        });
        
        // Get all-time high scores
        const allTimeScores = await getHighScores(5);
        const allTimeScoresDiv = document.getElementById('allTimeScores');
        allTimeScoresDiv.innerHTML = '';
        
        allTimeScores.forEach((entry, index) => {
            const div = document.createElement('div');
            div.style.marginBottom = '2px';
            div.style.color = index === 0 ? '#ffff00' : index === 1 ? '#ffffff' : index === 2 ? '#ff8800' : '#aaaaaa';
            
            const isCurrentPlayer = entry.player_id === multiplayer.playerId;
            const playerName = isCurrentPlayer ? 'YOU' : (entry.player_name || 'Anonymous');
            div.innerHTML = `${index + 1}. ${playerName}: ${entry.score}`;
            
            if (isCurrentPlayer) {
                div.style.fontWeight = 'bold';
                div.style.textShadow = '0 0 5px #00ff00';
            }
            
            allTimeScoresDiv.appendChild(div);
        });
        
    } catch (error) {
        console.error('Error updating leaderboards:', error);
    }
}

// Change player name
function changePlayerName() {
    const nameInput = document.getElementById('nameInput');
    const changeButton = document.getElementById('changeName');
    const currentNameDiv = document.getElementById('currentPlayerName');
    
    if (nameInput.style.display === 'none') {
        // Show input field
        nameInput.style.display = 'block';
        nameInput.value = multiplayer.playerName;
        nameInput.focus();
        nameInput.select();
        changeButton.textContent = 'SAVE';
    } else {
        // Save new name
        const newName = nameInput.value.trim();
        if (newName && newName.length > 0 && newName !== multiplayer.playerName) {
            multiplayer.playerName = newName;
            localStorage.setItem('neonLunarLander_playerName', newName);
            currentNameDiv.textContent = newName;
        }
        
        nameInput.style.display = 'none';
        changeButton.textContent = 'CHANGE NAME';
        
        // Update leaderboards to reflect name change
        updateLeaderboards();
    }
}

// Handle Enter key in name input
function handleNameInputKeypress(e) {
    if (e.key === 'Enter') {
        changePlayerName();
    } else if (e.key === 'Escape') {
        document.getElementById('nameInput').style.display = 'none';
        document.getElementById('changeName').textContent = 'CHANGE NAME';
    }
}

// Toggle leaderboard visibility
function toggleLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');
    const button = document.getElementById('toggleLeaderboard');
    
    if (leaderboard.style.display === 'none') {
        leaderboard.style.display = 'block';
        button.textContent = 'HIDE';
        updateLeaderboards();
    } else {
        leaderboard.style.display = 'none';
        button.textContent = 'SHOW';
    }
}

function drawLandingSafetyHUD() {
    const lander = gameState.lander;
    
    // Only show HUD when lander is not landed and not crashed
    if (lander.landed || gameState.crashed || gameState.gameWon) return;
    
    // Check if lander is near any landing pad
    let nearestPad = null;
    let minDistance = Infinity;
    const proximityThreshold = 150; // Show HUD when within this distance of a pad
    
    for (const pad of gameState.landingPads) {
        const padCenterX = pad.x + pad.width / 2;
        const distance = Math.sqrt(
            Math.pow(lander.x - padCenterX, 2) + 
            Math.pow(lander.y - pad.y, 2)
        );
        
        if (distance < proximityThreshold && distance < minDistance) {
            minDistance = distance;
            nearestPad = pad;
        }
    }
    
    // Only show HUD if near a pad
    if (!nearestPad) return;
    
    // Determine safe landing parameters based on upgraded legs
    const maxAngle = lander.upgradedLegs ? 1.2 : 0.5;
    const currentAngle = Math.abs(lander.angle);
    const isSafeAngle = currentAngle < maxAngle;
    
    // Calculate HUD position (in screen space)
    const hudX = lander.x - gameState.cameraX;
    const hudY = lander.y;
    const hudRadius = 35;
    
    ctx.save();
    ctx.translate(hudX, hudY);
    
    // Draw outer ring with animated pulse
    const time = Date.now() * 0.005;
    const pulseIntensity = 0.8 + 0.2 * Math.sin(time);
    
    // Ring color based on safety
    const ringColor = isSafeAngle ? '#00ff00' : '#ff4444';
    const ringAlpha = isSafeAngle ? 0.3 : 0.4;
    
    ctx.strokeStyle = `rgba(${isSafeAngle ? '0, 255, 0' : '255, 68, 68'}, ${ringAlpha * pulseIntensity})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = ringColor;
    ctx.shadowBlur = 4;
    
    ctx.beginPath();
    ctx.arc(0, 0, hudRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw angle indicator arcs
    const safeArcStart = -Math.PI / 2 - maxAngle;
    const safeArcEnd = -Math.PI / 2 + maxAngle;
    
    // Safe zone arc (green)
    ctx.strokeStyle = `rgba(0, 255, 0, 0.2)`;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 2;
    ctx.beginPath();
    ctx.arc(0, 0, hudRadius - 5, safeArcStart, safeArcEnd);
    ctx.stroke();
    
    // Current angle indicator (needle)
    const needleAngle = -Math.PI / 2 + lander.angle;
    const needleLength = hudRadius - 3;
    
    ctx.strokeStyle = isSafeAngle ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 3;
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
        Math.cos(needleAngle) * needleLength,
        Math.sin(needleAngle) * needleLength
    );
    ctx.stroke();
    
    // Draw center dot
    ctx.fillStyle = isSafeAngle ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    ctx.shadowBlur = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw status text
    ctx.shadowBlur = 0;
    ctx.fillStyle = isSafeAngle ? '#00ff00' : '#ff4444';
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'center';
    
    if (lander.upgradedLegs) {
        ctx.font = '10px Courier New';
        ctx.fillStyle = 'rgba(255, 165, 0, 0.5)';
        ctx.fillText('UPGRADED LEGS', 0, hudRadius + 20);
    }
    
    // Draw angle value
    ctx.font = '10px Courier New';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`${(Math.abs(lander.angle) * 180 / Math.PI).toFixed(1)}°`, 0, -hudRadius - 10);
    ctx.fillText(`Max: ${(maxAngle * 180 / Math.PI).toFixed(1)}°`, 0, -hudRadius + 5);
    
    ctx.restore();
    ctx.shadowBlur = 0;
} 