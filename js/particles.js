// ==========================================
// --- PARTICLE EFFECTS ---
// ==========================================
// Lightweight visual feedback for paddle hits (a small splash) and scoring
// (a confetti burst). Purely cosmetic - never affects gameplay logic.

const SPLASH_COLORS = [[255, 255, 255], [200, 235, 255], [150, 210, 245]];
const CONFETTI_COLORS = [[255, 214, 92], [255, 138, 101], [110, 220, 190], [255, 255, 255], [120, 190, 255]];

let particles = [];

class Particle {
    constructor(x, y, rgb) {
        this.x = x;
        this.y = y;
        this.vx = random(-3, 3);
        this.vy = random(-4, -1); // Upward bias so bursts feel like they're popping
        this.rgb = rgb;
        this.size = random(3, 6);
        this.life = 30; // Frames until fully faded
        this.maxLife = this.life;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15; // Light gravity pulls the burst back down
        this.life--;
    }

    isDead() {
        return this.life <= 0;
    }

    draw() {
        const alpha = map(this.life, 0, this.maxLife, 0, 255);
        push();
        noStroke();
        fill(this.rgb[0], this.rgb[1], this.rgb[2], alpha);
        circle(this.x, this.y, this.size);
        pop();
    }
}

function spawnParticles(x, y, count, colorPalette) {
    for (let i = 0; i < count; i++) {
        const rgb = colorPalette[floor(random(colorPalette.length))];
        particles.push(new Particle(x, y, rgb));
    }
}

// Advances physics and prunes dead particles; call only while gameplay is running.
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].isDead()) particles.splice(i, 1);
    }
}

// Rendering is separate from update() so particles stay visible (but frozen) while paused.
function drawParticles() {
    for (const particle of particles) particle.draw();
}

function resetParticles() {
    particles = [];
}
