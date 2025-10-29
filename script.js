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
    correctPlacements: 0,
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
    piecesArea: document.getElementById('piecesArea'),
    targetArea: document.getElementById('targetArea'),
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
    gameState.correctPlacements = 0;
    
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
    
    // Limpiar áreas
    elements.piecesArea.innerHTML = '';
    elements.targetArea.innerHTML = '';
    
    // Configurar grid
    elements.piecesArea.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
    elements.targetArea.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
    
    // Crear slots de destino
    const slots = [];
    for (let i = 0; i < config.pieces; i++) {
        const slot = createDropSlot(i, config);
        elements.targetArea.appendChild(slot);
        slots.push(slot);
    }
    
    // Crear piezas
    const pieceIndices = Array.from({ length: config.pieces }, (_, i) => i);
    shuffleArray(pieceIndices);
    
    gameState.pieces = [];
    pieceIndices.forEach(index => {
        const piece = createPuzzlePiece(index, config, imageUrl);
        elements.piecesArea.appendChild(piece);
        gameState.pieces.push(piece);
    });
}

function createPuzzlePiece(index, config, imageUrl) {
    const piece = document.createElement('div');
    piece.className = 'puzzle-piece';
    piece.draggable = true;
    piece.dataset.correctIndex = index;
    
    const row = Math.floor(index / config.cols);
    const col = index % config.cols;
    
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
    
    // Guardar datos para responsive
    piece.dataset.row = row;
    piece.dataset.col = col;
    
    // Event listeners para drag (desktop)
    piece.addEventListener('dragstart', handleDragStart);
    piece.addEventListener('dragend', handleDragEnd);
    
    // Event listeners para touch (mobile)
    piece.addEventListener('touchstart', handleTouchStart, { passive: false });
    piece.addEventListener('touchmove', handleTouchMove, { passive: false });
    piece.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return piece;
}

function createDropSlot(index, config) {
    const slot = document.createElement('div');
    slot.className = 'drop-slot';
    slot.dataset.index = index;
    
    const row = Math.floor(index / config.cols);
    const col = index % config.cols;
    
    // Tamaño responsive basado en el viewport - Proporción vertical (3:4)
    const containerWidth = Math.min(window.innerWidth - 60, 450);
    const aspectRatio = 4 / 3; // Imagen vertical (más alta que ancha)
    const containerHeight = containerWidth * aspectRatio;
    
    const pieceWidth = containerWidth / config.cols;
    const pieceHeight = containerHeight / config.rows;
    
    slot.style.width = `${pieceWidth}px`;
    slot.style.height = `${pieceHeight}px`;
    
    // Event listeners para drop
    slot.addEventListener('dragover', handleDragOver);
    slot.addEventListener('drop', handleDrop);
    slot.addEventListener('dragleave', handleDragLeave);
    
    return slot;
}

// ==================== Drag & Drop Handlers ====================

let draggedPiece = null;
let touchedPiece = null;
let touchStartX = 0;
let touchStartY = 0;

function handleDragStart(e) {
    draggedPiece = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!e.target.classList.contains('filled')) {
        e.target.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    e.target.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.target.classList.remove('drag-over');
    
    const slot = e.target;
    
    // No permitir drop en slots ya ocupados
    if (slot.classList.contains('filled')) {
        return;
    }
    
    const correctIndex = parseInt(draggedPiece.dataset.correctIndex);
    const slotIndex = parseInt(slot.dataset.index);
    
    validatePiecePlacement(draggedPiece, slot, correctIndex, slotIndex);
}

// ==================== Touch Handlers (Mobile) ====================

function handleTouchStart(e) {
    e.preventDefault();
    touchedPiece = e.target;
    touchedPiece.classList.add('touching');
    
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

function handleTouchMove(e) {
    e.preventDefault();
    
    if (!touchedPiece) return;
    
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    
    // Mover visualmente la pieza con el dedo
    touchedPiece.style.position = 'fixed';
    touchedPiece.style.left = currentX - (touchedPiece.offsetWidth / 2) + 'px';
    touchedPiece.style.top = currentY - (touchedPiece.offsetHeight / 2) + 'px';
    touchedPiece.style.zIndex = '1000';
    
    // Resaltar el slot debajo del dedo
    const elementBelow = document.elementFromPoint(currentX, currentY);
    
    // Remover highlight de todos los slots
    document.querySelectorAll('.drop-slot').forEach(slot => {
        slot.classList.remove('drag-over');
    });
    
    // Agregar highlight al slot debajo si existe
    if (elementBelow && elementBelow.classList.contains('drop-slot')) {
        if (!elementBelow.classList.contains('filled')) {
            elementBelow.classList.add('drag-over');
        }
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    
    if (!touchedPiece) return;
    
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Resetear estilos
    touchedPiece.style.position = '';
    touchedPiece.style.left = '';
    touchedPiece.style.top = '';
    touchedPiece.style.zIndex = '';
    touchedPiece.classList.remove('touching');
    
    // Remover highlight de todos los slots
    document.querySelectorAll('.drop-slot').forEach(slot => {
        slot.classList.remove('drag-over');
    });
    
    // Verificar si se soltó en un slot válido
    if (elementBelow && elementBelow.classList.contains('drop-slot')) {
        const slot = elementBelow;
        
        if (!slot.classList.contains('filled')) {
            const correctIndex = parseInt(touchedPiece.dataset.correctIndex);
            const slotIndex = parseInt(slot.dataset.index);
            
            validatePiecePlacement(touchedPiece, slot, correctIndex, slotIndex);
        }
    }
    
    touchedPiece = null;
}

// ==================== Validación de Colocación ====================

function validatePiecePlacement(piece, slot, correctIndex, slotIndex) {
    gameState.moves++;
    updateDisplay();
    
    // Verificar si es correcto
    if (correctIndex === slotIndex) {
        // ¡Correcto!
        placePieceCorrectly(piece, slot);
        showMessage(getRandomMessage('success'), 'success');
        gameState.correctPlacements++;
        gameState.score += Math.floor(GAME_CONFIG.levels[gameState.currentLevel].points / gameState.totalPieces);
        updateDisplay();
        
        // Verificar si completó el nivel
        if (gameState.correctPlacements === gameState.totalPieces) {
            setTimeout(() => {
                levelCompleted();
            }, 500);
        }
    } else {
        // Incorrecto
        piece.classList.add('incorrect');
        showMessage(getRandomMessage('error'), 'error');
        gameState.errors++;
        updateDisplay();
        
        setTimeout(() => {
            piece.classList.remove('incorrect');
        }, 500);
    }
}

function placePieceCorrectly(piece, slot) {
    piece.classList.add('correct');
    piece.draggable = false;
    slot.classList.add('filled');
    
    // Mover la pieza al slot
    slot.appendChild(piece);
    
    // Ajustar estilos
    piece.style.width = '100%';
    piece.style.height = '100%';
    piece.style.margin = '0';
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
            // Regenerar las piezas con el nuevo tamaño
            if (currentLevel && gameState.pieces.length > 0) {
                // Guardar el estado actual de piezas colocadas
                const placedPieces = [];
                document.querySelectorAll('.drop-slot.filled').forEach(slot => {
                    const piece = slot.querySelector('.puzzle-piece');
                    if (piece) {
                        placedPieces.push({
                            slotIndex: slot.dataset.index,
                            pieceIndex: piece.dataset.correctIndex
                        });
                    }
                });
                
                // Regenerar el puzzle
                generatePuzzle(currentLevel);
                
                // Restaurar las piezas colocadas
                placedPieces.forEach(placement => {
                    const piece = document.querySelector(`.puzzle-piece[data-correct-index="${placement.pieceIndex}"]`);
                    const slot = document.querySelector(`.drop-slot[data-index="${placement.slotIndex}"]`);
                    if (piece && slot) {
                        placePieceCorrectly(piece, slot);
                    }
                });
            }
        }
    }, 300);
});

// ==================== Inicialización ====================
console.log('🧩 Juego de Rompecabezas Rosa cargado correctamente!');
console.log('Selecciona un nivel para empezar 🎮');

