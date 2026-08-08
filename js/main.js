// ==========================================
// --- GLOBALS & P5.JS LIFECYCLE ---
// ==========================================

let ball, player, computer;
let btnStartGame, btnOptions, btnReplay, btnPause, btnStop;
let btnSound, btnEasy, btnMedium, btnHard, btnOptionsBack;
let btn1Player, btn2Players, btnModeBack;

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
    loadSettings(); // Restore sound/AI difficulty preferences saved from a previous visit
    loadStats(); // Restore career wins/losses/draws and best-of records

    // Increase canvas size by 40% (maintaining the exact 1.75 aspect ratio of the background)
    // Resolution: 980x560
    createCanvas(980, 560);

    // Scale ball diameter by 1.4x (original was 40)
    ball = new Ball(56);

    // Adjust paddle positions based on the new boundaries
    // `computer` is either AI-controlled or Player 2, depending on gameState.twoPlayerMode
    player = new PlayerPaddle(42, assets.imageRacketPlayer);
    computer = new OpponentPaddle(width - 56, assets.imageRacketComputer);

    // Recalculated hitboxes for the new 980x560 resolution
    // Parameters: x (center), y (center), width, height
    btnStartGame = new Hitbox(364, 399, 224, 84);
    btnOptions = new Hitbox(616, 399, 224, 84);

    // These buttons use 'width' and 'height' dynamically, just adjusting their size and offsets
    btnReplay = new ImageButton(width / 2, height / 2 + 84, 224, 84, assets.imageReplay);

    // UI Buttons in the top-right corner
    btnPause = new PausePlayButton(width - 49, 49, 56);

    // Moved closer to the Pause button (from width - 119 to width - 110)
    btnStop = new StopButton(width - 110, 49, 56);

    // Options screen controls (label text is set dynamically for btnSound in drawOptionsScreen)
    btnSound = new TextButton(width / 2, 190, 320, 70, '', 3);
    btnEasy = new TextButton(width / 2 - 260, 350, 220, 70, 'EASY', 3);
    btnMedium = new TextButton(width / 2, 350, 220, 70, 'MEDIUM', 3);
    btnHard = new TextButton(width / 2 + 260, 350, 220, 70, 'HARD', 3);
    btnOptionsBack = new TextButton(width / 2, 470, 220, 70, 'BACK', 3);

    // Mode select screen controls (shown after clicking Start Game)
    btn1Player = new TextButton(width / 2 - 160, 280, 280, 100, '1 PLAYER', 3);
    btn2Players = new TextButton(width / 2 + 160, 280, 280, 100, '2 PLAYERS', 3);
    btnModeBack = new TextButton(width / 2, 430, 220, 70, 'BACK', 3);
}

// The core game loop that delegates drawing based on the state machine
function draw() {
    cursor(ARROW); // Reset cursor every frame, hitboxes will set it to HAND if hovered

    if (gameState.screen === 'START') {
        drawStartScreen();
    } else if (gameState.screen === 'OPTIONS') {
        drawOptionsScreen();
    } else if (gameState.screen === 'MODE_SELECT') {
        drawModeSelectScreen();
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
            gameState.screen = 'MODE_SELECT'; // Ask 1P or 2P before the fade-out
            playSound(assets.pointSound);
        } else if (btnOptions.isHovered()) {
            gameState.screen = 'OPTIONS';
            playSound(assets.pointSound);
        }
    } else if (gameState.screen === 'MODE_SELECT') {
        if (btn1Player.isHovered()) {
            gameState.twoPlayerMode = false;
            gameState.screen = 'TRANSITION';
            playSound(assets.pointSound);
        } else if (btn2Players.isHovered()) {
            gameState.twoPlayerMode = true;
            gameState.screen = 'TRANSITION';
            playSound(assets.pointSound);
        } else if (btnModeBack.isHovered()) {
            gameState.screen = 'START';
            playSound(assets.pointSound);
        }
    } else if (gameState.screen === 'OPTIONS') {
        if (btnSound.isHovered()) {
            settings.soundOn = !settings.soundOn;
            saveSettings();
            playSound(assets.pointSound);
        } else if (btnEasy.isHovered()) {
            settings.aiDifficulty = 'EASY';
            saveSettings();
            playSound(assets.pointSound);
        } else if (btnMedium.isHovered()) {
            settings.aiDifficulty = 'MEDIUM';
            saveSettings();
            playSound(assets.pointSound);
        } else if (btnHard.isHovered()) {
            settings.aiDifficulty = 'HARD';
            saveSettings();
            playSound(assets.pointSound);
        } else if (btnOptionsBack.isHovered()) {
            gameState.screen = 'START';
            playSound(assets.pointSound);
        }
    } else if (gameState.screen === 'PLAYING') {
        if (btnStop.isHovered()) {
            // Hard reset and return to Start Screen
            gameState.screen = 'START';
            gameState.isPaused = false;
            gameState.transitionAlpha = 255; // Triggers the beautiful fade-in effect again

            // Reset scores so the next game starts fresh
            gameState.playerScore = 0;
            gameState.computerScore = 0;

            playSound(assets.pointSound);
        } else if (btnPause.isHovered()) {
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
            playSound(assets.pointSound);
        }
    } else if (gameState.screen === 'GAME_OVER') {
        if (btnReplay.isHovered()) {
            gameState.screen = 'COUNTDOWN';
            gameState.countdownStartTime = millis();
            gameState.playerScore = 0;
            gameState.computerScore = 0;
            gameState.isPaused = false; // Ensure game doesn't restart paused
            resetMatchStats();
            playSound(assets.pointSound);
        }
    }
}
