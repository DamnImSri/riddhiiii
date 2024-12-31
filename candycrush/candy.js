const board = document.getElementById('board');
const scoreDisplay = document.getElementById('score');
let score = 0;

const rows = 9;
const cols = 9;
const candies = ['red', 'green', 'blue', 'yellow', 'purple', 'orange'];
const ANIMATION_DURATION = 300;
const CANDY_SIZE = 50; // Size of each candy in pixels

let gameBoard = [];
let isProcessing = false;

function createCandy(row, col) {
    const candy = document.createElement('div');
    const randomColor = candies[Math.floor(Math.random() * candies.length)];
    candy.classList.add('candy', randomColor);
    candy.style.backgroundImage = `url('./images/${randomColor}.png')`;
    candy.style.backgroundSize = 'cover';
    candy.setAttribute('data-row', row);
    candy.setAttribute('data-col', col);
    candy.draggable = true;
    candy.id = `candy-${row}-${col}`;
    
    // Position candy explicitly in the grid
    candy.style.position = 'absolute';
    candy.style.left = `${col * CANDY_SIZE}px`;
    candy.style.top = `${row * CANDY_SIZE}px`;
    candy.style.width = `${CANDY_SIZE}px`;
    candy.style.height = `${CANDY_SIZE}px`;
    
    // Entry animation
    candy.style.opacity = '0';
    candy.style.transform = 'scale(0)';
    requestAnimationFrame(() => {
        candy.style.transition = 'all 0.3s ease-in-out';
        candy.style.opacity = '1';
        candy.style.transform = 'scale(1)';
    });
    
    return candy;
}

function initializeBoard() {
    // Set board size explicitly
    board.style.width = `${cols * CANDY_SIZE}px`;
    board.style.height = `${rows * CANDY_SIZE}px`;
    board.style.position = 'relative';
    
    // Clear existing board
    board.innerHTML = '';
    gameBoard = [];
    
    for (let row = 0; row < rows; row++) {
        gameBoard[row] = [];
        for (let col = 0; col < cols; col++) {
            let candy;
            do {
                candy = createCandy(row, col);
            } while (hasInitialMatch(row, col, candy.classList[1]));
            
            board.appendChild(candy);
            gameBoard[row][col] = candy;
        }
    }
}

function hasInitialMatch(row, col, color) {
    // Check horizontal matches
    if (col >= 2 &&
        gameBoard[row][col-1]?.classList.contains(color) &&
        gameBoard[row][col-2]?.classList.contains(color)) {
        return true;
    }
    
    // Check vertical matches
    if (row >= 2 &&
        gameBoard[row-1][col]?.classList.contains(color) &&
        gameBoard[row-2][col]?.classList.contains(color)) {
        return true;
    }
    
    return false;
}

function checkMatches() {
    const matches = new Set();
    
    // Check horizontal matches
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols - 2; col++) {
            if (!gameBoard[row][col]) continue;
            
            const color = Array.from(gameBoard[row][col].classList).find(c => candies.includes(c));
            if (!color) continue;
            
            if (gameBoard[row][col + 1]?.classList.contains(color) &&
                gameBoard[row][col + 2]?.classList.contains(color)) {
                matches.add(gameBoard[row][col]);
                matches.add(gameBoard[row][col + 1]);
                matches.add(gameBoard[row][col + 2]);
            }
        }
    }
    
    // Check vertical matches
    for (let row = 0; row < rows - 2; row++) {
        for (let col = 0; col < cols; col++) {
            if (!gameBoard[row][col]) continue;
            
            const color = Array.from(gameBoard[row][col].classList).find(c => candies.includes(c));
            if (!color) continue;
            
            if (gameBoard[row + 1][col]?.classList.contains(color) &&
                gameBoard[row + 2][col]?.classList.contains(color)) {
                matches.add(gameBoard[row][col]);
                matches.add(gameBoard[row + 1][col]);
                matches.add(gameBoard[row + 2][col]);
            }
        }
    }
    
    return Array.from(matches);
}

async function swapCandies(row1, col1, row2, col2) {
    const candy1 = gameBoard[row1][col1];
    const candy2 = gameBoard[row2][col2];
    
    // Save original positions
    const pos1 = { left: candy1.style.left, top: candy1.style.top };
    const pos2 = { left: candy2.style.left, top: candy2.style.top };
    
    // Animate the swap
    candy1.style.transition = `all ${ANIMATION_DURATION}ms ease-in-out`;
    candy2.style.transition = `all ${ANIMATION_DURATION}ms ease-in-out`;
    
    candy1.style.left = pos2.left;
    candy1.style.top = pos2.top;
    candy2.style.left = pos1.left;
    candy2.style.top = pos1.top;
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATION));
    
    // Update the game board array
    gameBoard[row1][col1] = candy2;
    gameBoard[row2][col2] = candy1;
    
    // Update data attributes
    candy1.setAttribute('data-row', row2);
    candy1.setAttribute('data-col', col2);
    candy2.setAttribute('data-row', row1);
    candy2.setAttribute('data-col', col1);
}

async function clearMatches(matches) {
    if (matches.length === 0) return;
    
    const animations = matches.map(candy => {
        return new Promise(resolve => {
            const row = parseInt(candy.getAttribute('data-row'));
            const col = parseInt(candy.getAttribute('data-col'));
            
            candy.style.transition = 'all 0.3s ease-out';
            candy.style.transform = 'scale(0)';
            candy.style.opacity = '0';
            
            setTimeout(() => {
                candy.remove();
                gameBoard[row][col] = null;
                resolve();
            }, ANIMATION_DURATION);
        });
    });
    
    score += matches.length * 10;
    scoreDisplay.textContent = score;
    
    await Promise.all(animations);
}

async function dropCandies() {
    // Process column by column
    for (let col = 0; col < cols; col++) {
        let emptySpaces = 0;
        
        // Move existing candies down
        for (let row = rows - 1; row >= 0; row--) {
            if (!gameBoard[row][col]) {
                emptySpaces++;
            } else if (emptySpaces > 0) {
                const candy = gameBoard[row][col];
                const newRow = row + emptySpaces;
                
                // Animate the drop
                candy.style.transition = `top ${ANIMATION_DURATION}ms ease-in-out`;
                candy.style.top = `${newRow * CANDY_SIZE}px`;
                
                // Update game state
                gameBoard[newRow][col] = candy;
                gameBoard[row][col] = null;
                candy.setAttribute('data-row', newRow);
            }
        }
        
        // Create and drop new candies
        for (let row = emptySpaces - 1; row >= 0; row--) {
            const newCandy = createCandy(row, col);
            // Start from above the board
            newCandy.style.top = `${-CANDY_SIZE}px`;
            board.appendChild(newCandy);
            
            // Animate dropping to final position
            requestAnimationFrame(() => {
                newCandy.style.transition = `top ${ANIMATION_DURATION}ms ease-in-out`;
                newCandy.style.top = `${row * CANDY_SIZE}px`;
            });
            
            gameBoard[row][col] = newCandy;
        }
    }
    
    // Wait for animations to complete
    await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATION));
}

let dragStartX, dragStartY;
let selectedCandy = null;

board.addEventListener('dragstart', (event) => {
    if (isProcessing || !event.target.classList.contains('candy')) {
        event.preventDefault();
        return;
    }
    
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    selectedCandy = {
        row: parseInt(event.target.getAttribute('data-row')),
        col: parseInt(event.target.getAttribute('data-col'))
    };
    event.dataTransfer.setData('text/plain', event.target.id);
});

board.addEventListener('dragover', (event) => {
    event.preventDefault();
});

board.addEventListener('drop', async (event) => {
    event.preventDefault();
    if (isProcessing || !selectedCandy) return;
    
    const targetCandy = event.target.closest('.candy');
    if (!targetCandy) return;
    
    const targetRow = parseInt(targetCandy.getAttribute('data-row'));
    const targetCol = parseInt(targetCandy.getAttribute('data-col'));
    
    // Verify it's a valid move
    if (Math.abs(targetRow - selectedCandy.row) + Math.abs(targetCol - selectedCandy.col) === 1) {
        try {
            isProcessing = true;
            
            // Try the swap
            await swapCandies(selectedCandy.row, selectedCandy.col, targetRow, targetCol);
            let matches = checkMatches();
            
            if (matches.length > 0) {
                await clearMatches(matches);
                await dropCandies();
                
                // Check for cascading matches
                while ((matches = checkMatches()).length > 0) {
                    await clearMatches(matches);
                    await dropCandies();
                }
            } else {
                // Revert if no matches
                await swapCandies(targetRow, targetCol, selectedCandy.row, selectedCandy.col);
            }
        } finally {
            isProcessing = false;
        }
    }
    
    selectedCandy = null;
});

// Initialize the game
initializeBoard();