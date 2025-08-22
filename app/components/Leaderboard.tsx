"use client";

import { useState, useEffect } from 'react';
import { getGameLeaderboardFromBlockchain, getPlayerDataPerGame } from '../lib/blockchain';
import { GAME_CONFIG } from '../lib/game-config';
import { API_ENDPOINTS } from '../lib/api-config';

interface LeaderboardEntry {
  address: string;
  score: number;
  transactions: number;
  rank: number;
}

interface BackendLeaderboardEntry {
  playerAddress: string;
  score: number;
  transactions?: number;
}

interface BackendResponse {
  success: boolean;
  leaderboard?: BackendLeaderboardEntry[];
  message?: string;
}

interface LeaderboardProps {
  playerAddress?: string;
}

export default function Leaderboard({ playerAddress }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError('');

    // Check environment variable to disable backend
    if (process.env.NEXT_PUBLIC_DISABLE_BACKEND === 'true') {
      // Backend disabled - show notification
      console.log('🚀 Backend disabled - showing empty leaderboard');
      setLeaderboard([]);
      setError('Backend is disabled. Please enable backend to view leaderboard.');
      setIsLoading(false);
      return;
    }

    // Call backend API to get leaderboard
    try {
      console.log('🔄 Loading leaderboard from backend...');
      
              // Try to get from backend first
        try {
          const backendResponse = await fetch(API_ENDPOINTS.GET_LEADERBOARD, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (backendResponse.ok) {
            const backendData = await backendResponse.json();
            console.log('✅ Got backend data:', backendData);
            
            if (Array.isArray(backendData) && backendData.length > 0) {
              console.log('🔄 Backend returned player addresses, querying blockchain for scores...');
              
              // Backend returns array of addresses, need to query blockchain for scores
              try {
                const blockchainLeaderboard = await getGameLeaderboardFromBlockchain(GAME_CONFIG.GAME_ADDRESS);
                
                if (blockchainLeaderboard.length > 0) {
                  console.log('✅ Got blockchain scores for leaderboard');
                  const sortedLeaderboard = blockchainLeaderboard
                    .sort((a, b) => b.score - a.score)
                    .map((entry, index) => ({
                      ...entry,
                      rank: index + 1
                    }));
                  
                  setLeaderboard(sortedLeaderboard);
                  setIsLoading(false);
                  return;
                }
              } catch (blockchainError) {
                console.log('⚠️ Error querying blockchain, using backend addresses only');
              }
              
              // Fallback: Show addresses from backend (no scores)
              const addressOnlyLeaderboard = backendData.map((address, index) => ({
                address: address,
                score: 0, // No scores from blockchain
                transactions: 0,
                rank: index + 1
              }));
              
              setLeaderboard(addressOnlyLeaderboard);
              setIsLoading(false);
              return;
            }
          }
        } catch (backendError) {
          console.log('⚠️ Backend not available, trying blockchain...');
        }

      // Fallback: Get from blockchain if backend is not available
      console.log('🔄 Loading leaderboard from blockchain...');
      const blockchainLeaderboard = await getGameLeaderboardFromBlockchain(GAME_CONFIG.GAME_ADDRESS);
      
      if (blockchainLeaderboard.length > 0) {
        console.log('✅ Got blockchain data, showing leaderboard');
        const sortedLeaderboard = blockchainLeaderboard.map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));
        setLeaderboard(sortedLeaderboard);
      } else {
        console.log('⚠️ No blockchain data, showing current player only');
        
        if (playerAddress) {
          try {
            const realPlayerData = await getPlayerDataPerGame(playerAddress, GAME_CONFIG.GAME_ADDRESS);
            
            const currentPlayerEntry = {
              address: playerAddress,
              score: Number(realPlayerData.score),
              transactions: Number(realPlayerData.transactions),
              rank: 1
            };
            
            setLeaderboard([currentPlayerEntry]);
          } catch (err) {
            console.error('❌ Error getting current player data:', err);
            setError('Unable to load current player data');
            setLeaderboard([]);
          }
        } else {
          setLeaderboard([]);
        }
      }
      
    } catch (err) {
      console.error('❌ Error loading leaderboard:', err);
      setError('Unable to load leaderboard from blockchain');
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [playerAddress]);

  const formatAddress = (address: string) => {
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

  return (
          <div className="leaderboard">
        <div className="leaderboard-header">
          <div className="header-controls">
            <button
              onClick={loadLeaderboard}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : '🔄 Refresh'}
            </button>
            <span className="player-count">
              {leaderboard.length > 0 ? `${leaderboard.length} Players` : 'No Players'}
            </span>
          </div>
        </div>

      {error && (
        <div>
          <p>{error}</p>
        </div>
      )}

      <div className="leaderboard-table">
        <div className="table-header">
          <div className="header-rank">Rank</div>
          <div className="header-player">Player</div>
          <div className="header-score">Total Score</div>
          <div className="header-games">Games</div>
        </div>

        {leaderboard.map((entry) => (
          <div
            key={entry.address}
            className={`table-row ${isCurrentPlayer(entry.address) ? 'current-player' : ''}`}
          >
            <div className="rank-col">
              <span className="rank-icon">{getRankIcon(entry.rank)}</span>
            </div>
            <div className="player-col">
              <span>
                {formatAddress(entry.address)}
              </span>
              {isCurrentPlayer(entry.address) && (
                <span className="current-player-badge">You</span>
              )}
            </div>
            <div className="score-col">
              <span className={getScoreColor(entry.score)}>
                {entry.score.toLocaleString()}
              </span>
            </div>
            <div className="transactions-col">
              <span>{entry.transactions}</span>
            </div>
          </div>
        ))}
      </div>

      {leaderboard.length === 0 && !isLoading && (
        <div className="empty-state">
          <p>
            {playerAddress ? 'No ranking data available for this game yet' : 'Please login to view leaderboard'}
          </p>
        </div>
      )}

      <div className="leaderboard-info">
        <p>
          💡 Leaderboard data is fetched directly from Monad Games blockchain!
        </p>
      </div>
    </div>
  );
}
