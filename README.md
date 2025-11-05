# Stack Game

A fun, browser-based stacking game where you need to stack blocks perfectly on top of each other!

## 🎮 How to Play

1. Open `index.html` in your web browser
2. Click anywhere on the canvas to place the moving block
3. Try to align each block perfectly with the one below
4. The part of the block that doesn't overlap gets cut off
5. Game ends when you miss completely
6. Try to get the highest score!

## 🎯 Features

- **Smooth animations** - Blocks move horizontally across the canvas
- **Progressive difficulty** - Speed increases every 5 blocks
- **Score tracking** - Current score and high score (saved in browser)
- **Colorful blocks** - Different colors for each block
- **Responsive design** - Clean, modern UI with gradient backgrounds
- **Restart functionality** - Play again button appears after game over

## 🚀 Getting Started

### Option 1: Open Directly
Simply open `index.html` in any modern web browser.

### Option 2: Use a Local Server
```bash
# Python 3
python3 -m http.server 8000

# Then open http://localhost:8000 in your browser
```

## 🛠️ Technologies Used

- **HTML5** - Structure
- **CSS3** - Styling with gradients and animations
- **JavaScript** - Game logic using Canvas API
- **LocalStorage** - Persistent high score tracking

## 📁 Project Structure

```
stack-game/
├── index.html    # Main HTML file
├── style.css     # Styling and layout
├── game.js       # Game logic and mechanics
└── README.md     # This file
```

## 🎨 Game Mechanics

- Blocks move horizontally at varying speeds
- Click to place a block at its current position
- Only the overlapping portion of the block is kept
- Misalignment reduces the width of subsequent blocks
- Complete misses end the game
- Speed increases as you progress

## 📸 Screenshots

![Game Start](https://github.com/user-attachments/assets/a914991b-3813-463a-a34d-0be5e75e3092)
*Game starting with the first moving block*

![Game Over](https://github.com/user-attachments/assets/d3882fb5-bb4f-465a-87e3-7dd54ea413e8)
*Game over screen showing stacked blocks and final score*

## 🏆 Tips

- Time your clicks carefully for perfect alignment
- Perfect alignment keeps the same width for easier subsequent placements
- The game gets faster, so stay focused!
- Practice makes perfect - keep trying to beat your high score!

## 📝 License

This project is open source and available for anyone to use and modify.

---

Enjoy the game! 🎮✨