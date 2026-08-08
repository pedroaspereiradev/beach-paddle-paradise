// ==========================================
// --- CUSTOM PIXEL FONT DICTIONARY (3x5) ---
// ==========================================
// Represents characters as grids of 1s (filled pixel) and 0s (empty space).
// Drawn dynamically via code to ensure perfect pixel scaling without blur.

const pixelFont = {
    // Numbers and Symbols
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'],
    '-': ['000', '000', '111', '000', '000'], ':': ['000', '010', '000', '010', '000'],

    // Letters used for UI texts (Game Over and Pause)
    'P': ['111', '101', '111', '100', '100'], 'Y': ['101', '101', '111', '010', '010'],
    'O': ['111', '101', '101', '101', '111'], 'U': ['101', '101', '101', '101', '111'],
    'W': ['101', '101', '101', '111', '101'], 'I': ['111', '010', '010', '010', '111'],
    'N': ['111', '111', '101', '101', '101'], 'L': ['100', '100', '100', '100', '111'],
    'S': ['111', '100', '111', '001', '111'], 'E': ['111', '100', '111', '100', '111'],
    'D': ['110', '101', '101', '101', '110'], 'R': ['110', '101', '110', '101', '101'],
    'A': ['111', '101', '111', '101', '101'], '!': ['010', '010', '010', '000', '010'],

    // Letters added for the Options menu and match stats (Settings, AI difficulty)
    'T': ['111', '010', '010', '010', '010'], 'F': ['111', '100', '111', '100', '100'],
    'V': ['101', '101', '101', '101', '010'], 'M': ['101', '111', '111', '101', '101'],
    'H': ['101', '101', '111', '101', '101'], 'B': ['110', '101', '110', '101', '110'],
    'C': ['111', '100', '100', '100', '111'], 'K': ['101', '101', '110', '101', '101'],

    // UI Icons
    '>': ['100', '110', '111', '110', '100'], // Play Icon (Triangle)
    '|': ['101', '101', '101', '101', '101'], // Pause Icon (Two bars)
    '#': ['000', '111', '111', '111', '000']  // Stop Icon (Solid Square)
};

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
