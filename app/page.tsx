"use client";
import { useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";

// Game is the main part: load immediately
import SpaceShooterGame from "./components/game";
// Auth is small, load immediately
import AuthComponent from "./components/AuthComponent";

// Secondary parts — dynamic to reduce bundle
const Leaderboard = dynamic(() => import("./components/Leaderboard"), {
  ssr: false,
  loading: () => <div style={{ opacity: 0.6 }}>Loading leaderboard…</div>,
});

export default function Home() {
  const [playerAddress, setPlayerAddress] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState<number>(0);

  // Stable callbacks for child components
  const handleAddressChange = useCallback((addr: string | null) => {
    setPlayerAddress(addr ?? null);
  }, []);

  const handleScoreChange = useCallback((score: number) => {
    setGameScore(score);
  }, []);

  return (
    <div className="app-container">
      {/* Header with Logo and Auth */}
      <section className="auth-section">
        <div className="logo-section">
          <img src="/monad.svg" alt="Monad Games" className="logo" />
          <span className="logo-text">2048 Monad Game</span>
        </div>
        <AuthComponent onAddressChange={handleAddressChange} />
      </section>

      {/* Game */}
      <section className="game-section">
        <SpaceShooterGame
          playerAddress={playerAddress ?? undefined}
          onScoreChange={handleScoreChange}
        />
      </section>

      {/* Footer */}
      <section className="footer-section">
        <p className="footer-text">© 2025 Monad Games ID</p>
        <div className="social-icons">
          <a
            href="https://github.com/ToanBm"
            target="_blank"
            rel="noreferrer"
            className="social-button"
          >
            <img src="/github.svg" alt="" />
          </a>
          <a
            href="https://x.com/buiminhtoan1985"
            target="_blank"
            rel="noreferrer"
            className="social-button"
          >
            <img src="/x.svg" alt="" />
          </a>
          <a
            href="https://discord.com/users/toanbm"
            target="_blank"
            rel="noreferrer"
            className="social-button"
          >
            <img src="/discord.svg" alt="" />
          </a>
          <a
            href="https://t.me/"
            target="_blank"
            rel="noreferrer"
            className="social-button"
          >
            <img src="/telegram.svg" alt="" />
          </a>
        </div>
      </section>
    </div>
  );
}
