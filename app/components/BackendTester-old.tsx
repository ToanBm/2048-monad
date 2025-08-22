"use client";

import { useState, useEffect } from 'react';
import { getPlayerData, getPlayerDataPerGame } from '../lib/blockchain';
import { submitPlayerScore } from '../lib/score-api';
import { GAME_CONFIG } from '../lib/game-config';
import { API_ENDPOINTS } from '../lib/api-config';

interface BackendTesterProps {
  playerAddress?: string;
  gameScore?: number; // Add prop to receive score from game
}

export default function BackendTester({ playerAddress, gameScore }: BackendTesterProps) {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testContractConnection = async () => {
    if (!playerAddress) {
      setTestResult('❌ Please login to test backend');
      return;
    }

    setIsLoading(true);
    setTestResult('Testing contract connection...');
    
    try {
      // Test reading contract data
      const playerData = await getPlayerData(playerAddress);
      setTestResult(`✅ Contract connection successful!\nTotal Score: ${playerData.totalScore}\nTotal Transactions: ${playerData.totalTransactions}`);
    } catch (error) {
      setTestResult(`❌ Contract connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testScoreSubmission = async () => {
    if (!playerAddress) {
      setTestResult('❌ Please login to test backend');
      return;
    }

    if (!gameScore || gameScore === 0) {
      setTestResult('❌ Please play the game and achieve a score before testing submission');
      return;
    }

    setIsLoading(true);
    setTestResult(`Testing score submission for score: ${gameScore}...`);
    
    try {
      const result = await submitPlayerScore(playerAddress, gameScore, 1);
      if (result.success) {
        setTestResult(`✅ Score submission successful!\nScore: ${gameScore}\nTransaction Hash: ${result.transactionHash}`);
        
        // Add player address to backend list only (no smart contract call)
        try {
          const addPlayerResponse = await fetch(API_ENDPOINTS.ADD_PLAYER_TO_LIST, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              playerAddress: playerAddress,
              // No score data needed - only adding to list
            })
          });
          
          if (addPlayerResponse.ok) {
            console.log('✅ Player added to backend list successfully');
          } else {
            console.log('⚠️ Failed to add player to backend list');
          }
        } catch (addPlayerError) {
          console.log('⚠️ Error adding player to backend list:', addPlayerError);
        }
        
      } else {
        setTestResult(`❌ Score submission failed: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Score submission error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testGameData = async () => {
    if (!playerAddress) {
      setTestResult('❌ Please login to test backend');
      return;
    }

    setIsLoading(true);
    setTestResult('Testing game data...');
    
    try {
      const gameData = await getPlayerDataPerGame(playerAddress, GAME_CONFIG.GAME_ADDRESS);
      setTestResult(`✅ Game data successful!\nScore: ${gameData.score}\nTransactions: ${gameData.transactions}`);
    } catch (error) {
      setTestResult(`❌ Game data failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="backend-tester">
      <h3 className="text-lg font-bold mb-4">🔧 Backend Connection Tester</h3>
      
      <div className="mb-4">
        {playerAddress ? (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-4">
            <p className="text-green-400 text-sm">
              ✅ Testing with your wallet address: <code className="bg-green-800/50 px-2 py-1 rounded">{playerAddress}</code>
            </p>
            {gameScore && gameScore > 0 && (
              <p className="text-blue-400 text-sm mt-2">
                🎮 Current score from game: <strong>{gameScore}</strong>
              </p>
            )}
          </div>
        ) : (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
            <p className="text-yellow-400 text-sm">
              ⚠️ Please login to test backend
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={testContractConnection}
          disabled={isLoading || !playerAddress}
          className="btn primary"
        >
          {isLoading ? 'Testing...' : 'Test Contract Connection'}
        </button>
        
        <button
          onClick={testScoreSubmission}
          disabled={isLoading || !playerAddress || !gameScore || gameScore === 0}
          className="btn secondary"
        >
          {isLoading ? 'Testing...' : `Test Score Submission (${gameScore || 0})`}
        </button>
        
        <button
          onClick={testGameData}
          disabled={isLoading || !playerAddress}
          className="btn warning"
        >
          {isLoading ? 'Testing...' : 'Test Game Data'}
        </button>
      </div>

      <div className="test-result">
        <h4 className="font-medium mb-2">Test Results:</h4>
        <pre className="bg-gray-800 p-3 rounded text-sm whitespace-pre-wrap">
          {testResult || 'No tests run yet...'}
        </pre>
      </div>
    </div>
  );
}
