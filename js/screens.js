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

function drawOptionsScreen() {
    // Uses the plain beach backdrop (not the title screen art, which has its
    // own baked-in text) so the menu stays readable against a calm background.
    if (assets.imageBackground) image(assets.imageBackground, 0, 0, width, height);
    else background(30);

    fill(0, 170); noStroke(); rectMode(CORNER);
    rect(0, 0, width, height);

    drawTextCentered('OPTIONS', width / 2, 60, 6);

    btnSound.label = settings.soundOn ? 'SOUND: ON' : 'SOUND: OFF';
    btnSound.draw(settings.soundOn);

    drawTextCentered('LEVEL', width / 2, 290, 3);
    btnEasy.draw(settings.aiDifficulty === 'EASY');
    btnMedium.draw(settings.aiDifficulty === 'MEDIUM');
    btnHard.draw(settings.aiDifficulty === 'HARD');

    btnOptionsBack.draw();
}

function drawModeSelectScreen() {
    // Same plain backdrop treatment as the Options screen for legibility
    if (assets.imageBackground) image(assets.imageBackground, 0, 0, width, height);
    else background(30);

    fill(0, 170); noStroke(); rectMode(CORNER);
    rect(0, 0, width, height);

    drawTextCentered('SELECT MODE', width / 2, 70, 5);

    btn1Player.draw();
    btn2Players.draw();
    btnModeBack.draw();
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
        resetMatchStats();
        resetParticles();
        resetPowerUps();
    }
}

function drawCountdownScreen() {
    drawGameEnvironment(); // Draw static background and paddles
    player.update(); // Allow player to position their paddle before start
    if (gameState.twoPlayerMode) computer.update(ball); // Let Player 2 position too

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

    // Only update physics and logic if NOT paused
    if (!gameState.isPaused) {
        ball.update();
        ball.collideWithPaddle(player);
        ball.collideWithPaddle(computer);
        player.update();
        computer.update(ball);
        updateParticles();
        updatePowerUp();
    }
    drawParticles(); // Drawn separately so particles stay visible (frozen) while paused
    drawPowerUp();

    drawScoreboard();
    handleTimer(); // Timer logic handles its own pause state internally

    // Pause Overlay Effect
    if (gameState.isPaused) {
        fill(0, 0, 0, 140); // Semi-transparent black overlay
        noStroke();
        rectMode(CORNER);
        rect(0, 0, width, height);

        drawTextCentered("PAUSED", width / 2, height / 2 - 25, 6);
    }

    // Draw UI buttons on top of everything (both gameplay and pause overlay)
    btnPause.draw();
    btnStop.draw();
}

function drawGameOverScreen() {
    drawGameEnvironment();

    // Darken the background slightly to highlight UI
    fill(0, 160); noStroke(); rectMode(CORNER);
    rect(0, 0, width, height);

    // Determine Result Message
    let message = "DRAW!";
    if (gameState.twoPlayerMode) {
        if (gameState.playerScore > gameState.computerScore) message = "P1 WINS!";
        else if (gameState.computerScore > gameState.playerScore) message = "P2 WINS!";
    } else {
        if (gameState.playerScore > gameState.computerScore) message = "YOU WIN!";
        else if (gameState.computerScore > gameState.playerScore) message = "YOU LOSE!";
    }

    drawTextCentered(message, width / 2, height / 2 - 60, 6);
    drawScoreboard();

    // Career stats are tracked against the AI, so only show them after 1-player matches
    if (!gameState.twoPlayerMode) {
        drawTextCentered(`${stats.wins}W-${stats.losses}L-${stats.draws}D`, width / 2, height / 2 - 10, 3);
        drawTextCentered(`STREAK ${stats.bestStreak} SCORE ${stats.bestScore}`, width / 2, height / 2 + 15, 3);
    }

    btnReplay.draw();
}

// Helper to draw the base game environment (Bg, Paddles, Ball)
function drawGameEnvironment() {
    if (assets.imageBackground) image(assets.imageBackground, 0, 0, width, height);
    else background(0);

    player.draw();
    computer.draw();

    // Only render the ball when the game is actually running or has finished
    // This prevents the ball from showing up during the 3.. 2.. 1 countdown!
    if (gameState.screen === 'PLAYING' || gameState.screen === 'GAME_OVER') {
        ball.draw();
    }
}

// ==========================================
// --- SCOREBOARD & TIMER ---
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
        if (!gameState.twoPlayerMode) recordMatchStats();

        if (!gameState.gameOverSoundPlayed) {
            if (gameState.playerScore !== gameState.computerScore) {
                playResultJingle(gameState.playerScore > gameState.computerScore);
            }
            gameState.gameOverSoundPlayed = true;
        }
        return;
    }

    // Format mm:ss and draw
    const minutes = floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    // nf() adds leading zeros (e.g., "02")
    drawTextCentered(`${nf(minutes, 2)}:${nf(seconds, 2)}`, width / 2, 45, 2);
}
