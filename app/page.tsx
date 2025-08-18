"use client";
import { useState } from 'react';
import SpaceShooterGame from './components/game';
import AuthComponent from './components/AuthComponent';
import ScoreDebugger from './components/ScoreDebugger';
import BackendTester from './components/BackendTester';

export default function Home() {
  const [playerAddress, setPlayerAddress] = useState<string>("");

  return (
    <div className="app-container">
      <div className="auth-section">
        <div className="auth-container">
          <div className="auth-info">
            <AuthComponent onAddressChange={setPlayerAddress} />
          </div>
        </div>
      </div>
      
      <div className="game-section">
        <div className="game-wrapper">
          <SpaceShooterGame playerAddress={playerAddress} />
        </div>
      </div>
      
      {/* Backend Tester - Chỉ hiển thị trong development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="backend-test-section">
          <div className="backend-test-wrapper">
            <BackendTester />
          </div>
        </div>
      )}
      
      {playerAddress && (
        <div className="score-debugger-section">
          <ScoreDebugger playerAddress={playerAddress} />
        </div>
      )}
    </div>
  );
}