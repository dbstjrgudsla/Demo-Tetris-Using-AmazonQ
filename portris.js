// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 35; // 블록 크기
const COLORS = [
    '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF',
    '#FF8E0D', '#FFE138', '#3877FF'
];

// Game variables
let canvas;
let ctx;
let grid = createGrid();
let score = 0;
let gameOver = false;
let currentPiece = null;
let dropCounter = 0;
let dropInterval = 1000; // Time in ms between automatic drops
let lastTime = 0;

// Tetromino shapes
const PIECES = [
    [
        [1, 1, 1, 1] // I piece
    ],
    [
        [1, 1, 1],   // J piece
        [0, 0, 1]
    ],
    [
        [1, 1, 1],   // L piece
        [1, 0, 0]
    ],
    [
        [1, 1],      // O piece
        [1, 1]
    ],
    [
        [0, 1, 1],   // S piece
        [1, 1, 0]
    ],
    [
        [1, 1, 1],   // T piece
        [0, 1, 0]
    ],
    [
        [1, 1, 0],   // Z piece
        [0, 1, 1]
    ]
];

// Initialize the game
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    document.addEventListener('keydown', handleKeyPress);
    
    resetGame();
    update();
}

// Create an empty grid
function createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// Reset the game
function resetGame() {
    grid = createGrid();
    score = 0;
    gameOver = false;
    updateScore();
    generatePiece();
}

// Generate a new random piece
function generatePiece() {
    const pieceType = Math.floor(Math.random() * PIECES.length);
    const piece = PIECES[pieceType];
    
    currentPiece = {
        position: { x: Math.floor(COLS / 2) - Math.floor(piece[0].length / 2), y: 0 },
        shape: piece,
        color: COLORS[pieceType]
    };
    
    // Check if the game is over
    if (collision()) {
        gameOver = true;
        alert('Game Over! Your score: ' + score);
    }
}

// Check for collision
function collision() {
    const { shape, position } = currentPiece;
    
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] !== 0) {
                const newX = x + position.x;
                const newY = y + position.y;
                
                if (
                    newX < 0 || 
                    newX >= COLS || 
                    newY >= ROWS ||
                    (newY >= 0 && grid[newY][newX])
                ) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// Merge the current piece with the grid
function merge() {
    const { shape, position, color } = currentPiece;
    
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] !== 0) {
                const newY = y + position.y;
                if (newY >= 0) {
                    grid[newY][x + position.x] = color;
                }
            }
        }
    }
}

// Move the current piece
function movePiece(direction) {
    currentPiece.position.x += direction;
    if (collision()) {
        currentPiece.position.x -= direction;
    }
}

// Rotate the current piece
function rotatePiece() {
    const originalShape = currentPiece.shape;
    
    // Create a new rotated shape
    const newShape = [];
    for (let i = 0; i < originalShape[0].length; i++) {
        newShape.push([]);
        for (let j = originalShape.length - 1; j >= 0; j--) {
            newShape[i].push(originalShape[j][i]);
        }
    }
    
    // Save the original shape
    const originalPiece = { ...currentPiece };
    
    // Try the rotation
    currentPiece.shape = newShape;
    
    // If there's a collision, revert back
    if (collision()) {
        currentPiece.shape = originalShape;
    }
}

// Drop the current piece
function dropPiece() {
    currentPiece.position.y++;
    
    if (collision()) {
        currentPiece.position.y--;
        merge();
        checkLines();
        generatePiece();
    }
    
    dropCounter = 0;
}

// Get the position where the piece would land (for ghost piece)
function getGhostPosition() {
    // Create a copy of the current position
    const ghostPosition = { ...currentPiece.position };
    
    // Move down until collision
    while (true) {
        ghostPosition.y++;
        
        // Check if the new position would cause a collision
        const { shape } = currentPiece;
        let wouldCollide = false;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] !== 0) {
                    const newX = x + ghostPosition.x;
                    const newY = y + ghostPosition.y;
                    
                    if (
                        newX < 0 || 
                        newX >= COLS || 
                        newY >= ROWS ||
                        (newY >= 0 && grid[newY][newX])
                    ) {
                        wouldCollide = true;
                        break;
                    }
                }
            }
            if (wouldCollide) break;
        }
        
        if (wouldCollide) {
            ghostPosition.y--;
            break;
        }
    }
    
    return ghostPosition;
}

// Hard drop the piece
function hardDrop() {
    while (!collision()) {
        currentPiece.position.y++;
    }
    
    currentPiece.position.y--;
    merge();
    checkLines();
    generatePiece();
    dropCounter = 0;
}

// Check for completed lines
function checkLines() {
    let linesCleared = 0;
    
    for (let y = ROWS - 1; y >= 0; y--) {
        let isLineComplete = true;
        
        for (let x = 0; x < COLS; x++) {
            if (!grid[y][x]) {
                isLineComplete = false;
                break;
            }
        }
        
        if (isLineComplete) {
            // Remove the line
            grid.splice(y, 1);
            // Add a new empty line at the top
            grid.unshift(Array(COLS).fill(0));
            // Stay on the same line to check the new line that moved down
            y++;
            linesCleared++;
        }
    }
    
    // Update score based on lines cleared
    if (linesCleared > 0) {
        score += [40, 100, 300, 1200][linesCleared - 1];
        updateScore();
    }
}

// Update the score display
function updateScore() {
    document.getElementById('score').textContent = score;
}

// Handle keyboard input
function handleKeyPress(event) {
    if (gameOver) return;
    
    switch (event.keyCode) {
        case 37: // Left arrow
            movePiece(-1);
            break;
        case 39: // Right arrow
            movePiece(1);
            break;
        case 40: // Down arrow
            dropPiece();
            break;
        case 38: // Up arrow
            rotatePiece();
            break;
        case 32: // Space
            hardDrop();
            break;
    }
}

// Draw a single block
function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// Draw the grid
function drawGrid() {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (grid[y][x]) {
                drawBlock(x, y, grid[y][x]);
            }
        }
    }
}

// Draw the current piece
function drawPiece() {
    const { shape, position, color } = currentPiece;
    
    // Draw the ghost piece (projection)
    const ghostPosition = getGhostPosition();
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] !== 0) {
                // Draw ghost piece with transparent version of the color
                ctx.fillStyle = color + '40'; // Add 40 hex for 25% opacity
                ctx.fillRect((x + ghostPosition.x) * BLOCK_SIZE, (y + ghostPosition.y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#FFF';
                ctx.strokeRect((x + ghostPosition.x) * BLOCK_SIZE, (y + ghostPosition.y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
    
    // Draw the actual piece
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] !== 0) {
                drawBlock(x + position.x, y + position.y, color);
            }
        }
    }
}

// Draw everything
function draw() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid lines (optional)
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, i * BLOCK_SIZE);
        ctx.stroke();
    }
    
    // Draw the grid and current piece
    drawGrid();
    if (currentPiece) {
        drawPiece();
    }
}

// Main game loop
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (!gameOver) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            dropPiece();
        }
    }
    
    draw();
    requestAnimationFrame(update);
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', init);
