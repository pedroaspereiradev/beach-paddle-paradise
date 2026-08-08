// ==========================================
// --- POWER-UPS ---
// ==========================================
// A single power-up orb spawns periodically during a rally. Whichever paddle
// last touched the ball (Ball.lastHitBy) gets the benefit if the ball then
// touches the orb - GROW makes that paddle 50% taller for a few seconds,
// SLOW cuts the ball's current speed. Only one orb is active at a time.

const POWERUP_TYPES = ['GROW', 'SLOW'];
const POWERUP_RADIUS = 18;
const POWERUP_SPAWN_INTERVAL = 480; // ~8s at 60fps between orbs
const POWERUP_GROW_DURATION = 360; // ~6s at 60fps
const POWERUP_GROW_MULTIPLIER = 1.5;
const POWERUP_SLOW_FACTOR = 0.55;

let activePowerUp = null;
let powerUpSpawnTimer = POWERUP_SPAWN_INTERVAL;

class PowerUp {
    constructor(type) {
        this.type = type;
        this.radius = POWERUP_RADIUS;
        this.x = random(width * 0.3, width * 0.7);
        this.y = random(70, height - 70);
        this.spawnFrame = frameCount;
    }

    draw() {
        // Gentle pulse so it reads as "alive" against the static background
        const pulse = 1 + 0.15 * sin((frameCount - this.spawnFrame) * 0.12);
        const baseColor = this.type === 'GROW' ? [120, 220, 130] : [120, 190, 255];

        push();
        noStroke();
        fill(baseColor[0], baseColor[1], baseColor[2], 220);
        circle(this.x, this.y, this.radius * 2 * pulse);

        noFill();
        stroke(255, 255, 255, 160);
        strokeWeight(2);
        circle(this.x, this.y, this.radius * 2 * pulse);
        pop();
    }
}

function spawnPowerUp() {
    activePowerUp = new PowerUp(random(POWERUP_TYPES));
}

// Applies the effect to whichever side last hit the ball (defaults to the
// player if the ball hasn't been hit by anyone yet this rally).
function applyPowerUp(powerUp) {
    const beneficiary = ball.lastHitBy === 'computer' ? computer : player;

    if (powerUp.type === 'GROW') {
        beneficiary.applyGrow(POWERUP_GROW_DURATION);
    } else if (powerUp.type === 'SLOW') {
        ball.speedX *= POWERUP_SLOW_FACTOR;
        ball.speedY *= POWERUP_SLOW_FACTOR;
    }
}

function checkPowerUpCollision() {
    if (!activePowerUp) return;

    const d = dist(ball.x, ball.y, activePowerUp.x, activePowerUp.y);
    if (d < ball.radius + activePowerUp.radius) {
        const colorPalette = activePowerUp.type === 'GROW' ? [[120, 220, 130]] : [[120, 190, 255]];
        spawnParticles(activePowerUp.x, activePowerUp.y, 12, colorPalette);

        applyPowerUp(activePowerUp);
        activePowerUp = null;
        powerUpSpawnTimer = POWERUP_SPAWN_INTERVAL;
    }
}

// Advances the spawn countdown (or checks collision if an orb is already out).
// Call only while gameplay is actively running, same as the ball/paddle updates.
function updatePowerUp() {
    if (activePowerUp) {
        checkPowerUpCollision();
        return;
    }

    powerUpSpawnTimer--;
    if (powerUpSpawnTimer <= 0) spawnPowerUp();
}

function drawPowerUp() {
    if (activePowerUp) activePowerUp.draw();
}

// Called at the start of every match; a stray orb between rallies is already
// cleared by Ball.reset(), so this only needs to undo a lingering GROW buff.
function resetPowerUps() {
    player.growFramesLeft = 0;
    player.setSize(player.baseHeight);
    computer.growFramesLeft = 0;
    computer.setSize(computer.baseHeight);
}
