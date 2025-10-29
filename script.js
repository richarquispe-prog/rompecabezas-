// ==================== Configuración del Juego ====================
const GAME_CONFIG = {
    levels: {
        1: { rows: 3, cols: 2, pieces: 6, points: 100 },
        2: { rows: 4, cols: 2, pieces: 8, points: 200 },
        3: { rows: 4, cols: 3, pieces: 12, points: 300 },
        4: { rows: 5, cols: 3, pieces: 15, points: 400 },
        5: { rows: 6, cols: 3, pieces: 18, points: 500 }
    },
    images: [
        './liluz.jpg',
        './liluz.jpg',
        './liluz.jpg',
        './liluz.jpg',
        './liluz.jpg'
    ],
    messages: {
        error: [
            "¡Ahí no es! ¡Fallaste!",
            "¡Uy! Esa no es su casa",
            "¡Casi! Pero no",
            "¡Nooo! Inténtalo de nuevo",
            "¡Esa pieza va en otro lugar!",
            "¡Ay no! Esa no es",
            "¡Ups! Te equivocaste"
        ],
        success: [
            "¡Ahí es! ¡Perfecto!",
            "¡Genial! Esa es",
            "¡Excelente!",
            "¡Muy bien! ¡Sí señor!",
            "¡Correcto! ¡Eres genial!",
            "¡Perfecto! Esa va ahí",
            "¡Bravo! ¡Lo lograste!"
        ]
    }
};

// ==================== Estado del Juego ====================
let gameState = {
    currentLevel: 1,
    moves: 0,
    errors: 0,
    score: 0,
    pieces: [],
    selectedPiece: null,
    totalPieces: 0
};

// ==================== Elementos del DOM ====================
const elements = {
    startScreen: document.getElementById('startScreen'),
    gameScreen: document.getElementById('gameScreen'),
    currentLevelDisplay: document.getElementById('currentLevel'),
    moveCount: document.getElementById('moveCount'),
    errorCount: document.getElementById('errorCount'),
    scoreDisplay: document.getElementById('score'),
    messageBox: document.getElementById('messageBox'),
    puzzleArea: document.getElementById('puzzleArea'),
    restartBtn: document.getElementById('restartBtn'),
    nextBtn: document.getElementById('nextBtn'),
    backBtn: document.getElementById('backBtn'),
    confettiOverlay: document.getElementById('confettiOverlay')
};

// ==================== Event Listeners Iniciales ====================
document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const level = parseInt(btn.dataset.level);
        startGame(level);
    });
});

elements.restartBtn.addEventListener('click', () => {
    restartLevel();
});

elements.nextBtn.addEventListener('click', () => {
    if (gameState.currentLevel < 5) {
        startGame(gameState.currentLevel + 1);
    } else {
        showFinalMessage();
    }
});

elements.backBtn.addEventListener('click', () => {
    showStartScreen();
});

// ==================== Funciones Principales ====================

function startGame(level) {
    gameState.currentLevel = level;
    gameState.moves = 0;
    gameState.errors = 0;
    gameState.selectedPiece = null;
    
    const config = GAME_CONFIG.levels[level];
    gameState.totalPieces = config.pieces;
    
    elements.startScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');
    elements.nextBtn.classList.add('hidden');
    
    updateDisplay();
    generatePuzzle(level);
}

function generatePuzzle(level) {
    const config = GAME_CONFIG.levels[level];
    const imageUrl = GAME_CONFIG.images[level - 1];
    
    // Limpiar área
    elements.puzzleArea.innerHTML = '';
    
    // Configurar grid
    elements.puzzleArea.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
    
    // Crear piezas en orden y luego desordenar
    const pieceIndices = Array.from({ length: config.pieces }, (_, i) => i);
    shuffleArray(pieceIndices);
    
    gameState.pieces = [];
    pieceIndices.forEach((correctIndex, currentPosition) => {
        const piece = createPuzzlePiece(correctIndex, currentPosition, config, imageUrl);
        elements.puzzleArea.appendChild(piece);
        gameState.pieces.push(piece);
    });
}

function createPuzzlePiece(correctIndex, currentPosition, config, imageUrl) {
    const piece = document.createElement('div');
    piece.className = 'puzzle-piece';
    piece.dataset.correctIndex = correctIndex;
    piece.dataset.currentPosition = currentPosition;
    
    const row = Math.floor(correctIndex / config.cols);
    const col = correctIndex % config.cols;
    
    // Tamaño responsive basado en el viewport - Proporción vertical (3:4)
    const containerWidth = Math.min(window.innerWidth - 60, 450);
    const aspectRatio = 4 / 3; // Imagen vertical (más alta que ancha)
    const containerHeight = containerWidth * aspectRatio;
    
    const pieceWidth = containerWidth / config.cols;
    const pieceHeight = containerHeight / config.rows;
    
    piece.style.backgroundImage = `url(${imageUrl})`;
    piece.style.backgroundSize = `${containerWidth}px ${containerHeight}px`;
    piece.style.backgroundPosition = `-${col * pieceWidth}px -${row * pieceHeight}px`;
    piece.style.width = `${pieceWidth}px`;
    piece.style.height = `${pieceHeight}px`;
    
    // Event listener para click/tap
    piece.addEventListener('click', () => handlePieceClick(piece));
    
    return piece;
}

// ==================== Click/Tap Handlers ====================

function handlePieceClick(piece) {
    // Si no hay pieza seleccionada, seleccionar esta
    if (!gameState.selectedPiece) {
        gameState.selectedPiece = piece;
        piece.classList.add('selected');
        showMessage("✨ ¡Toca otra pieza para intercambiar!", 'success');
    } 
    // Si la misma pieza, deseleccionar
    else if (gameState.selectedPiece === piece) {
        piece.classList.remove('selected');
        gameState.selectedPiece = null;
        showMessage("⚠️ Pieza deseleccionada", 'error');
    } 
    // Si es otra pieza, intercambiar
    else {
        const piece1 = gameState.selectedPiece;
        const piece2 = piece;
        
        swapPieces(piece1, piece2);
        
        // Deseleccionar
        piece1.classList.remove('selected');
        gameState.selectedPiece = null;
    }
}

function swapPieces(piece1, piece2) {
    gameState.moves++;
    
    // Intercambiar posiciones en el DOM
    const parent = piece1.parentNode;
    const sibling1 = piece1.nextSibling === piece2 ? piece1 : piece1.nextSibling;
    
    piece2.parentNode.insertBefore(piece1, piece2);
    parent.insertBefore(piece2, sibling1);
    
    // Intercambiar datasets de posición
    const tempPosition = piece1.dataset.currentPosition;
    piece1.dataset.currentPosition = piece2.dataset.currentPosition;
    piece2.dataset.currentPosition = tempPosition;
    
    // Verificar si están correctas después del intercambio
    checkPiecesPosition(piece1, piece2);
    
    updateDisplay();
}

function checkPiecesPosition(piece1, piece2) {
    const piece1Correct = parseInt(piece1.dataset.correctIndex) === parseInt(piece1.dataset.currentPosition);
    const piece2Correct = parseInt(piece2.dataset.correctIndex) === parseInt(piece2.dataset.currentPosition);
    
    // Verificar piece1
    if (piece1Correct) {
        piece1.classList.add('correct');
        showMessage(getRandomMessage('success'), 'success');
        gameState.score += Math.floor(GAME_CONFIG.levels[gameState.currentLevel].points / gameState.totalPieces);
    } else {
        piece1.classList.remove('correct');
        if (!piece2Correct) {
            showMessage(getRandomMessage('error'), 'error');
            gameState.errors++;
        }
    }
    
    // Verificar piece2
    if (piece2Correct) {
        piece2.classList.add('correct');
        if (!piece1Correct) {
            showMessage(getRandomMessage('success'), 'success');
        }
        gameState.score += Math.floor(GAME_CONFIG.levels[gameState.currentLevel].points / gameState.totalPieces);
    } else {
        piece2.classList.remove('correct');
    }
    
    // Verificar si completó el nivel
    checkLevelComplete();
}

function checkLevelComplete() {
    const allCorrect = gameState.pieces.every(piece => {
        return parseInt(piece.dataset.correctIndex) === parseInt(piece.dataset.currentPosition);
    });
    
    if (allCorrect) {
        setTimeout(() => {
            levelCompleted();
        }, 500);
    }
}

// ==================== Mensajes ====================

function showMessage(text, type) {
    elements.messageBox.textContent = text;
    elements.messageBox.className = `message-box ${type}`;
    elements.messageBox.classList.remove('hidden');
    
    setTimeout(() => {
        elements.messageBox.classList.add('hidden');
    }, 2000);
}

function getRandomMessage(type) {
    const messages = GAME_CONFIG.messages[type];
    return messages[Math.floor(Math.random() * messages.length)];
}

// ==================== Completar Nivel ====================

function levelCompleted() {
    // Bonus por completar con pocos errores
    const errorBonus = Math.max(0, 100 - (gameState.errors * 10));
    gameState.score += errorBonus;
    updateDisplay();
    
    // Animación de victoria
    elements.targetArea.classList.add('victory-animation');
    
    // Confeti
    createConfetti();
    
    // Mensaje de victoria
    if (gameState.currentLevel === 5) {
        showMessage(`🎉 ¡FELICIDADES! ¡Completaste TODOS los niveles! 🎉`, 'success');
        setTimeout(() => {
            showFinalMessage();
        }, 3000);
    } else {
        showMessage(`🎉 ¡Nivel ${gameState.currentLevel} completado! 🎉`, 'success');
        elements.nextBtn.classList.remove('hidden');
    }
    
    setTimeout(() => {
        elements.targetArea.classList.remove('victory-animation');
    }, 1000);
}

function createConfetti() {
    const colors = ['#FF69B4', '#FF1493', '#FFB6C1', '#C71585', '#FFC0CB'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        
        elements.confettiOverlay.appendChild(confetti);
        elements.confettiOverlay.classList.remove('hidden');
    }
    
    setTimeout(() => {
        elements.confettiOverlay.innerHTML = '';
        elements.confettiOverlay.classList.add('hidden');
    }, 5000);
}

function showFinalMessage() {
    elements.gameScreen.classList.add('hidden');
    elements.startScreen.classList.remove('hidden');
    
    const container = document.querySelector('.start-container');
    container.innerHTML = `
        <h1 class="game-title">🎊 ¡FELICIDADES! 🎊</h1>
        <p class="subtitle">¡Has completado todos los niveles!</p>
        <div class="final-stats">
            <h2 style="color: var(--pink-dark); margin: 30px 0;">Estadísticas Finales</h2>
            <div style="background: linear-gradient(135deg, var(--pink-light), var(--pink-medium)); padding: 30px; border-radius: 20px; color: white; font-size: 1.3rem;">
                <p>🎯 Puntuación Total: <strong>${gameState.score}</strong></p>
                <p>📊 Movimientos Totales: <strong>${gameState.moves}</strong></p>
                <p>❌ Errores: <strong>${gameState.errors}</strong></p>
            </div>
            <button class="level-btn" onclick="location.reload()" style="margin-top: 30px; width: auto;">
                🔄 Jugar de Nuevo
            </button>
        </div>
    `;
    
    createConfetti();
}

// ==================== Utilidades ====================

function updateDisplay() {
    elements.currentLevelDisplay.textContent = gameState.currentLevel;
    elements.moveCount.textContent = gameState.moves;
    elements.errorCount.textContent = gameState.errors;
    elements.scoreDisplay.textContent = gameState.score;
}

function restartLevel() {
    startGame(gameState.currentLevel);
}

function showStartScreen() {
    elements.gameScreen.classList.add('hidden');
    elements.startScreen.classList.remove('hidden');
    location.reload();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ==================== Redimensionamiento Responsive ====================

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Solo redimensionar si estamos en pantalla de juego
        if (!elements.gameScreen.classList.contains('hidden')) {
            const currentLevel = gameState.currentLevel;
            if (currentLevel && gameState.pieces.length > 0) {
                // Guardar el orden actual de las piezas
                const currentOrder = gameState.pieces.map(piece => ({
                    correctIndex: piece.dataset.correctIndex,
                    currentPosition: piece.dataset.currentPosition,
                    isCorrect: piece.classList.contains('correct')
                }));
                
                // Regenerar el puzzle con el orden guardado
                const config = GAME_CONFIG.levels[currentLevel];
                const imageUrl = GAME_CONFIG.images[currentLevel - 1];
                
                elements.puzzleArea.innerHTML = '';
                elements.puzzleArea.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
                
                gameState.pieces = [];
                currentOrder.forEach((data, index) => {
                    const piece = createPuzzlePiece(parseInt(data.correctIndex), parseInt(data.currentPosition), config, imageUrl);
                    if (data.isCorrect) {
                        piece.classList.add('correct');
                    }
                    elements.puzzleArea.appendChild(piece);
                    gameState.pieces.push(piece);
                });
            }
        }
    }, 300);
});

// ==================== Inicialización ====================
console.log('🧩 Juego de Rompecabezas Rosa cargado correctamente!');
console.log('Selecciona un nivel para empezar 🎮');

