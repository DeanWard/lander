// Game constants
const CHUNK_WIDTH = 1200;
const PAD_SPACING = 600;
const PAD_WIDTH = 80;
const TERRAIN_SEGMENT = 20;

// Global variables
let gameStarted = false;
let generatedChunks = new Set();
let worldEndX = 0;

// Game state object
let gameState = {
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
    startTime: 0,
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
    fuelEfficiencyMultiplier: 0.5, // 50% of normal consumption (0.1 instead of 0.2)
    pickupAttractorActive: false,
    pickupAttractorTimer: 0,
    pickupAttractorRange: 120 // Attraction radius in pixels
};

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas function
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Initialize canvas
resizeCanvas();

// Listen for window resize
window.addEventListener('resize', function() {
    resizeCanvas();
    if (gameStarted) {
        generateTerrain();
        generateLandingPads();
    }
});

// Particle creation utility
function createParticle(x, y, vx, vy, color, life) {
    gameState.particles.push({
        x, y, vx, vy, color, life, maxLife: life, size: 1 + Math.random() * 3
    });
}

// Update particles
function updateParticles() {
    gameState.particles = gameState.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.life--;
        return p.life > 0;
    });
} 