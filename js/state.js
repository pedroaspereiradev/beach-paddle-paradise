// ==========================================
// --- GLOBAL STATE & ASSETS MANAGEMENT ---
// ==========================================

const assets = {}; // Stores all images and sounds loaded in preload()
const gameState = {
    // State Machine: Controls which screen is currently being rendered
    screen: 'START', // States: 'START', 'MODE_SELECT', 'TRANSITION', 'COUNTDOWN', 'PLAYING', 'GAME_OVER'

    // Game variables
    twoPlayerMode: false, // false = vs AI (right paddle is computer-controlled), true = local 2-player
    playerScore: 0,
    computerScore: 0,

    // Time tracking variables
    startTime: 0,
    countdownStartTime: 0,
    transitionAlpha: 255, // Controls the opacity for fade-in/fade-out effects (0 to 255)

    // Pause system variables
    isPaused: false,
    pauseStartTime: 0, // Records the exact moment the game was paused to adjust the main timer later

    // Per-match stat tracking (reset every time a new match starts)
    currentStreak: 0, // Consecutive points scored by the player without the opponent scoring
    longestStreakThisMatch: 0,
    statsRecorded: false, // Guards against recording the same finished match more than once
    gameOverSoundPlayed: false // Guards against replaying the result jingle every redrawn frame
};

// ==========================================
// --- SETTINGS (PERSISTED VIA localStorage) ---
// ==========================================

const SETTINGS_STORAGE_KEY = 'beachPaddleParadise.settings';

const settings = {
    soundOn: true,
    aiDifficulty: 'MEDIUM' // One of: 'EASY', 'MEDIUM', 'HARD'
};

// Tuning knobs consumed by OpponentPaddle.update() in AI mode - reaction is the
// steering factor applied to the distance-to-ball, maxSpeed caps pixels moved per frame.
const AI_DIFFICULTY = {
    EASY: { reaction: 0.08, maxSpeed: 3 },
    MEDIUM: { reaction: 0.12, maxSpeed: 4 }, // Matches the original, pre-Options behavior
    HARD: { reaction: 0.18, maxSpeed: 6 }
};

function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY));
        if (saved) Object.assign(settings, saved);
    } catch (e) {
        // Corrupted or inaccessible storage (e.g. private browsing) - defaults are used instead.
    }
}

function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        // Storage might be unavailable - settings just won't persist across sessions.
    }
}

// Central helper so every UI/gameplay sound respects the Options mute toggle.
function playSound(sound) {
    if (settings.soundOn && sound) sound.play();
}

// ==========================================
// --- MATCH STATS (PERSISTED VIA localStorage) ---
// ==========================================

const STATS_STORAGE_KEY = 'beachPaddleParadise.stats';

const stats = {
    wins: 0,
    losses: 0,
    draws: 0,
    bestStreak: 0,
    bestScore: 0
};

function loadStats() {
    try {
        const saved = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY));
        if (saved) Object.assign(stats, saved);
    } catch (e) {
        // Corrupted or inaccessible storage - stats simply start fresh.
    }
}

function saveStats() {
    try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
        // Storage might be unavailable - stats just won't persist across sessions.
    }
}

// Resets the per-match counters; called whenever a new match is about to begin.
function resetMatchStats() {
    gameState.currentStreak = 0;
    gameState.longestStreakThisMatch = 0;
    gameState.statsRecorded = false;
    gameState.gameOverSoundPlayed = false;
}

// Folds the just-finished match into the all-time stats. Safe to call every
// frame the Game Over screen is drawn - `statsRecorded` makes it a no-op after the first time.
function recordMatchStats() {
    if (gameState.statsRecorded) return;

    if (gameState.playerScore > gameState.computerScore) stats.wins++;
    else if (gameState.computerScore > gameState.playerScore) stats.losses++;
    else stats.draws++;

    stats.bestStreak = max(stats.bestStreak, gameState.longestStreakThisMatch);
    stats.bestScore = max(stats.bestScore, gameState.playerScore);

    saveStats();
    gameState.statsRecorded = true;
}
