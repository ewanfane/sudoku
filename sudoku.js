class Sudoku {
    constructor() {
        this.grid = this.createEmptyGrid();
        this.solution = null;
        this.puzzle = null;
        this.notes = this.createEmptyNotes();
        this.difficultyLevels = {
            easy: 35,
            medium: 40,
            hard: 45,
            'very-hard': 50
        };
    }

    createEmptyGrid() {
        return Array(9).fill(0).map(() => Array(9).fill(0));
    }

    createEmptyNotes() {
        return Array(9).fill(0).map(() => Array(9).fill(0).map(() => new Set()));
    }

    generate(difficulty) {
        // Step 1: Create a fully solved Sudoku board
        this.grid = this.createEmptyGrid();
        this.solve(this.grid);
        this.solution = JSON.parse(JSON.stringify(this.grid));

        // Step 2: Remove numbers to create the puzzle
        this.puzzle = this.createPuzzle(this.solution, difficulty);

        // Step 3: Reset notes
        this.notes = this.createEmptyNotes();
    }

    solve(grid = this.grid) {
        const emptySpot = this.findEmpty(grid);
        if (!emptySpot) {
            return true; // Solved
        }

        const [row, col] = emptySpot;
        const numbers = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for (let num of numbers) {
            if (this.isValid(grid, row, col, num)) {
                grid[row][col] = num;

                if (this.solve(grid)) {
                    return true;
                }

                grid[row][col] = 0; // Backtrack
            }
        }

        return false; // No solution found
    }

    findEmpty(grid) {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] === 0) {
                    return [r, c];
                }
            }
        }
        return null;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    createPuzzle(solution, difficulty) {
        let puzzle = JSON.parse(JSON.stringify(solution));
        const removals = this.difficultyLevels[difficulty] || 51; // Default to medium

        let cells = [];
        for (let i = 0; i < 81; i++) {
            cells.push(i);
        }
        cells = this.shuffle(cells);

        let removedCount = 0;
        for (let i = 0; i < cells.length; i++) {
            if (removedCount >= removals) {
                break;
            }

            const row = Math.floor(cells[i] / 9);
            const col = cells[i] % 9;

            if (puzzle[row][col] === 0) {
                continue;
            }

            const backup = puzzle[row][col];
            puzzle[row][col] = 0;

            let tempPuzzle = JSON.parse(JSON.stringify(puzzle));
            if (this.countSolutions(tempPuzzle) !== 1) {
                puzzle[row][col] = backup;
            } else {
                removedCount++;
            }
        }

        return puzzle;
    }

    countSolutions(grid) {
        let solutions = 0;

        const solve = () => {
            const empty = this.findEmpty(grid);
            if (!empty) {
                solutions++;
                return;
            }

            const [row, col] = empty;
            for (let num = 1; num <= 9; num++) {
                if (this.isValid(grid, row, col, num)) {
                    grid[row][col] = num;
                    solve();
                    if (solutions > 1) return; // Early exit
                }
            }
            grid[row][col] = 0; // Backtrack
        };

        solve();
        return solutions;
    }

    // Helper function to check if a number is valid in a given cell
    isValid(grid, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (grid[row][x] === num) {
                return false;
            }
        }
        // Check column
        for (let x = 0; x < 9; x++) {
            if (grid[x][col] === num) {
                return false;
            }
        }
        // Check 3x3 box
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[startRow + i][startCol + j] === num) {
                    return false;
                }
            }
        }
        return true;
    }
}
