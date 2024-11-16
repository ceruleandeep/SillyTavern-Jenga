let stability = 100;
let gameActive = false;
let tower = [];
let pulledBlocks = [];
let blockData = [];
let currentBlock = null; // Keeps track of the block in hand

const mountPoint = '/scripts/extensions/third-party/SillyTavern-Jenga';

// Load block data from GitHub
async function loadBlockData() {
    try {
        const response = await fetch(`${mountPoint}/jenga-test.json`);
        if (!response.ok) throw new Error('Failed to load block data.');
        blockData = await response.json();
    } catch (error) {
        blockData = [];
        console.error('Error loading jenga.json:', error);
    }
}

// Initialize tower with shuffled blocks, grouped into layers
function initializeTower() {
    const shuffledBlocks = [...blockData.blocks];
    for (let i = shuffledBlocks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledBlocks[i], shuffledBlocks[j]] = [shuffledBlocks[j], shuffledBlocks[i]];
    }

    tower = [];
    for (let i = 0; i < shuffledBlocks.length; i += 3) {
        tower.push([shuffledBlocks[i], shuffledBlocks[i + 1], shuffledBlocks[i + 2]].filter(Boolean));
    }

    if (tower.length < 18) {
        throw new Error('Not enough blocks to create the tower (requires at least 54 blocks).');
    }
}

// Randomized stability reduction (adjusted for pulling and placing blocks)
function reduceStability(action) {
    let reduction = Math.random() * (action === 'pull' ? 3 : 2) + 2;
    stability -= reduction;

    if (stability <= 0) {
        gameActive = false;
        return 'The tower collapses! Game over.';
    }

    if (stability <= 20 && Math.random() < 0.5) {
        gameActive = false;
        return 'The tower collapses! Game over.';
    }

    return null;
}

// Pull a block from the tower (only one block at a time, and only if no block is already in hand)
function pullBlock() {
    if (!gameActive) return 'No active game! Use !startjenga to begin.';

    if (currentBlock) {
        return 'You already have a block in hand. Place it back on the tower before pulling another.';
    }

    if (tower.every(layer => layer.length === 0)) {
        gameActive = false;
        return 'The tower collapses! Game over.';
    }

    let randomLayer;
    do {
        randomLayer = tower[Math.floor(Math.random() * tower.length)];
    } while (randomLayer.length === 0);

    const blockIndex = Math.floor(Math.random() * randomLayer.length);
    currentBlock = randomLayer.splice(blockIndex, 1)[0]; // Only one block at a time

    const collapseMessage = reduceStability('pull');
    return collapseMessage || `You pulled ${currentBlock.block_id}. Challenge: ${currentBlock.prompt} (Stability: ${stability.toFixed(1)}%)`;
}

// Place a pulled block on top of the tower
function placeBlock() {
    if (!gameActive) return 'No active game! Use !startjenga to begin.';
    if (!currentBlock) return 'You don\'t have any blocks to place. Pull a block first!';

    // Place the pulled block back on top
    const topLayer = tower[tower.length - 1];
    if (topLayer.length < 3) {
        topLayer.push(currentBlock);
    } else {
        tower.push([currentBlock]);
    }

    const collapseMessage = reduceStability('place');
    const result = collapseMessage || `You placed ${currentBlock.block_id} back on top of the tower. Stability: ${stability.toFixed(1)}%`;

    // Clear current block after placing
    currentBlock = null;

    return result;
}

// Start a new game
export async function startGame() {
    stability = 100;
    gameActive = true;

    if (blockData.length === 0) await loadBlockData();
    try {
        initializeTower();
    } catch (error) {
        return `Error initializing tower: ${error.message}`;
    }

    pulledBlocks = [];
    return 'A new Jenga game has started! The tower has been successfully constructed with 18 layers. Stability is at 100%. Use !pullblock to pull a block.';
}

// Reset the game
function resetGame() {
    stability = 100;
    gameActive = false;
    tower = [];
    pulledBlocks = [];
    currentBlock = null;
    return 'The Jenga game has been reset. Use !startjenga to begin a new game.';
}

// Handle commands
export async function handleCommand(command) {
    if (command === '!startjenga') return await startGame();
    if (command === '!pullblock') return pullBlock();
    if (command === '!placeblock') return placeBlock();
    if (command === '!resetjenga') return resetGame();
    return 'Unknown command!';
}

// Command handler for UI
async function issueCommand(command) {
    const output = document.getElementById('output');
    const response = await handleCommand(command);
    output.textContent = response;
}
