"use client";

import { useState, useEffect } from 'react';
import { useEnv } from './EnvProvider';

interface LeaderboardEntry {
  rank: number;
  player: string;
  wallet: string;
  score: number;
}

interface LeaderboardProps {
  playerAddress?: string;
}

export default function Leaderboard({ playerAddress }: LeaderboardProps) {
  const env = useEnv();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/leaderboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        const entries: LeaderboardEntry[] = [];
        
        if (data && Array.isArray(data)) {
          data.forEach((entry: Record<string, unknown>) => {
            entries.push({
              rank: Number(entry.rank || 1),
              player: String(entry.username || 'Unknown'),
              wallet: String(entry.walletAddress || 'Unknown'),
              score: Number(entry.score || 0),
            });
          });
        }
        
        setLeaderboard(entries);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (err) {
      setError('Unable to load leaderboard');
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [playerAddress]);

  const formatAddress = (address: string) => {
    if (!address || address === 'Unknown') return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const isCurrentPlayer = (address: string) => {
    return playerAddress ? address.toLowerCase() === playerAddress.toLowerCase() : false;
  };

  const getScoreColor = (score: number) => {
    if (score >= 500) return 'text-yellow-400'; // Gold
    if (score >= 300) return 'text-blue-400';   // Blue
    if (score >= 100) return 'text-green-400';  // Green
    return 'text-gray-400';                      // Gray
  };

  // Hiển thị đầy đủ với header controls
  return (
    <div className="leaderboard">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="loading-message">
          Loading leaderboard...
        </div>
      ) : leaderboard.length > 0 ? (
        <div className="leaderboard-table">
          {/* Table Header - Cố định */}
          <div className="table-header">
            <div>Rank</div>
            <div>Player</div>
            <div>Wallet</div>
            <div>Score</div>
          </div>
          
          {/* Table Rows Container - Có thể scroll */}
          <div className="table-rows-container">
            {leaderboard.map((entry) => (
              <div
                key={`${entry.player}-${entry.rank}`}
                className={`table-row ${isCurrentPlayer(entry.wallet) ? 'current-player' : ''}`}
              >
                <div className="rank-column">
                  {entry.rank <= 3 ? (
                    <span className="rank-emoji">{getRankIcon(entry.rank)}</span>
                  ) : (
                    <span className="rank-number">{getRankIcon(entry.rank)}</span>
                  )}
                </div>
                <div className="player-column">
                  {entry.player}
                </div>
                <div className="wallet-column">
                  <a
                    href={`https://testnet.monadexplorer.com/address/${entry.wallet}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wallet-link"
                  >
                    {formatAddress(entry.wallet)}
                  </a>
                </div>
                <div className={`score-column ${getScoreColor(entry.score)}`}>
                  {entry.score.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-message">
          No leaderboard data available
        </div>
      )}
    </div>
  );
}
