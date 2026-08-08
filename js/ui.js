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
        // Visual feedback on hover
        if (this.isHovered()) {
            push(); fill(255, 255, 255, 60); noStroke(); rectMode(CENTER);
            rect(this.x, this.y, this.size, this.size, 6); pop();
            cursor(HAND);
        }

        // Decide which character to render (Play or Pause icon)
        const iconChar = gameState.isPaused ? '>' : '|';
        const iconScale = 4;

        // Calculate offset to perfectly center the character inside the button
        const charWidth = 3 * iconScale;
        const charHeight = 5 * iconScale;
        const startX = this.x - charWidth / 2;
        const startY = this.y - charHeight / 2;

        drawPixelCharWithBorder(iconChar, startX, startY, iconScale);
    }
}

/**
 * Stop button drawn using the custom pixel font system.
 * Returns the player to the Start Screen.
 */
class StopButton {
    constructor(x, y, size) {
        this.x = x; this.y = y; this.size = size;
    }
    isHovered() {
        return mouseX > this.x - this.size / 2 && mouseX < this.x + this.size / 2 &&
               mouseY > this.y - this.size / 2 && mouseY < this.y + this.size / 2;
    }
    draw() {
        // Visual feedback on hover (slightly red for the stop action)
        if (this.isHovered()) {
            push(); fill(255, 100, 100, 80); noStroke(); rectMode(CENTER);
            rect(this.x, this.y, this.size, this.size, 6); pop();
            cursor(HAND);
        }

        const iconChar = '#'; // Our custom stop square icon

        // Increased scale from 4 to 5.5 so the square looks bigger and matches the Pause weight!
        const iconScale = 5.5;

        const charWidth = 3 * iconScale;
        const charHeight = 5 * iconScale;
        const startX = this.x - charWidth / 2;
        const startY = this.y - charHeight / 2;

        drawPixelCharWithBorder(iconChar, startX, startY, iconScale);
    }
}

/**
 * Bordered button with a pixel-font text label, used throughout the Options screen.
 * `label` can be reassigned between frames (e.g. to reflect the current sound state).
 */
class TextButton {
    constructor(x, y, w, h, label, scale = 3) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.label = label; this.scale = scale;
    }
    isHovered() {
        return mouseX > this.x - this.w / 2 && mouseX < this.x + this.w / 2 &&
               mouseY > this.y - this.h / 2 && mouseY < this.y + this.h / 2;
    }
    // `active` highlights the button as the currently selected option
    draw(active = false) {
        push(); rectMode(CENTER); noStroke();
        if (active) fill(255, 200, 80, 210);
        else fill(255, 255, 255, this.isHovered() ? 60 : 30);
        rect(this.x, this.y, this.w, this.h, 8);
        pop();

        if (this.isHovered()) cursor(HAND);

        const charHeight = this.scale * 5;
        drawTextCentered(this.label, this.x, this.y - charHeight / 2, this.scale);
    }
}
