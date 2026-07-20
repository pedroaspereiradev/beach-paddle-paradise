// --- ESTADO GLOBAL E ASSETS ---
const assets = {};
const gameState = {
    screen: 'START', // 'START', 'TRANSITION', 'COUNTDOWN', 'PLAYING', 'GAME_OVER'
    playerScore: 0,
    computerScore: 0,
    startTime: 0,
    countdownStartTime: 0,
    transitionAlpha: 255 // Controla o Fade-in/Fade-out
};

// --- FONTE PIXELADA (3x5) ---
const pixelFont = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'],
    '-': ['000', '000', '111', '000', '000'], ':': ['000', '010', '000', '010', '000'],
    // Letras para o Game Over
    'Y': ['101', '101', '111', '010', '010'], 'O': ['111', '101', '101', '101', '111'],
    'U': ['101', '101', '101', '101', '111'], 'W': ['101', '101', '101', '111', '101'],
    'I': ['111', '010', '010', '010', '111'], 'N': ['111', '111', '101', '101', '101'],
    'L': ['100', '100', '100', '100', '111'], 'S': ['111', '100', '111', '001', '111'],
    'E': ['111', '100', '111', '100', '111'], 'D': ['110', '101', '101', '101', '110'],
    'R': ['110', '101', '110', '101', '101'], 'A': ['111', '101', '111', '101', '101'],
    '!': ['010', '010', '010', '000', '010']
};

// --- CLASSES DO JOGO ---

class Paddle {
    constructor(x, imageRef) {
        this.x = x;
        this.width = 10;
        this.height = 60;
        this.y = height / 2 - this.height / 2;
        this.img = imageRef;
    }
    constrainBounds() { this.y = constrain(this.y, 0, height - this.height); }
    draw() {
        if (this.img) {
            image(this.img, this.x, this.y, this.width, this.height);
        } else {
            fill(255); noStroke(); rect(this.x, this.y, this.width, this.height);
        }
    }
}

class PlayerPaddle extends Paddle {
    update() {
        this.y = mouseY - this.height / 2;
        this.constrainBounds();
    }
}

class ComputerPaddle extends Paddle {
    update(ball) {
        const targetY = ball.y - this.height / 2;
        const distance = targetY - this.y;
        if (abs(distance) > 2) this.y += constrain(distance * 0.12, -4, 4);
        this.constrainBounds();
    }
}

class Ball {
    constructor(diameter) {
        this.diameter = diameter;
        this.radius = this.diameter / 2;
        this.reset();
    }
    reset() {
        this.x = width / 2;
        this.y = height / 2;
        this.speedX = random([-5, 5]);
        this.speedY = random(-4, 4);
        this.angle = 0;
    }
    collideWithPaddle(paddle) {
        const isLeft = paddle.x < width / 2;
        const paddleRight = paddle.x + paddle.width;
        const paddleBottom = paddle.y + paddle.height;

        const isWithinVert = this.y + this.radius >= paddle.y && this.y - this.radius <= paddleBottom;
        const isWithinHoriz = isLeft 
            ? this.x - this.radius <= paddleRight && this.x + this.radius >= paddle.x
            : this.x + this.radius >= paddle.x && this.x - this.radius <= paddleRight;
        const isMovingToward = isLeft ? this.speedX < 0 : this.speedX > 0;

        if (isWithinVert && isWithinHoriz && isMovingToward) {
            const relIntersectY = this.y - (paddle.y + paddle.height / 2);
            const bounceAngle = (relIntersectY / (paddle.height / 2)) * 0.75;

            this.x = isLeft ? paddleRight + this.radius : paddle.x - this.radius;
            const speed = Math.sqrt(this.speedX ** 2 + this.speedY ** 2) * 1.05;
            
            this.speedX = (isLeft ? 1 : -1) * speed * Math.cos(bounceAngle);
            this.speedY = speed * Math.sin(bounceAngle);
            this.angle = atan2(this.speedY, this.speedX);

            if (assets.bounceSound) assets.bounceSound.play();
        }
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.angle += sqrt(this.speedX ** 2 + this.speedY ** 2) * 0.06;

        if (this.x + this.radius > width || this.x - this.radius < 0) {
            if (this.x + this.radius > width) gameState.playerScore++;
            else gameState.computerScore++;
            
            if (assets.pointSound) assets.pointSound.play();
            this.reset();
        }
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

// --- CLASSES DE UI ---

class Hitbox {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.w = w; this.h = h;
    }
    isHovered() {
        return mouseX > this.x - this.w / 2 && mouseX < this.x + this.w / 2 && 
               mouseY > this.y - this.h / 2 && mouseY < this.y + this.h / 2;
    }
    draw() {
        if (this.isHovered() && gameState.transitionAlpha <= 0) {
            push(); fill(255, 255, 255, 60); noStroke(); rectMode(CENTER);
            rect(this.x, this.y, this.w, this.h, 8); pop();
            cursor(HAND);
        }
    }
}

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

// --- INSTÂNCIAS GLOBAIS ---
let ball, player, computer;
let btnStartGame, btnOptions, btnReplay;

// --- FUNÇÕES DO P5.JS ---

function preload() {
    assets.imageBall = loadImage('assets/bola.png');
    assets.imageBackground = loadImage('assets/fundo.png');
    assets.imageRacketPlayer = loadImage('assets/raquete-player.png');
    assets.imageRacketComputer = loadImage('assets/raquete-ia.png');
    assets.imageStartScreen = loadImage('assets/tela-inicial.png');
    assets.imageReplay = loadImage('assets/botao-replay.png'); // NOVO BOTÃO DE REPLAY
    assets.bounceSound = loadSound('assets/batida-bola.mp3');
    assets.pointSound = loadSound('assets/ponto.mp3');
}

function setup() {
    createCanvas(700, 400);
    
    ball = new Ball(40);
    player = new PlayerPaddle(30, assets.imageRacketPlayer);
    computer = new ComputerPaddle(width - 40, assets.imageRacketComputer);
    
    btnStartGame = new Hitbox(260, 285, 160, 60); 
    btnOptions = new Hitbox(440, 285, 160, 60);
    btnReplay = new ImageButton(width / 2, height / 2 + 60, 160, 60, assets.imageReplay);
}

function draw() {
    cursor(ARROW);

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
    if (gameState.screen === 'START' && gameState.transitionAlpha <= 0) {
        if (btnStartGame.isHovered()) {
            gameState.screen = 'TRANSITION'; // Inicia o escurecimento
            if (assets.pointSound) assets.pointSound.play();
        }
    } else if (gameState.screen === 'GAME_OVER') {
        if (btnReplay.isHovered()) {
            gameState.screen = 'COUNTDOWN'; // Vai direto pro contador p/ reiniciar rápido
            gameState.countdownStartTime = millis();
            gameState.playerScore = 0;
            gameState.computerScore = 0;
            if (assets.pointSound) assets.pointSound.play();
        }
    }
}

// --- TELAS DO JOGO ---

function drawStartScreen() {
    if (assets.imageStartScreen) image(assets.imageStartScreen, 0, 0, width, height);
    else background(30); 

    btnStartGame.draw(); btnOptions.draw();

    // Clareando a tela ao iniciar
    if (gameState.transitionAlpha > 0) {
        fill(0, gameState.transitionAlpha); noStroke();
        rect(0, 0, width, height);
        gameState.transitionAlpha -= 5; 
    }
}

function drawTransition() {
    // Desenha a tela inicial parada no fundo
    if (assets.imageStartScreen) image(assets.imageStartScreen, 0, 0, width, height);
    else background(30);

    // Escurece a tela rapidamente
    fill(0, gameState.transitionAlpha); noStroke();
    rect(0, 0, width, height);
    gameState.transitionAlpha += 10; 

    // Quando ficar 100% preto, muda pro contador
    if (gameState.transitionAlpha >= 255) {
        gameState.screen = 'COUNTDOWN';
        gameState.countdownStartTime = millis();
        ball.reset(); // Zera a bola pro centro
        player.y = height / 2 - player.height / 2; // Centraliza a raquete
        computer.y = height / 2 - computer.height / 2;
    }
}

function drawCountdownScreen() {
    drawGameEnvironment(); // Desenha fundo e raquetes
    player.update(); // Permite que o jogador mova a raquete antes de iniciar

    // Clareando (saindo do preto total)
    if (gameState.transitionAlpha > 0) {
        fill(0, gameState.transitionAlpha); noStroke();
        rect(0, 0, width, height);
        gameState.transitionAlpha -= 10; 
    }

    // Lógica do Contador 3, 2, 1
    const elapsed = millis() - gameState.countdownStartTime;
    const timeLeft = 3 - floor(elapsed / 1000);

    if (timeLeft > 0) {
        drawTextCentered(timeLeft.toString(), width / 2, height / 2 - 25, 10);
    } else {
        // Acabou o contador, libera o jogo
        gameState.screen = 'PLAYING';
        gameState.startTime = millis();
        ball.reset(); // Garante o disparo aleatório na hora exata que começa
    }
}

function drawGameScreen() {
    drawGameEnvironment();
    drawScoreboard();
    
    // Atualiza a lógica do jogo
    ball.update();
    ball.collideWithPaddle(player);
    ball.collideWithPaddle(computer);
    player.update();
    computer.update(ball);

    // O relógio precisa vir depois pra saber se deve encerrar o jogo
    handleTimer(); 
}

function drawGameOverScreen() {
    drawGameEnvironment();
    
    // Escurece um pouco a tela
    fill(0, 160); noStroke();
    rect(0, 0, width, height);

    // Escolhe a mensagem
    let message = "DRAW!";
    if (gameState.playerScore > gameState.computerScore) message = "YOU WIN!";
    else if (gameState.computerScore > gameState.playerScore) message = "YOU LOSE!";

    drawTextCentered(message, width / 2, height / 2 - 60, 6);
    drawScoreboard(); // Mostra o placar final

    btnReplay.draw();
}

// Helper para desenhar a base do cenário estática ou animada
function drawGameEnvironment() {
    if (assets.imageBackground) image(assets.imageBackground, 0, 0, width, height);
    else background(0);
    
    player.draw();
    computer.draw();
    ball.draw();
}

// --- SISTEMA DE UI PIXELADA ---

function drawScoreboard() {
    const scoreText = `${gameState.playerScore}-${gameState.computerScore}`;
    drawTextCentered(scoreText, width / 2, 15, 4);
}

function handleTimer() {
    const elapsedTime = millis() - gameState.startTime;
    const totalSeconds = floor(elapsedTime / 1000);
    
    if (totalSeconds >= 120) {
        gameState.screen = 'GAME_OVER'; // 2 minutos atingidos!
        return; 
    }
    const minutes = floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    drawTextCentered(`${nf(minutes, 2)}:${nf(seconds, 2)}`, width / 2, 45, 2);
}

// Helper centralizador de texto
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

function drawPixelCharWithBorder(char, x, y, scale) {
    if (char === ' ') return; // Pula os espaços (ex: "YOU WIN")
    const pattern = pixelFont[char] || pixelFont['-'];
    const borderThickness = 1;
    noStroke();

    fill(0);
    for (let dy = -borderThickness; dy <= borderThickness; dy++) {
        for (let dx = -borderThickness; dx <= borderThickness; dx++) {
            if (dx !== 0 || dy !== 0) renderPatternGrid(pattern, x + dx, y + dy, scale);
        }
    }
    fill(255);
    renderPatternGrid(pattern, x, y, scale);
}

function renderPatternGrid(pattern, startX, startY, scale) {
    for (let row = 0; row < pattern.length; row++) {
        for (let col = 0; col < pattern[row].length; col++) {
            if (pattern[row][col] === '1') {
                rectMode(CORNER);
                rect(startX + col * scale, startY + row * scale, scale + 0.5, scale + 0.5);
            }
        }
    }
}