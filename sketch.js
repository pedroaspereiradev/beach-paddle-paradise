// ==========================================
// --- GLOBAL STATE & ASSETS MANAGEMENT ---
// ==========================================

const assets = {}; // Stores all images and sounds loaded in preload()
const gameState = {
    // State Machine: Controls which screen is currently being rendered
    screen: 'START', // States: 'START', 'TRANSITION', 'COUNTDOWN', 'PLAYING', 'GAME_OVER'
    
    // Game variables
    playerScore: 0,
    computerScore: 0,
    
    // Time tracking variables
    startTime: 0,
    countdownStartTime: 0,
    transitionAlpha: 255, // Controls the opacity for fade-in/fade-out effects (0 to 255)
    
    // Pause system variables
    isPaused: false,
    pauseStartTime: 0 // Records the exact moment the game was paused to adjust the main timer later
};

// ==========================================
// --- CUSTOM PIXEL FONT DICTIONARY (3x5) ---
// ==========================================
// Represents characters as grids of 1s (filled pixel) and 0s (empty space).
// Drawn dynamically via code to ensure perfect pixel scaling without blur.

const pixelFont = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'],
    '-': ['000', '000', '111', '000', '000'], ':': ['000', '010', '000', '010', '000'],
    
    // Letters used for UI texts (Game Over, Pause)
    'P': ['111', '101', '111', '100', '100'], 'Y': ['101', '101', '111', '010', '010'], 
    'O': ['111', '101', '101', '101', '111'], 'U': ['101', '101', '101', '101', '111'], 
    'W': ['101', '101', '101', '111', '101'], 'I': ['111', '010', '010', '010', '111'], 
    'N': ['111', '111', '101', '101', '101'], 'L': ['100', '100', '100', '100', '111'], 
    'S': ['111', '100', '111', '001', '111'], 'E': ['111', '100', '111', '100', '111'], 
    'D': ['110', '101', '101', '101', '110'], 'R': ['110', '101', '110', '101', '101'], 
    'A': ['111', '101', '111', '101', '101'], '!': ['010', '010', '010', '000', '010'],

    // Play/Pause icons
    '>': ['100', '110', '111', '110', '100'], // Play
    '|': ['101', '101', '101', '101', '101']  // Pause
};

// ==========================================
// --- GAME ENTITIES (CLASSES) ---
// ==========================================

/**
 * Base Paddle class for shared logic between Player and AI.
 */
class Paddle {
    constructor(x, imageRef) {
        this.x = x;
        this.width = 10;
        this.height = 60;
        this.y = height / 2 - this.height / 2; // Centers the paddle vertically
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

/**
 * Player Paddle: Controlled by the mouse Y position.
 */
class PlayerPaddle extends Paddle {
    update() {
        this.y = mouseY - this.height / 2;
        this.constrainBounds();
    }
}

/**
 * AI Paddle: Tracks the ball with a constrained maximum speed.
 */
class ComputerPaddle extends Paddle {
    update(ball) {
        const targetY = ball.y - this.height / 2; // AI tries to hit with the center of the paddle
        const distance = targetY - this.y;
        
        // Limits the AI speed to make it beatable (max 4 pixels per frame)
        if (abs(distance) > 2) this.y += constrain(distance * 0.12, -4, 4);
        this.constrainBounds();
    }
}

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
            
            // Slightly increase speed on every hit for progression
            const speed = Math.sqrt(this.speedX ** 2 + this.speedY ** 2) * 1.05;
            
            // Calculate new velocity vectors based on the bounce angle
            this.speedX = (isLeft ? 1 : -1) * speed * Math.cos(bounceAngle);
            this.speedY = speed * Math.sin(bounceAngle);
            this.angle = atan2(this.speedY, this.speedX); // Adjust sprite rotation

            if (assets.bounceSound) assets.bounceSound.play();
        }
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Rotate the ball sprite based on its actual speed
        this.angle += sqrt(this.speedX ** 2 + this.speedY ** 2) * 0.06;

        // Check for Left/Right bounds (Scoring)
        if (this.x + this.radius > width || this.x - this.radius < 0) {
            if (this.x + this.radius > width) gameState.playerScore++;
            else gameState.computerScore++;
            
            if (assets.pointSound) assets.pointSound.play();
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

// ==========================================
// --- UI CLASSES (BUTTONS & HITBOXES) ---
// ==========================================

/**
 * Invisible clickable area placed over background images.
 */
class Hitbox {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.w = w; this.h = h;
    }
    isHovered() {
        return mouseX > this.x - this.w / 2 && mouseX < this.x + this.w / 2 && 
               mouseY > this.y - this.h / 2 && mouseY < this.y + this.h / 2;
    }
    draw() {
        // Draw hover feedback (semi-transparent white box) if hovered, not transitioning, and not paused
        if (this.isHovered() && gameState.transitionAlpha <= 0 && !gameState.isPaused) {
            push(); fill(255, 255, 255, 60); noStroke(); rectMode(CENTER);
            rect(this.x, this.y, this.w, this.h, 8); pop();
            cursor(HAND);
        }
    }
}

/**
 * Renders an image as a button with hover feedback.
 */
class ImageButton {
    constructor(x, y, w, h, imgRef) {
        this.x = x; this.y = y; this.w = w; this.h = h; this.img = imgRef;
    }
    isHovered() {
        return mouseX > this.x - this.w / 2 && mouseX < this.x + this.w / 2 && 
               mouseY > this.y - this.h / 2 && mouseY < this.y + this.h / 2;
    }
    draw() {
        if (this.isHovered()) {
            push(); fill(255, 255, 255, 60); noStroke(); rectMode(CENTER);
            rect(this.x, this.y, this.w + 10, this.h + 10, 8); pop();
            cursor(HAND);
        }
        if (this.img) {
            push(); imageMode(CENTER); image(this.img, this.x, this.y, this.w, this.h); pop();
        }
    }
}

/**
 * Pause/Play toggle button drawn entirely with code (p5.js primitives).
 */
/**
 * Pause/Play toggle button drawn using the custom pixel font system.
 */
class PausePlayButton {
    constructor(x, y, size) {
        this.x = x; this.y = y; this.size = size;
    }
    isHovered() {
        return mouseX > this.x - this.size / 2 && mouseX < this.x + this.size / 2 && 
               mouseY > this.y - this.size / 2 && mouseY < this.y + this.size / 2;
    }
    draw() {
        // Visual feedback for hover state (semi-transparent white overlay)
        if (this.isHovered()) {
            push(); fill(255, 255, 255, 60); noStroke(); rectMode(CENTER);
            rect(this.x, this.y, this.size, this.size, 6); pop();
            cursor(HAND);
        }
        
        // Define the character to draw based on the current pause state
        const iconChar = gameState.isPaused ? '>' : '|';
        const iconScale = 4; // Icon size
        
        // Calculate the offset to center the character on the button
        // The font has 3 blocks of width and 5 blocks of height
        const charWidth = 3 * iconScale;
        const charHeight = 5 * iconScale;
        const startX = this.x - charWidth / 2;
        const startY = this.y - charHeight / 2;
        
        // Draw the icon using our pixelated renderer with a black border!
        drawPixelCharWithBorder(iconChar, startX, startY, iconScale);
    }
}

// ==========================================
// --- GLOBALS & P5.JS LIFECYCLE ---
// ==========================================

let ball, player, computer;
let btnStartGame, btnOptions, btnReplay, btnPause;

function preload() {
    assets.imageBall = loadImage('assets/bola.png');
    assets.imageBackground = loadImage('assets/fundo.png');
    assets.imageRacketPlayer = loadImage('assets/raquete-player.png');
    assets.imageRacketComputer = loadImage('assets/raquete-ia.png');
    assets.imageStartScreen = loadImage('assets/tela-inicial.png');
    assets.imageReplay = loadImage('assets/botao-replay.png'); 
    assets.bounceSound = loadSound('assets/batida-bola.mp3');
    assets.pointSound = loadSound('assets/ponto.mp3');
}

function setup() {
    createCanvas(700, 400);
    
    ball = new Ball(40);
    player = new PlayerPaddle(30, assets.imageRacketPlayer);
    computer = new ComputerPaddle(width - 40, assets.imageRacketComputer);
    
    // Setup UI buttons
    btnStartGame = new Hitbox(260, 285, 160, 60); 
    btnOptions = new Hitbox(440, 285, 160, 60);
    btnReplay = new ImageButton(width / 2, height / 2 + 60, 160, 60, assets.imageReplay);
    btnPause = new PausePlayButton(width - 35, 35, 40); // Top-right corner
}

// The core game loop that delegates drawing based on the state machine
function draw() {
    cursor(ARROW); // Reset cursor every frame, hitboxes will set it to HAND if hovered

    if (gameState.screen === 'START') {
        drawStartScreen();
    } else if (gameState.screen === 'TRANSITION') {
        drawTransition();
    } else if (gameState.screen === 'COUNTDOWN') {
        drawCountdownScreen();
    } else if (gameState.screen === 'PLAYING') {
        drawGameScreen();
    } else if (gameState.screen === 'GAME_OVER') {
        drawGameOverScreen();
    }
}

function mousePressed() {
    // Handle clicks based on current state
    if (gameState.screen === 'START' && gameState.transitionAlpha <= 0) {
        if (btnStartGame.isHovered()) {
            gameState.screen = 'TRANSITION'; // Trigger fade-out
            if (assets.pointSound) assets.pointSound.play();
        }
    } else if (gameState.screen === 'PLAYING') {
        if (btnPause.isHovered()) {
            gameState.isPaused = !gameState.isPaused;
            
            if (gameState.isPaused) {
                // Save the exact timestamp the game was paused
                gameState.pauseStartTime = millis(); 
            } else {
                // Add the time spent paused to the overall startTime 
                // so the timer doesn't jump forward when unpaused.
                const timeSpentPaused = millis() - gameState.pauseStartTime;
                gameState.startTime += timeSpentPaused; 
            }
            if (assets.pointSound) assets.pointSound.play();
        }
    } else if (gameState.screen === 'GAME_OVER') {
        if (btnReplay.isHovered()) {
            gameState.screen = 'COUNTDOWN'; 
            gameState.countdownStartTime = millis();
            gameState.playerScore = 0;
            gameState.computerScore = 0;
            gameState.isPaused = false; // Ensure game doesn't restart paused
            if (assets.pointSound) assets.pointSound.play();
        }
    }
}

// ==========================================
// --- SCREEN RENDERERS ---
// ==========================================

function drawStartScreen() {
    if (assets.imageStartScreen) image(assets.imageStartScreen, 0, 0, width, height);
    else background(30); 

    btnStartGame.draw(); 
    btnOptions.draw();

    // Initial fade-in (black fading to transparent)
    if (gameState.transitionAlpha > 0) {
        fill(0, gameState.transitionAlpha); noStroke();
        rect(0, 0, width, height);
        gameState.transitionAlpha -= 5; 
    }
}

function drawTransition() {
    if (assets.imageStartScreen) image(assets.imageStartScreen, 0, 0, width, height);
    else background(30);

    // Fade-out to black before starting the game
    fill(0, gameState.transitionAlpha); noStroke();
    rect(0, 0, width, height);
    gameState.transitionAlpha += 10; 

    // Once fully black, move to the countdown screen and prep the board
    if (gameState.transitionAlpha >= 255) {
        gameState.screen = 'COUNTDOWN';
        gameState.countdownStartTime = millis();
        ball.reset(); 
        player.y = height / 2 - player.height / 2; 
        computer.y = height / 2 - computer.height / 2;
    }
}

function drawCountdownScreen() {
    drawGameEnvironment(); // Draw static background and paddles
    player.update(); // Allow player to position their paddle before start

    // Fade-in to reveal the game board
    if (gameState.transitionAlpha > 0) {
        fill(0, gameState.transitionAlpha); noStroke();
        rect(0, 0, width, height);
        gameState.transitionAlpha -= 10; 
    }

    // 3.. 2.. 1.. logic
    const elapsed = millis() - gameState.countdownStartTime;
    const timeLeft = 3 - floor(elapsed / 1000);

    if (timeLeft > 0) {
        drawTextCentered(timeLeft.toString(), width / 2, height / 2 - 25, 10);
    } else {
        // Countdown finished, transition to gameplay
        gameState.screen = 'PLAYING';
        gameState.startTime = millis(); // Anchor the 2-minute timer here
        ball.reset(); // Give the ball a random trajectory
    }
}

function drawGameScreen() {
    drawGameEnvironment();
    drawScoreboard();
    
    // Only update physics and logic if NOT paused
    if (!gameState.isPaused) {
        ball.update();
        ball.collideWithPaddle(player);
        ball.collideWithPaddle(computer);
        player.update();
        computer.update(ball);
    }

    handleTimer(); // Timer logic handles its own pause state internally
    
    // Pause Overlay Effect
    if (gameState.isPaused) {
        fill(0, 0, 0, 140); // Semi-transparent black overlay
        noStroke();
        rectMode(CORNER);
        rect(0, 0, width, height);
        
        drawTextCentered("PAUSED", width / 2, height / 2 - 25, 6);
    }

    // Draw pause button on top of everything
    btnPause.draw();
}

function drawGameOverScreen() {
    drawGameEnvironment();
    
    // Darken the background slightly to highlight UI
    fill(0, 160); noStroke(); rectMode(CORNER);
    rect(0, 0, width, height);

    // Determine Result Message
    let message = "DRAW!";
    if (gameState.playerScore > gameState.computerScore) message = "YOU WIN!";
    else if (gameState.computerScore > gameState.playerScore) message = "YOU LOSE!";

    drawTextCentered(message, width / 2, height / 2 - 60, 6);
    drawScoreboard(); 

    btnReplay.draw();
}

// Helper to draw the base game environment (Bg, Paddles, Ball)
function drawGameEnvironment() {
    if (assets.imageBackground) image(assets.imageBackground, 0, 0, width, height);
    else background(0);
    
    player.draw();
    computer.draw();
    ball.draw();
}

// ==========================================
// --- PIXEL TEXT & TIMER RENDERERS ---
// ==========================================

function drawScoreboard() {
    const scoreText = `${gameState.playerScore}-${gameState.computerScore}`;
    drawTextCentered(scoreText, width / 2, 15, 4);
}

function handleTimer() {
    // Calculate elapsed time, accounting for pauses
    let elapsedTime = millis() - gameState.startTime;
    
    // If paused, freeze the displayed time calculation
    if (gameState.isPaused) {
        elapsedTime = gameState.pauseStartTime - gameState.startTime;
    }

    const totalSeconds = floor(elapsedTime / 1000);
    
    // Check for 2-minute limit (only if not paused)
    if (totalSeconds >= 120 && !gameState.isPaused) {
        gameState.screen = 'GAME_OVER'; 
        return; 
    }
    
    // Format mm:ss and draw
    const minutes = floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    // nf() adds leading zeros (e.g., "02")
    drawTextCentered(`${nf(minutes, 2)}:${nf(seconds, 2)}`, width / 2, 45, 2);
}

/**
 * Calculates total width of a string and draws it perfectly centered at (cx, y).
 */
function drawTextCentered(text, cx, y, scale) {
    const charWidth = 3 * scale;
    const charSpacing = scale * 1.5;
    const totalWidth = text.length * charWidth + (text.length - 1) * charSpacing;
    let x = cx - totalWidth / 2;

    for (const char of text) {
        drawPixelCharWithBorder(char, x, y, scale);
        x += charWidth + charSpacing;
    }
}

/**
 * Renders a single character from the dictionary with a thick black outline.
 */
function drawPixelCharWithBorder(char, x, y, scale) {
    if (char === ' ') return; // Skip drawing spaces
    
    const pattern = pixelFont[char] || pixelFont['-'];
    const borderThickness = 1;
    noStroke();

    // 1. Draw the Outline (Background)
    // Achieved by drawing the character in black, offset by 1 unit in all directions
    fill(0);
    for (let dy = -borderThickness; dy <= borderThickness; dy++) {
        for (let dx = -borderThickness; dx <= borderThickness; dx++) {
            if (dx !== 0 || dy !== 0) renderPatternGrid(pattern, x + dx, y + dy, scale);
        }
    }
    
    // 2. Draw the inner white character centered over the background
    fill(255);
    renderPatternGrid(pattern, x, y, scale);
}

/**
 * Parses the binary string array and draws rects for every '1'.
 */
function renderPatternGrid(pattern, startX, startY, scale) {
    for (let row = 0; row < pattern.length; row++) {
        for (let col = 0; col < pattern[row].length; col++) {
            if (pattern[row][col] === '1') {
                rectMode(CORNER);
                // scale + 0.5 fixes HTML Canvas sub-pixel rendering gaps (anti-aliasing bleed)
                rect(startX + col * scale, startY + row * scale, scale + 0.5, scale + 0.5);
            }
        }
    }
}