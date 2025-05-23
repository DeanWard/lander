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
    
    if (!gameStarted) {
        return; // Don't render the rest if game hasn't started
    }
    
    // Draw terrain with neon glow
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    
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
    
    // Fill terrain with dark gradient
    const terrainGradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
    terrainGradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
    terrainGradient.addColorStop(1, 'rgba(0, 255, 255, 0.3)');
    ctx.fillStyle = terrainGradient;
    ctx.fill();
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    // Draw holographic forcefield at x=0
    drawForcefield();
    
    // Draw landing pads
    drawLandingPads();
    
    // Draw pickups
    drawPickups();
    
    // Draw lander
    drawLander();
    
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
    
    // Update UI
    updateUI();
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