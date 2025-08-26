"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import LeaderboardPopup from "./LeaderboardPopup";
import { API_ENDPOINTS } from "../lib/api-config";
import { useEnv } from "./EnvProvider";

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
  onScoreChange?: (score: number) => void;
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

/** NEW: get the maximum tile value on the board */
function getMaxTile(board: (Tile | null)[][]): number {
  let max = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[r][c]?.value ?? 0;
      if (v > max) max = v;
    }
  }
  return max;
}

/* component */
export default function Game({ playerAddress, onScoreChange }: GameProps) {
  const env = useEnv();
  const [mounted, setMounted] = useState(false);
  const [lastSavedScore, setLastSavedScore] = useState(0); // Track last saved score
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

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
    bestScore: 0, // avoid hydration mismatch
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

    // score = maximum tile value right after starting
    const maxNow = getMaxTile(newBoard);

    setGameState((prev) => ({
      board: newBoard,
      score: maxNow, // CHANGED
      bestScore: prev.bestScore, // keep existing best score
      gameOver: false,
      won: false,
      canMove: true,
    }));
    setLastSavedScore(0); // Reset last saved score when starting new game
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
      let totalGained = 0; // still calculate to avoid affecting other code, but not used for score
      for (let r = 0; r < SIZE; r++) {
        const { line, gained: g, changed } = compressLineLeft(working[r]);
        working[r] = line;
        if (changed) moved = true;
        totalGained += g;
      }

      if (dir === "right") working = flipH(working);
      if (dir === "up") working = rotateRight(working);
      if (dir === "down") working = rotateLeft(working);

      if (!moved) return prev;

      spawnRandom(working);

      // score = maximum tile value after moving + spawning
      const currentMax = getMaxTile(working);
      const best = Math.max(prev.bestScore, currentMax);
      if (best > prev.bestScore) saveBestScore(best);

      const won = working.some((row) => row.some((t) => t && t.value === 2048));
      const canMove = canMergeOrMove(working);

      return {
        ...prev,
        board: working,
        score: currentMax, // CHANGED
        bestScore: best,
        won,
        canMove,
        gameOver: !canMove,
      };
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    const bestScore = loadBestScore();
    setGameState((prev) => ({ ...prev, bestScore }));
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

  useEffect(() => {
    if (onScoreChange) {
      onScoreChange(gameState.score);
    }
  }, [gameState.score, onScoreChange]);

  // Simple formatter for the header badge (UI-only)
  const shortAddr =
    playerAddress && playerAddress.startsWith("0x") && playerAddress.length > 10
      ? `${playerAddress.slice(0, 6)}…${playerAddress.slice(-4)}`
      : playerAddress || "Guest";

  if (!mounted) {
    return (
      <div className="game-container">
        <header className="game-header">
          <h1 className="game-title">2048</h1>
          <div className="player-badge" aria-label="Player address">
            {shortAddr}
          </div>
        </header>

        <div className="score-panel" aria-live="polite">
          <button
            className="score-button current-score"
            aria-label="Current score"
          >
            <strong>Score:</strong>
            <span className="score-value">0</span>
          </button>
          <button className="score-button best-score" aria-label="Best score">
            <strong>Best:</strong>
            <span className="score-value">0</span>
          </button>
        </div>

        <div className="game-grid" role="grid" aria-label="2048 board">
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className="grid-cell empty"
              role="gridcell"
              aria-label={`Empty cell ${i + 1}`}
            />
          ))}
        </div>

        <div className="control-panel" aria-label="Controls">
          <button onClick={initializeGame} className="control-button new-game">
            New Game
          </button>
          <button
            disabled
            className="control-button save-score"
            aria-disabled="true"
            title="Login and play to enable"
          >
            Save Score
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* Scores */}
      <div className="score-panel" aria-live="polite">
        <button
          className="score-button current-score"
          aria-label={`Current score ${gameState.score}`}
        >
          <strong>Score:</strong>
          <span className="score-value">{gameState.score}</span>
        </button>

        {/* Leaderboard Button */}
        <button
          onClick={() => setIsLeaderboardOpen(true)}
          className="score-button leaderboard-btn"
          aria-label="Open leaderboard"
        >
          <span className="score-value">Leaderboard</span>
        </button>

        <button
          className="score-button best-score"
          aria-label={`Best score ${gameState.bestScore}`}
        >
          <strong>Best:</strong>
          <span className="score-value">{gameState.bestScore}</span>
        </button>
      </div>

      {/* Grid */}
      <div className="game-grid" role="grid" aria-label="2048 board">
        {gameState.board.flat().map((tile, idx) => (
          <div
            key={(tile?.id ?? "empty") + "-" + idx}
            className={`grid-cell ${tile ? `tile-${tile.value}` : "empty"}`}
            role="gridcell"
            aria-label={tile ? `Tile ${tile.value}` : "Empty cell"}
          >
            {tile?.value ?? ""}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="control-panel" aria-label="Controls">
        <button onClick={initializeGame} className="control-button new-game">
          New Game
        </button>

        <button
          onClick={async () => {
            if (!playerAddress) {
              alert("Please login to save your score!");
              return;
            }
            if (gameState.score === 0) {
              alert("Please play the game and achieve a score before saving!");
              return;
            }

            // Check if current score has already been saved
            if (gameState.score <= lastSavedScore) {
              alert(
                "This score has already been saved! Please play more to achieve a higher score."
              );
              return;
            }

            // Check environment variable to disable backend
            console.log(
              "🔍 ENV CHECK:",
              env.NEXT_PUBLIC_DISABLE_BACKEND
            );
            if (env.NEXT_PUBLIC_DISABLE_BACKEND === "true") {
              // Mock success - don't call backend
              alert(
                `✅ Score saved successfully! (Backend disabled)\nScore: ${gameState.score}`
              );
              setLastSavedScore(gameState.score);
              console.log("🚀 Backend disabled - using mock data");
            } else {
              // Call real backend
              try {
                // Import function from score-api
                const { submitPlayerScore } = await import("../lib/score-api");
                const result = await submitPlayerScore(
                  playerAddress,
                  gameState.score,
                  1
                );

                if (result.success) {
                  alert(
                    `✅ Score saved successfully!\nScore: ${gameState.score}\nTransaction: ${result.transactionHash}`
                  );

                  // Update lastSavedScore to avoid saving again
                  setLastSavedScore(gameState.score);

                  // Add player to backend list only (no smart contract call)
                  try {
                    const addPlayerResponse = await fetch(
                      API_ENDPOINTS.ADD_PLAYER_TO_LIST,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          playerAddress: playerAddress,
                          // No score data needed - only adding to list
                        }),
                      }
                    );

                    if (addPlayerResponse.ok) {
                      console.log(
                        "✅ Player added to backend list successfully"
                      );
                    }
                  } catch (addPlayerError) {
                    console.log(
                      "⚠️ Error adding player to backend list:",
                      addPlayerError
                    );
                  }
                } else {
                  alert(`❌ Failed to save score: ${result.error}`);
                }
              } catch (error) {
                alert(
                  `❌ Error saving score: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`
                );
              }
            }
          }}
          disabled={
            !playerAddress ||
            gameState.score === 0 ||
            gameState.score <= lastSavedScore
          }
          className="control-button save-score"
        >
          Save Score
        </button>
      </div>

      {/* Overlay for win / game over */}
      {(gameState.won || gameState.gameOver) && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-label={gameState.won ? "Victory" : "Game Over"}
        >
          <div className="overlay-card">
            <p className="overlay-text">
              {gameState.won
                ? `🎉 Congratulations! You reached 2048. (Score: ${gameState.score})`
                : `😔 Game Over! Final Score: ${gameState.score}`}
            </p>
            <div className="overlay-actions">
              <button
                onClick={initializeGame}
                className="control-button new-game"
              >
                New Game
              </button>
              {/* If you want a "Continue" button later, add another button here. */}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Popup */}
      <LeaderboardPopup
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        playerAddress={playerAddress}
      />
    </div>
  );
}
