document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('sudoku-board');
    const newGameBtn = document.getElementById('new-game-btn');
    const difficultySelect = document.getElementById('difficulty-select');
    const themeToggle = document.getElementById('theme-toggle');
    const numpadBtns = document.querySelectorAll('.numpad-btn');
    const notesBtn = document.getElementById('notes-btn');
    const hintBtn = document.getElementById('hint-btn');
    const eraseBtn = document.getElementById('erase-btn');
    const timerElement = document.getElementById('timer');

    let sudoku = new Sudoku();
    let selectedCell = null;
    let isNotesMode = false;
    let timerInterval = null;
    let seconds = 0;

    function init() {
        setupBoard();
        setupEventListeners();
        startNewGame();
    }

    function setupBoard() {
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.classList.add('sudoku-cell');
            cell.dataset.index = i;

            const row = Math.floor(i / 9);
            const col = i % 9;
            if (row % 3 === 2 && row < 8) cell.style.borderBottomWidth = '3px';
            if (col % 3 === 2 && col < 8) cell.style.borderRightWidth = '3px';

            const notesGrid = document.createElement('div');
            notesGrid.classList.add('notes-grid');
            for (let j = 1; j <= 9; j++) {
                const noteCell = document.createElement('div');
                noteCell.classList.add('note-cell');
                noteCell.dataset.note = j;
                notesGrid.appendChild(noteCell);
            }
            cell.appendChild(notesGrid);

            boardElement.appendChild(cell);
        }
    }

    function startNewGame() {
        const loader = document.getElementById('loader-overlay');
        const difficulty = difficultySelect.value;

        loader.classList.remove('hidden');

        setTimeout(() => {
            sudoku.generate(difficulty);
            renderBoard();
            startTimer();
            loader.classList.add('hidden');
        }, 10); // 10ms to ensure paint
    }

    function startTimer() {
        clearInterval(timerInterval);
        seconds = 0;
        timerElement.textContent = formatTime(seconds);
        timerInterval = setInterval(() => {
            seconds++;
            timerElement.textContent = formatTime(seconds);
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function checkWinCondition() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (sudoku.puzzle[i][j] === 0 || sudoku.puzzle[i][j] !== sudoku.solution[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }

    function renderBoard() {
        const boardElement = document.getElementById('sudoku-board');
        if (!boardElement) return; // Guard clause
        const cells = boardElement.children;
        for (let i = 0; i < 81; i++) {
            const cell = cells[i];
            const row = Math.floor(i / 9);
            const col = i % 9;
            const puzzleValue = sudoku.puzzle[row][col];
            const solutionValue = sudoku.solution[row][col];

            cell.textContent = ''; // Clear main number
            cell.classList.remove('fixed', 'user-input', 'error');

            // Clear notes
            const noteCells = cell.querySelector('.notes-grid').children;
            for(let k = 0; k < noteCells.length; k++) {
                noteCells[k].textContent = '';
            }

            if (puzzleValue !== 0) {
                cell.textContent = puzzleValue;
                cell.classList.add('fixed');
            }
        }
    }

    function handleCellClick(e) {
        const cell = e.target.closest('.sudoku-cell');
        if (!cell) return;

        if (selectedCell) {
            selectedCell.classList.remove('selected');
        }
        selectedCell = cell;
        selectedCell.classList.add('selected');
        highlightSiblings(selectedCell);
    }

    function highlightSiblings(cell) {
        // Clear previous highlights
        document.querySelectorAll('.sudoku-cell.highlight').forEach(c => c.classList.remove('highlight'));

        const index = parseInt(cell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;

        // Highlight row and column
        for (let i = 0; i < 9; i++) {
            const rowIndex = row * 9 + i;
            const colIndex = i * 9 + col;
            document.querySelector(`[data-index='${rowIndex}']`).classList.add('highlight');
            document.querySelector(`[data-index='${colIndex}']`).classList.add('highlight');
        }

        // Highlight block
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = startRow; i < startRow + 3; i++) {
            for (let j = startCol; j < startCol + 3; j++) {
                const blockIndex = i * 9 + j;
                document.querySelector(`[data-index='${blockIndex}']`).classList.add('highlight');
            }
        }
    }


    function handleNumpadClick(e) {
        if (!selectedCell || selectedCell.classList.contains('fixed')) {
            return;
        }

        const num = e.target.dataset.num;
        if (!num) return;

        const index = parseInt(selectedCell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;

        if (isNotesMode) {
            toggleNote(row, col, parseInt(num));
        } else {
            setCellValue(row, col, parseInt(num));
        }
    }

    function setCellValue(row, col, value) {
        const isCorrect = sudoku.solution[row][col] === value;

        // Update the model
        sudoku.puzzle[row][col] = value;
        sudoku.notes[row][col].clear(); // Clear notes from model

        // Update the view
        selectedCell.textContent = value;
        selectedCell.classList.add('user-input');

        if (isCorrect) {
            selectedCell.classList.remove('error');
            if (checkWinCondition()) {
                stopTimer();
                setTimeout(() => {
                    alert(`Congratulations! You solved the puzzle in ${formatTime(seconds)}.`);
                }, 100); // Timeout to allow UI to update
            }
        } else {
            selectedCell.classList.add('error');
        }

        // Clear notes for that cell from view
        const noteCells = selectedCell.querySelector('.notes-grid').children;
        for (let k = 0; k < noteCells.length; k++) {
            noteCells[k].textContent = '';
        }
    }

    function toggleNote(row, col, num) {
        // If there's a number in the cell, can't add notes
        if (sudoku.puzzle[row][col] !== 0) {
            return;
        }

        const noteSet = sudoku.notes[row][col];
        const noteCell = selectedCell.querySelector(`.note-cell[data-note='${num}']`);

        if (noteSet.has(num)) {
            noteSet.delete(num);
            noteCell.textContent = '';
        } else {
            noteSet.add(num);
            noteCell.textContent = num;
        }
    }

    function handleErase() {
        if (!selectedCell || selectedCell.classList.contains('fixed')) {
            return;
        }

        const index = parseInt(selectedCell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;

        // Update model
        sudoku.puzzle[row][col] = 0;
        sudoku.notes[row][col].clear(); // Clear notes from model

        // Update view
        selectedCell.textContent = '';
        selectedCell.classList.remove('user-input', 'error');

        // Clear notes from view
        const noteCells = selectedCell.querySelector('.notes-grid').children;
        for (let k = 0; k < noteCells.length; k++) {
            noteCells[k].textContent = '';
        }
    }

    function setupEventListeners() {
        document.addEventListener('keydown', handleKeyPress);
        boardElement.addEventListener('click', handleCellClick);
        newGameBtn.addEventListener('click', startNewGame);
        difficultySelect.addEventListener('change', startNewGame);
        numpadBtns.forEach(btn => btn.addEventListener('click', handleNumpadClick));
        eraseBtn.addEventListener('click', handleErase);

        notesBtn.addEventListener('click', () => {
            isNotesMode = !isNotesMode;
            notesBtn.classList.toggle('active');
        });

        hintBtn.addEventListener('click', () => {
            if (!selectedCell || selectedCell.classList.contains('fixed')) {
                return;
            }

            const index = parseInt(selectedCell.dataset.index);
            const row = Math.floor(index / 9);
            const col = index % 9;

            const solutionValue = sudoku.solution[row][col];

            if (sudoku.puzzle[row][col] !== solutionValue) {
                setCellValue(row, col, solutionValue);
            }
        });

        themeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
        });
    }

    function handleKeyPress(e) {
        if (!selectedCell) return;

        const row = Math.floor(parseInt(selectedCell.dataset.index) / 9);
        const col = parseInt(selectedCell.dataset.index) % 9;

        if (e.key >= '1' && e.key <= '9') {
            if (!selectedCell.classList.contains('fixed')) {
                if (isNotesMode) {
                    toggleNote(row, col, parseInt(e.key));
                } else {
                    setCellValue(row, col, parseInt(e.key));
                }
            }
        } else if (e.key.startsWith('Arrow')) {
            e.preventDefault(); // Prevent page scrolling
            moveSelection(e.key);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            if (!selectedCell.classList.contains('fixed')) {
                handleErase();
            }
        } else if (e.key.toLowerCase() === 'n') {
            e.preventDefault();
            notesBtn.click();
        }
    }

    function moveSelection(key) {
        const currentIndex = parseInt(selectedCell.dataset.index);
        const currentCol = currentIndex % 9;
        let newIndex;

        if (key === 'ArrowUp') {
            newIndex = currentIndex - 9;
        } else if (key === 'ArrowDown') {
            newIndex = currentIndex + 9;
        } else if (key === 'ArrowLeft') {
            if (currentCol === 0) return; // Don't wrap
            newIndex = currentIndex - 1;
        } else if (key === 'ArrowRight') {
            if (currentCol === 8) return; // Don't wrap
            newIndex = currentIndex + 1;
        }

        if (newIndex >= 0 && newIndex < 81) {
            const newCell = boardElement.children[newIndex];
            if (newCell) newCell.click();
        }
    }

    init();
});
