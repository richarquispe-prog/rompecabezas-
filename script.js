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
    piece.draggable = true;
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
    
    // Event listener para click/tap (intercambiar)
    piece.addEventListener('click', (e) => {
        // Solo si no está arrastrando
        if (!piece.classList.contains('dragging')) {
            handlePieceClick(piece);
        }
    });
    
    // Event listeners para drag (desktop)
    piece.addEventListener('dragstart', handleDragStart);
    piece.addEventListener('dragend', handleDragEnd);
    piece.addEventListener('dragover', handleDragOver);
    piece.addEventListener('drop', handleDrop);
    
    // Event listeners para touch (mobile) - drag & drop táctil
    piece.addEventListener('touchstart', handleTouchStart, { passive: false });
    piece.addEventListener('touchmove', handleTouchMove, { passive: false });
    piece.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return piece;
}

// ==================== Click/Tap Handlers (Intercambio) ====================

let clickTimeout = null;

function handlePieceClick(piece) {
    // Cancelar si se está arrastrando
    if (piece.classList.contains('dragging')) return;
    
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

// ==================== Drag & Drop Handlers (Desktop) ====================

let draggedPiece = null;

function handleDragStart(e) {
    draggedPiece = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    
    // Deseleccionar si estaba seleccionado
    if (gameState.selectedPiece === e.target) {
        gameState.selectedPiece = null;
        e.target.classList.remove('selected');
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedPiece = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (e.target.classList.contains('puzzle-piece')) {
        e.target.classList.add('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    if (!draggedPiece) return;
    
    const targetPiece = e.target;
    
    // Solo permitir drop sobre otra pieza
    if (targetPiece.classList.contains('puzzle-piece') && targetPiece !== draggedPiece) {
        targetPiece.classList.remove('drag-over');
        swapPieces(draggedPiece, targetPiece);
    }
}

// ==================== Touch Handlers (Mobile Drag & Drop) ====================

let touchedPiece = null;
let touchStartX = 0;
let touchStartY = 0;
let touchMoved = false;
let touchStartTime = 0;

function handleTouchStart(e) {
    touchedPiece = e.target;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchMoved = false;
    touchStartTime = Date.now();
    
    // Deseleccionar si estaba seleccionado
    if (gameState.selectedPiece === touchedPiece) {
        gameState.selectedPiece = null;
        touchedPiece.classList.remove('selected');
    }
}

function handleTouchMove(e) {
    if (!touchedPiece) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = Math.abs(touch.clientY - touchStartY);
    
    // Si se movió más de 10px, es un drag
    if (deltaX > 10 || deltaY > 10) {
        e.preventDefault();
        touchMoved = true;
        touchedPiece.classList.add('dragging');
        
        // Mover visualmente la pieza
        touchedPiece.style.position = 'fixed';
        touchedPiece.style.left = touch.clientX - (touchedPiece.offsetWidth / 2) + 'px';
        touchedPiece.style.top = touch.clientY - (touchedPiece.offsetHeight / 2) + 'px';
        touchedPiece.style.zIndex = '1000';
        touchedPiece.style.opacity = '0.8';
        
        // Resaltar pieza debajo
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Remover highlight de todas las piezas
        document.querySelectorAll('.puzzle-piece').forEach(p => {
            if (p !== touchedPiece) {
                p.classList.remove('drag-over');
            }
        });
        
        // Agregar highlight a la pieza debajo
        if (elementBelow && elementBelow.classList.contains('puzzle-piece') && elementBelow !== touchedPiece) {
            elementBelow.classList.add('drag-over');
        }
    }
}

function handleTouchEnd(e) {
    if (!touchedPiece) return;
    
    const touchDuration = Date.now() - touchStartTime;
    const touch = e.changedTouches[0];
    
    // Si fue un drag (se movió)
    if (touchMoved) {
        e.preventDefault();
        
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Resetear estilos
        touchedPiece.style.position = '';
        touchedPiece.style.left = '';
        touchedPiece.style.top = '';
        touchedPiece.style.zIndex = '';
        touchedPiece.style.opacity = '';
        touchedPiece.classList.remove('dragging');
        
        // Remover highlights
        document.querySelectorAll('.puzzle-piece').forEach(p => {
            p.classList.remove('drag-over');
        });
        
        // Si se soltó sobre otra pieza, intercambiar
        if (elementBelow && elementBelow.classList.contains('puzzle-piece') && elementBelow !== touchedPiece) {
            swapPieces(touchedPiece, elementBelow);
        } else {
            showMessage("⚠️ Arrastra sobre otra pieza para intercambiar", 'error');
        }
    }
    // Si fue un tap rápido (no se movió), es un click
    else if (touchDuration < 300) {
        // Dejar que el evento click lo maneje
    }
    
    touchedPiece = null;
    touchMoved = false;
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
    
    let hasCorrect = false;
    let hasError = false;
    
    // Verificar piece1
    if (piece1Correct) {
        piece1.classList.add('correct');
        hasCorrect = true;
        gameState.score += Math.floor(GAME_CONFIG.levels[gameState.currentLevel].points / gameState.totalPieces);
    } else {
        piece1.classList.remove('correct');
        hasError = true;
    }
    
    // Verificar piece2
    if (piece2Correct) {
        piece2.classList.add('correct');
        hasCorrect = true;
        gameState.score += Math.floor(GAME_CONFIG.levels[gameState.currentLevel].points / gameState.totalPieces);
    } else {
        piece2.classList.remove('correct');
        hasError = true;
    }
    
    // Mostrar mensaje según resultado
    if (hasCorrect && !hasError) {
        // Ambas correctas
        showMessage("🎯 " + getRandomMessage('success') + " ¡Ambas piezas correctas!", 'success');
    } else if (hasCorrect) {
        // Una correcta, una incorrecta
        showMessage("👍 " + getRandomMessage('success') + " ¡Pero la otra no!", 'success');
    } else {
        // Ambas incorrectas
        showMessage("❌ " + getRandomMessage('error'), 'error');
        gameState.errors++;
    }
    
    updateDisplay();
    
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

let messageTimeout = null;

function showMessage(text, type) {
    // Limpiar timeout anterior si existe
    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }
    
    elements.messageBox.textContent = text;
    elements.messageBox.className = `message-box ${type}`;
    elements.messageBox.classList.remove('hidden');
    
    // Duración más larga para mensajes de victoria
    const duration = type === 'success' && text.includes('completado') ? 3500 : 2500;
    
    messageTimeout = setTimeout(() => {
        elements.messageBox.classList.add('hidden');
    }, duration);
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
    elements.puzzleArea.classList.add('victory-animation');
    
    // Confeti
    createConfetti();
    
    // Mensaje de victoria
    if (gameState.currentLevel === 5) {
        showMessage(`🎉 ¡FELICIDADES! ¡Completaste TODOS los niveles! 🎉`, 'success');
        setTimeout(() => {
            showFinalMessage();
        }, 3000);
    } else {
        showMessage(`🎊 ¡Nivel ${gameState.currentLevel} completado! Avanzando al nivel ${gameState.currentLevel + 1}...`, 'success');
        
        // Avanzar automáticamente al siguiente nivel después de 3 segundos
        setTimeout(() => {
            startGame(gameState.currentLevel + 1);
        }, 3000);
    }
    
    setTimeout(() => {
        elements.puzzleArea.classList.remove('victory-animation');
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

