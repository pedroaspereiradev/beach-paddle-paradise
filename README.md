# 🏖️ Beach Paddle Paradise

![Beach Paddle Paradise](assets/tela-inicial.png)

A retro arcade game inspired by the classic Pong, but with a tropical beach vibe! The game pits the player against an Artificial Intelligence in dynamic and fun 2-minute matches. Developed purely with JavaScript and the **p5.js** library.

## ✨ Features

* **Player vs AI Mode:** Challenge the computer that actively tracks the ball's position.
* **Complete State Machine:** Smooth transitions between the Start Screen, Countdown, Gameplay, and Game Over states.
* **Advanced Arcade Physics:** The ball's speed gradually increases, and its angle changes depending on where it hits the paddle.
* **Custom UI and Font System:** Interactive hitboxes and a system that renders a pixelated font (3x5) with perfectly adjusted borders, drawn block by block via code.
* **Pause/Resume and Stop:** Pause the match at any time without losing track of the timer, or stop and return to the start screen.
* **Win Condition:** Matches with a strict 2-minute (120 seconds) time limit, declaring the winner at the end of the countdown.
* **Audiovisual Feedback:** Sound effects for hits and scoring, plus buttons with hover animations.

## 🚀 Technologies Used

* **JavaScript (ES6+)** - Core Object-Oriented logic.
* **[p5.js](https://p5js.org/)** - Main library for 2D Canvas rendering, audio manipulation, and math.
* **HTML/CSS** - Basic structure to host the game canvas.

## 🎮 How to Play

1. Click **START** on the initial screen.
2. Wait for the 3-second countdown.
3. Use your **Mouse** (moving up and down) to control the left paddle.
4. Get the ball past the opponent's paddle to score points.
5. The game ends after exactly 2 minutes. Whoever has the most points wins!
6. Click the **Replay** button to play again.

## 🛠️ How to Run Locally

Since the project uses local files (images and sounds), you will need to run a local server to avoid CORS (Cross-Origin Resource Sharing) issues in the browser.

1. Clone this repository:
   ```bash
   git clone https://github.com/pedroaspereiradev/beach-paddle-paradise.git
   cd beach-paddle-paradise
   ```

2. Start a local server. Pick whichever option you have available:

   * **VS Code:** install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, then right-click `index.html` and choose **"Open with Live Server"**.
   * **Python 3:**
     ```bash
     python -m http.server 8000
     ```
   * **Node.js:**
     ```bash
     npx serve .
     ```

3. Open the printed address (e.g. `http://localhost:8000`) in your browser and enjoy!

## 📁 Project Structure

```
beach-paddle-paradise/
├── assets/          # Sprites, background art, and sound effects
├── index.html       # Canvas host page
├── styles.css       # Page layout and canvas styling
├── sketch.js        # Game logic (p5.js sketch: state machine, entities, rendering)
└── README.md
```

## 🖼️ Assets

All artwork and sound effects in `assets/` are original creations made for this project.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
