class PuzzleGame {
    constructor() {
        this.board = [];
        this.moves = 0;
        this.size = 4;
        this.boardElement = document.getElementById('board');
        this.moveCountElement = document.getElementById('moveCount');
        this.difficultySelect = document.getElementById('difficulty');
        this.themeSelect = document.getElementById('theme');
        this.isSolving = false;

        this.difficultySelect.addEventListener('change', () => this.changeDifficulty());
        this.themeSelect.addEventListener('change', () => this.changeTheme());

        this.changeTheme();
        this.initializeBoard();
        this.render();
    }

    changeDifficulty() {
        this.size = parseInt(this.difficultySelect.value);
        this.resetGame();
    }

    changeTheme() {
        const themes = {
            default: {
                '--board-color': '#333',
                '--tile-color': '#fff',
                '--tile-hover-color': '#eee',
                '--text-color': '#000'
            },
            dark: {
                '--board-color': '#000',
                '--tile-color': '#333',
                '--tile-hover-color': '#444',
                '--text-color': '#fff'
            },
            blue: {
                '--board-color': '#1a237e',
                '--tile-color': '#bbdefb',
                '--tile-hover-color': '#90caf9',
                '--text-color': '#0d47a1'
            },
            green: {
                '--board-color': '#1b5e20',
                '--tile-color': '#c8e6c9',
                '--tile-hover-color': '#a5d6a7',
                '--text-color': '#2e7d32'
            }
        };

        const theme = themes[this.themeSelect.value];
        for (const [property, value] of Object.entries(theme)) {
            document.documentElement.style.setProperty(property, value);
        }
    }

    initializeBoard() {
        this.board = Array.from({length: this.size * this.size}, (_, i) => i);
        this.shuffleBoard();
    }

    shuffleBoard() {
        for (let i = this.board.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.board[i], this.board[j]] = [this.board[j], this.board[i]];
        }
        while (!this.isSolvable()) {
            this.shuffleBoard();
        }
    }

    isSolvable() {
        let inversions = 0;
        const emptyTileRow = Math.floor(this.board.indexOf(0) / this.size);

        for (let i = 0; i < this.board.length - 1; i++) {
            for (let j = i + 1; j < this.board.length; j++) {
                if (this.board[i] && this.board[j] && this.board[i] > this.board[j]) {
                    inversions++;
                }
            }
        }

        if (this.size % 2 === 1) {
            return inversions % 2 === 0;
        } else {
            return (inversions + emptyTileRow) % 2 === 0;
        }
    }

    render() {
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        
        for (let i = 0; i < this.board.length; i++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            if (this.board[i] === 0) {
                tile.classList.add('empty');
            } else {
                tile.textContent = this.board[i];
                tile.addEventListener('click', () => this.moveTile(i));
            }
            this.boardElement.appendChild(tile);
        }
        this.moveCountElement.textContent = this.moves;
    }

    async moveTile(index, skipCheck = false) {
        if (this.isSolving && !skipCheck) return;

        const emptyIndex = this.board.indexOf(0);
        
        if (this.isAdjacent(index, emptyIndex)) {
            [this.board[index], this.board[emptyIndex]] = [this.board[emptyIndex], this.board[index]];
            this.moves++;
            this.render();
            
            if (!skipCheck && this.isComplete()) {
                setTimeout(() => {
                    alert(`おめでとうございます！\n移動回数: ${this.moves}回`);
                }, 100);
            }
            return true;
        }
        return false;
    }

    isAdjacent(index1, index2) {
        const row1 = Math.floor(index1 / this.size);
        const col1 = index1 % this.size;
        const row2 = Math.floor(index2 / this.size);
        const col2 = index2 % this.size;
        
        return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
    }

    isComplete() {
        for (let i = 0; i < this.board.length - 1; i++) {
            if (this.board[i] !== i + 1) return false;
        }
        return this.board[this.board.length - 1] === 0;
    }

    resetGame() {
        if (this.isSolving) return;
        this.moves = 0;
        this.initializeBoard();
        this.render();
    }

    async surrender() {
        if (this.isSolving) return;

        // サイズごとの状態数を計算
        const factorial = (n) => {
            let result = 1;
            for (let i = 2; i <= n; i++) result *= i;
            return result;
        };
        const stateCount = factorial(this.size * this.size - 1); // 空白を除いた数字の順列

        // サイズが3x3より大きい場合
        if (this.size > 3) {
            let message = '自動解決できません。\n\n';
            message += `${this.size}x${this.size}パズルの場合、\n`;
            message += `可能な状態数は約${stateCount.toLocaleString()}通りです。\n\n`;
            message += '計算量が膨大なため、ブラウザでの自動解決は3x3サイズのみ対応しています。';
            alert(message);
            return;
        }

        if (!confirm('本当に降参しますか？自動で解決します。')) return;

        const surrenderButton = document.querySelector('.surrender');
        surrenderButton.disabled = true;
        surrenderButton.textContent = '解決中...';
        this.isSolving = true;

        try {
            await this.solveAutomatically();
            alert('パズルを解決しました！');
        } catch (error) {
            console.error('解決中にエラーが発生:', error);
            alert('解決中にエラーが発生しました。');
        } finally {
            this.isSolving = false;
            surrenderButton.disabled = false;
            surrenderButton.textContent = '降参';
        }
    }

    // 新しい解決アルゴリズム
    async solveAutomatically() {
        const solution = this.findSolution();
        if (!solution) {
            throw new Error('解決策が見つかりませんでした。');
        }

        // 解決策を1手ずつ実行
        for (const move of solution) {
            await this.moveTile(move, true);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    findSolution() {
        const goalState = Array.from({length: this.size * this.size}, (_, i) => (i + 1) % (this.size * this.size));
        const startState = [...this.board];
        
        // 状態を文字列に変換する関数
        const stateToString = state => state.join(',');
        
        // マンハッタン距離を計算する関数
        const getManhattanDistance = (state) => {
            let distance = 0;
            for (let i = 0; i < state.length; i++) {
                if (state[i] !== 0) {
                    const currentRow = Math.floor(i / this.size);
                    const currentCol = i % this.size;
                    const goalPos = state[i] - 1;
                    const goalRow = Math.floor(goalPos / this.size);
                    const goalCol = goalPos % this.size;
                    distance += Math.abs(currentRow - goalRow) + Math.abs(currentCol - goalCol);
                }
            }
            return distance;
        };

        // 可能な移動を取得する関数
        const getPossibleMoves = (state) => {
            const emptyIndex = state.indexOf(0);
            const moves = [];
            const row = Math.floor(emptyIndex / this.size);
            const col = emptyIndex % this.size;

            // 上下左右の移動をチェック
            if (row > 0) moves.push(emptyIndex - this.size);
            if (row < this.size - 1) moves.push(emptyIndex + this.size);
            if (col > 0) moves.push(emptyIndex - 1);
            if (col < this.size - 1) moves.push(emptyIndex + 1);

            return moves;
        };

        // A*アルゴリズムの実装
        const openSet = new Set([stateToString(startState)]);
        const cameFrom = new Map();
        const gScore = new Map([[stateToString(startState), 0]]);
        const fScore = new Map([[stateToString(startState), getManhattanDistance(startState)]]);

        while (openSet.size > 0) {
            // fScoreが最小の状態を選択
            let current = null;
            let minFScore = Infinity;
            for (const stateStr of openSet) {
                const score = fScore.get(stateStr);
                if (score < minFScore) {
                    minFScore = score;
                    current = stateStr;
                }
            }

            const currentState = current.split(',').map(Number);
            if (stateToString(currentState) === stateToString(goalState)) {
                // ゴールに到達したら、移動の手順を再構築
                const moves = [];
                let currentStr = current;
                while (cameFrom.has(currentStr)) {
                    const [prevState, move] = cameFrom.get(currentStr);
                    moves.unshift(move);
                    currentStr = prevState;
                }
                return moves;
            }

            openSet.delete(current);

            // 可能な移動をすべて試す
            for (const move of getPossibleMoves(currentState)) {
                const newState = [...currentState];
                const emptyIndex = newState.indexOf(0);
                [newState[emptyIndex], newState[move]] = [newState[move], newState[emptyIndex]];
                const neighborStr = stateToString(newState);

                const tentativeGScore = gScore.get(current) + 1;
                if (!gScore.has(neighborStr) || tentativeGScore < gScore.get(neighborStr)) {
                    cameFrom.set(neighborStr, [current, move]);
                    gScore.set(neighborStr, tentativeGScore);
                    fScore.set(neighborStr, tentativeGScore + getManhattanDistance(newState));
                    openSet.add(neighborStr);
                }
            }
        }

        return null; // 解決策が見つからない場合
    }
}

// グローバル変数としてゲームインスタンスを保持
let game;

// ゲーム開始
window.onload = () => {
    game = new PuzzleGame();
};