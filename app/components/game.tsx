"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Tile {
  id: number;
  value: number;
}

interface GameState {
  board: (Tile | null)[][];
  score: number;
  bestScore: number;
  gameOver: boolean;
  won: boolean;
  canMove: boolean;
}

interface GameProps {
  playerAddress?: string;
}

const SIZE = 4;

/* helpers */
function createEmptyBoard(): (Tile | null)[][] {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => null)
  );
}

function cloneBoard(board: (Tile | null)[][]) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function getEmptyCells(
  board: (Tile | null)[][]
): Array<{ r: number; c: number }> {
  const res: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (!board[r][c]) res.push({ r, c });
  return res;
}

function canMergeOrMove(board: (Tile | null)[][]): boolean {
  if (getEmptyCells(board).length > 0) return true;
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      const cur = board[r][c];
      if (!cur) continue;
      if (r + 1 < SIZE && board[r + 1][c]?.value === cur.value) return true;
      if (c + 1 < SIZE && board[r][c + 1]?.value === cur.value) return true;
    }
  return false;
}

function compressLineLeft(line: (Tile | null)[]): {
  line: (Tile | null)[];
  gained: number;
  changed: boolean;
} {
  const vals = line.filter(Boolean) as Tile[];
  let gained = 0;
  const merged: (Tile | null)[] = [];
  for (let i = 0; i < vals.length; i++) {
    if (i + 1 < vals.length && vals[i].value === vals[i + 1].value) {
      const v = vals[i].value * 2;
      merged.push({ id: vals[i].id, value: v });
      gained += v;
      i++;
    } else merged.push({ ...vals[i] });
  }
  while (merged.length < SIZE) merged.push(null);
  const changed = line.some((t, idx) => {
    const m = merged[idx];
    if (!t && m) return true;
    if (t && !m) return true;
    if (t && m && t.value !== m.value) return true;
    return false;
  });
  return { line: merged, gained, changed };
}

function rotateRight(board: (Tile | null)[][]): (Tile | null)[][] {
  const res = createEmptyBoard();
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      res[c][SIZE - 1 - r] = board[r][c] ? { ...board[r][c]! } : null;
  return res;
}

function rotateLeft(board: (Tile | null)[][]): (Tile | null)[][] {
  return rotateRight(rotateRight(rotateRight(board)));
}

function flipH(board: (Tile | null)[][]): (Tile | null)[][] {
  return board.map((row) => [...row].reverse());
}

/* component */
export default function Game({ playerAddress }: GameProps) {
  const [mounted, setMounted] = useState(false);

  const loadBestScore = () => {
    try {
      return Number(localStorage.getItem("2048-best-score") || 0);
    } catch {
      return 0;
    }
  };

  const saveBestScore = (score: number) => {
    try {
      localStorage.setItem("2048-best-score", String(score));
    } catch {}
  };

  const [gameState, setGameState] = useState<GameState>({
    board: createEmptyBoard(),
    score: 0,
    bestScore: 0, // Start with 0 to avoid hydration mismatch
    gameOver: false,
    won: false,
    canMove: true,
  });

  const nextId = useRef(1);

  const spawnRandom = (board: (Tile | null)[][]) => {
    const empty = getEmptyCells(board);
    if (empty.length === 0) return;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    board[r][c] = { id: nextId.current++, value };
  };

  const initializeGame = useCallback(() => {
    const newBoard = createEmptyBoard();
    nextId.current = 1;
    spawnRandom(newBoard);
    spawnRandom(newBoard);
    setGameState((prev) => ({
      board: newBoard,
      score: 0,
      bestScore: prev.bestScore,
      gameOver: false,
      won: false,
      canMove: true,
    }));
    console.log("Game 2048 initialized");
  }, []);

  const move = useCallback((dir: "left" | "right" | "up" | "down") => {
    setGameState((prev) => {
      if (!prev.canMove || prev.gameOver) return prev;

      let working = cloneBoard(prev.board);
      if (dir === "right") working = flipH(working);
      if (dir === "up") working = rotateLeft(working);
      if (dir === "down") working = rotateRight(working);

      let moved = false;
      let gained = 0;
      for (let r = 0; r < SIZE; r++) {
        const { line, gained: g, changed } = compressLineLeft(working[r]);
        working[r] = line;
        if (changed) moved = true;
        gained += g;
      }

      if (dir === "right") working = flipH(working);
      if (dir === "up") working = rotateRight(working);
      if (dir === "down") working = rotateLeft(working);

      if (!moved) return prev;

      spawnRandom(working);

      const score = prev.score + gained;
      const best = Math.max(prev.bestScore, score);
      if (best > prev.bestScore) saveBestScore(best);

      const won = working.some((row) => row.some((t) => t && t.value === 2048));
      const canMove = canMergeOrMove(working);

      return {
        ...prev,
        board: working,
        score,
        bestScore: best,
        won,
        canMove,
        gameOver: !canMove,
      };
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    // Load best score after mounting to avoid hydration mismatch
    const bestScore = loadBestScore();
    setGameState(prev => ({ ...prev, bestScore }));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!gameState.canMove) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
        e.preventDefault();
      if (e.key === "ArrowLeft") move("left");
      else if (e.key === "ArrowRight") move("right");
      else if (e.key === "ArrowUp") move("up");
      else if (e.key === "ArrowDown") move("down");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameState.canMove, move]);

  useEffect(() => {
    if (mounted) {
      initializeGame();
    }
  }, [mounted, initializeGame]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="game-container">
        <h2 className="game-title">🎮 2048 Game</h2>
        <div className="game-stats">
          <div><strong>Score:</strong> 0</div>
          <div><strong>Best:</strong> 0</div>
        </div>
        <div className="game-board">
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i} className="tile empty"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="game-2048">
      <h2 className="game-title">🎮 2048 Game</h2>

      <div className="game-stats">
        <div className="game-stat">
          <strong>Score:</strong>
          <span className="game-stat-value">{gameState.score}</span>
        </div>
        <div className="game-stat">
          <strong>Best:</strong>
          <span className="game-stat-value">{gameState.bestScore}</span>
        </div>
        {playerAddress && (
          <div className="game-stat">
            <strong>Wallet:</strong>
            <span className="game-stat-value">{playerAddress.slice(0, 6)}...{playerAddress.slice(-4)}</span>
          </div>
        )}
      </div>

      <div className="game-board">
        {gameState.board.flat().map((tile, idx) => (
          <div
            key={(tile?.id ?? "empty") + "-" + idx}
            className={`tile ${tile ? `v-${tile.value}` : "empty"}`}
          >
            {tile?.value ?? ""}
          </div>
        ))}
      </div>

      {gameState.won && (
        <div className="game-status win">
          🎉 Congratulations! You reached 2048. (Score: {gameState.score})
        </div>
      )}
      {gameState.gameOver && (
        <div className="game-status lose">
          😔 Game Over! Final Score: {gameState.score}
        </div>
      )}

      <div className="game-controls">
        <button onClick={initializeGame} className="btn primary">
          New Game
        </button>
        <button onClick={() => move("left")} className="btn direction">
          ←
        </button>
        <button onClick={() => move("right")} className="btn direction">
          →
        </button>
        <button onClick={() => move("up")} className="btn direction">
          ↑
        </button>
        <button onClick={() => move("down")} className="btn direction">
          ↓
        </button>
      </div>
    </div>
  );
}
