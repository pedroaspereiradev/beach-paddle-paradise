// ==========================================
// --- SYNTHESIZED SOUND EFFECTS ---
// ==========================================
// Short one-shot blips built with p5.sound oscillators instead of audio
// files, so the power-up pickup and match-result cues don't need new assets.

// A quick rising two-note chime for collecting a power-up.
function playPowerUpChime() {
    if (!settings.soundOn) return;

    const osc = new p5.Oscillator('sine');
    const env = new p5.Envelope();
    env.setADSR(0.01, 0.12, 0.2, 0.1);
    env.setRange(0.3, 0);

    osc.freq(660);
    osc.start();
    env.play(osc);
    osc.freq(880, 0.08); // Pitch rises partway through for a "power up!" feel

    setTimeout(() => osc.stop(), 300);
}

// A short four-note melody on Game Over: ascending for a win, descending for a loss.
function playResultJingle(won) {
    if (!settings.soundOn) return;

    const winNotes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
    const loseNotes = [523.25, 466.16, 392.00, 349.23]; // Descending, minor-ish
    const notes = won ? winNotes : loseNotes;

    notes.forEach((freq, i) => {
        setTimeout(() => {
            const osc = new p5.Oscillator(won ? 'sine' : 'triangle');
            const env = new p5.Envelope();
            env.setADSR(0.005, 0.1, 0.15, 0.15);
            env.setRange(0.25, 0);

            osc.freq(freq);
            osc.start();
            env.play(osc);

            setTimeout(() => osc.stop(), 300);
        }, i * 140);
    });
}
