// Game configuration
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const restartBtn = document.getElementById('restartBtn');

// Game state
let gameState = {
    blocks: [],
    currentBlock: null,
    score: 0,
    highScore: localStorage.getItem('stackGameHighScore') || 0,
    gameOver: false,
    speed: 2,
    direction: 1
};

// Block properties
const BLOCK_HEIGHT = 30;
const INITIAL_BLOCK_WIDTH = 100;
const INITIAL_BLOCK_Y = canvas.height - BLOCK_HEIGHT;

// Colors for blocks
const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
];

// Initialize the game
function initGame() {
    gameState = {
        blocks: [],
        currentBlock: null,
        score: 0,
        highScore: localStorage.getItem('stackGameHighScore') || 0,
        gameOver: false,
        speed: 2,
        direction: 1
    };
    
    // Create base block
    gameState.blocks.push({
        x: canvas.width / 2 - INITIAL_BLOCK_WIDTH / 2,
        y: INITIAL_BLOCK_Y,
        width: INITIAL_BLOCK_WIDTH,
        color: colors[0]
    });
    
    createNewBlock();
    updateScore();
    restartBtn.style.display = 'none';
}

// Create a new moving block
function createNewBlock() {
    const lastBlock = gameState.blocks[gameState.blocks.length - 1];
    const colorIndex = gameState.blocks.length % colors.length;
    
    gameState.currentBlock = {
        x: 0,
        y: lastBlock.y - BLOCK_HEIGHT,
        width: lastBlock.width,
        color: colors[colorIndex],
        speed: gameState.speed,
        direction: gameState.direction
    };
}

// Update score display
function updateScore() {
    scoreElement.textContent = gameState.score;
    highScoreElement.textContent = gameState.highScore;
}

// Draw a block
function drawBlock(block) {
    ctx.fillStyle = block.color;
    ctx.fillRect(block.x, block.y, block.width, BLOCK_HEIGHT);
    
    // Add a border for better visibility
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(block.x, block.y, block.width, BLOCK_HEIGHT);
}

// Draw all blocks
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all placed blocks
    gameState.blocks.forEach(block => drawBlock(block));
    
    // Draw current moving block
    if (gameState.currentBlock && !gameState.gameOver) {
        drawBlock(gameState.currentBlock);
    }
    
    // Draw game over text
    if (gameState.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 20);
    }
}

// Update game state
function update() {
    if (gameState.gameOver || !gameState.currentBlock) return;
    
    const block = gameState.currentBlock;
    
    // Move block horizontally
    block.x += block.speed * block.direction;
    
    // Reverse direction at boundaries
    if (block.x <= 0) {
        block.x = 0;
        block.direction = 1;
    } else if (block.x + block.width >= canvas.width) {
        block.x = canvas.width - block.width;
        block.direction = -1;
    }
}

// Place the current block
function placeBlock() {
    if (gameState.gameOver || !gameState.currentBlock) return;
    
    const currentBlock = gameState.currentBlock;
    const lastBlock = gameState.blocks[gameState.blocks.length - 1];
    
    // Calculate overlap
    const leftEdge = Math.max(currentBlock.x, lastBlock.x);
    const rightEdge = Math.min(currentBlock.x + currentBlock.width, lastBlock.x + lastBlock.width);
    const overlap = rightEdge - leftEdge;
    
    // Check if there's any overlap
    if (overlap <= 0) {
        endGame();
        return;
    }
    
    // Create new block with the overlapping area
    const newBlock = {
        x: leftEdge,
        y: currentBlock.y,
        width: overlap,
        color: currentBlock.color
    };
    
    gameState.blocks.push(newBlock);
    gameState.score++;
    
    // Increase difficulty every 5 blocks
    if (gameState.score % 5 === 0) {
        gameState.speed = Math.min(gameState.speed + 0.5, 8);
    }
    
    updateScore();
    
    // Check if we need to scroll the view
    if (newBlock.y < 100) {
        // Move all blocks down
        gameState.blocks.forEach(block => {
            block.y += BLOCK_HEIGHT;
        });
    }
    
    // Create next block
    createNewBlock();
}

// End the game
function endGame() {
    gameState.gameOver = true;
    
    // Update high score
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('stackGameHighScore', gameState.highScore);
        updateScore();
    }
    
    restartBtn.style.display = 'block';
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Event listeners
canvas.addEventListener('click', placeBlock);

restartBtn.addEventListener('click', () => {
    initGame();
    gameLoop();
});

// Start the game
initGame();
gameLoop();
