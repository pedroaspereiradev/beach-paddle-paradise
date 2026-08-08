// ==========================================
// --- GAME ENTITIES (CLASSES) ---
// ==========================================

/**
 * Base Paddle class for shared logic between Player and AI.
 */
class Paddle {
    constructor(x, imageRef) {
        this.x = x;

        // Scaled up by 1.4x (original was 10x60)
        this.width = 14;
        this.height = 84;

        // Centers the paddle vertically
        this.y = height / 2 - this.height / 2;
        this.img = imageRef;
    }

    // Prevents the paddle from moving off-screen
    constrainBounds() {
        this.y = constrain(this.y, 0, height - this.height);
    }

    draw() {
        if (this.img) {
            image(this.img, this.x, this.y, this.width, this.height);
        } else {
            // Fallback just in case the image fails to load
            fill(255); noStroke(); rect(this.x, this.y, this.width, this.height);
        }
    }
}

// Pixels moved per frame when steering with the keyboard instead of the mouse
const PLAYER_KEYBOARD_SPEED = 7;

/**
 * Player 1 Paddle. In single-player, controlled by the mouse Y position, or
 * the Up/Down arrow keys and W/S as an alternative - keyboard input takes
 * over for the frame it's held so the two schemes never fight over the
 * paddle's position. In two-player mode the mouse is disabled and only W/S
 * work, since Up/Down are reserved for Player 2.
 */
class PlayerPaddle extends Paddle {
    update() {
        if (gameState.twoPlayerMode) {
            if (keyIsDown(87)) this.y -= PLAYER_KEYBOARD_SPEED; // W
            if (keyIsDown(83)) this.y += PLAYER_KEYBOARD_SPEED; // S
        } else {
            const movingUp = keyIsDown(UP_ARROW) || keyIsDown(87);
            const movingDown = keyIsDown(DOWN_ARROW) || keyIsDown(83);

            if (movingUp || movingDown) {
                if (movingUp) this.y -= PLAYER_KEYBOARD_SPEED;
                if (movingDown) this.y += PLAYER_KEYBOARD_SPEED;
            } else {
                this.y = mouseY - this.height / 2;
            }
        }
        this.constrainBounds();
    }
}

/**
 * Right-side Paddle. Doubles as either the AI opponent (single-player,
 * tracking the ball with a constrained max speed) or Player 2 (two-player
 * mode, controlled with the Up/Down arrow keys) depending on gameState.twoPlayerMode.
 */
class OpponentPaddle extends Paddle {
    update(ball) {
        if (gameState.twoPlayerMode) {
            if (keyIsDown(UP_ARROW)) this.y -= PLAYER_KEYBOARD_SPEED;
            if (keyIsDown(DOWN_ARROW)) this.y += PLAYER_KEYBOARD_SPEED;
        } else {
            const { reaction, maxSpeed } = AI_DIFFICULTY[settings.aiDifficulty];
            const targetY = ball.y - this.height / 2; // AI tries to hit with the center of the paddle
            const distance = targetY - this.y;

            // Limits the AI speed to make it beatable, tuned by the Options difficulty setting
            if (abs(distance) > 2) this.y += constrain(distance * reaction, -maxSpeed, maxSpeed);
        }
        this.constrainBounds();
    }
}

// Caps how fast rallies can get; without this the 5%-per-hit growth in
// collideWithPaddle() compounds indefinitely and long volleys become unplayable.
const MAX_BALL_SPEED = 14;

/**
 * The Ball class handles movement, wall bouncing, and paddle collisions.
 */
class Ball {
    constructor(diameter) {
        this.diameter = diameter;
        this.radius = this.diameter / 2;
        this.reset();
    }

    // Centers the ball and shoots it in a random direction
    reset() {
        this.x = width / 2;
        this.y = height / 2;
        this.speedX = random([-5, 5]); // Guarantees it doesn't move perfectly vertical
        this.speedY = random(-4, 4);
        this.angle = 0; // Used for rotation rendering
    }

    /**
     * Calculates AABB collision (Axis-Aligned Bounding Box) and dynamic bounce angles.
     */
    collideWithPaddle(paddle) {
        const isLeft = paddle.x < width / 2;
        const paddleRight = paddle.x + paddle.width;
        const paddleBottom = paddle.y + paddle.height;

        // Check bounds
        const isWithinVert = this.y + this.radius >= paddle.y && this.y - this.radius <= paddleBottom;
        const isWithinHoriz = isLeft
            ? this.x - this.radius <= paddleRight && this.x + this.radius >= paddle.x
            : this.x + this.radius >= paddle.x && this.x - this.radius <= paddleRight;

        // Only collide if moving towards the paddle (prevents getting stuck inside)
        const isMovingToward = isLeft ? this.speedX < 0 : this.speedX > 0;

        if (isWithinVert && isWithinHoriz && isMovingToward) {
            // Calculate where the ball hit the paddle relative to its center (-1 to 1)
            const relIntersectY = this.y - (paddle.y + paddle.height / 2);
            // 0.75 is the max bounce angle in radians (about 45 degrees)
            const bounceAngle = (relIntersectY / (paddle.height / 2)) * 0.75;

            // Push ball out of paddle to prevent clipping
            this.x = isLeft ? paddleRight + this.radius : paddle.x - this.radius;

            // Slightly increase speed on every hit for progression, up to a playable cap
            const speed = Math.min(Math.sqrt(this.speedX ** 2 + this.speedY ** 2) * 1.05, MAX_BALL_SPEED);

            // Calculate new velocity vectors based on the bounce angle
            this.speedX = (isLeft ? 1 : -1) * speed * Math.cos(bounceAngle);
            this.speedY = speed * Math.sin(bounceAngle);
            this.angle = atan2(this.speedY, this.speedX); // Adjust sprite rotation

            spawnParticles(this.x, this.y, 6, SPLASH_COLORS);
            playSound(assets.bounceSound);
        }
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Rotate the ball sprite based on its actual speed
        this.angle += sqrt(this.speedX ** 2 + this.speedY ** 2) * 0.06;

        // Check for Left/Right bounds (Scoring)
        if (this.x + this.radius > width || this.x - this.radius < 0) {
            if (this.x + this.radius > width) {
                gameState.playerScore++;
                gameState.currentStreak++;
                gameState.longestStreakThisMatch = max(gameState.longestStreakThisMatch, gameState.currentStreak);
            } else {
                gameState.computerScore++;
                gameState.currentStreak = 0;
            }

            spawnParticles(this.x, this.y, 16, CONFETTI_COLORS);
            playSound(assets.pointSound);
            this.reset();
        }

        // Check for Top/Bottom bounds (Wall bouncing)
        if (this.y - this.radius < 0) {
            this.y = this.radius; this.speedY = abs(this.speedY);
        } else if (this.y + this.radius > height) {
            this.y = height - this.radius; this.speedY = -abs(this.speedY);
        }
    }

    draw() {
        if (assets.imageBall) {
            push(); translate(this.x, this.y); rotate(this.angle); imageMode(CENTER);
            image(assets.imageBall, 0, 0, this.diameter, this.diameter); pop();
        } else {
            fill(255); noStroke(); circle(this.x, this.y, this.diameter);
        }
    }
}
