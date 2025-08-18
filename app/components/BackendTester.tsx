"use client";

import { useState } from 'react';
import { getPlayerData, getPlayerDataPerGame } from '../lib/blockchain';
import { submitPlayerScore } from '../lib/score-api';

export default function BackendTester() {
  const [testAddress, setTestAddress] = useState('0x1234567890123456789012345678901234567890');
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testContractConnection = async () => {
    setIsLoading(true);
    setTestResult('Testing contract connection...');
    
    try {
      // Test reading contract data
      const playerData = await getPlayerData(testAddress);
      setTestResult(`✅ Contract connection successful!\nTotal Score: ${playerData.totalScore}\nTotal Transactions: ${playerData.totalTransactions}`);
    } catch (error) {
      setTestResult(`❌ Contract connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testScoreSubmission = async () => {
    setIsLoading(true);
    setTestResult('Testing score submission...');
    
    try {
      const result = await submitPlayerScore(testAddress, 100, 1);
      if (result.success) {
        setTestResult(`✅ Score submission successful!\nTransaction Hash: ${result.transactionHash}`);
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
    setIsLoading(true);
    setTestResult('Testing game data...');
    
    try {
      const gameData = await getPlayerDataPerGame(testAddress, '0xf5ea577f39318dc012d5Cbbf2d447FdD76c48523');
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
        <label className="block text-sm font-medium mb-2">Test Address:</label>
        <input
          type="text"
          value={testAddress}
          onChange={(e) => setTestAddress(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded bg-gray-800 text-white"
          placeholder="Enter test wallet address"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={testContractConnection}
          disabled={isLoading}
          className="btn primary"
        >
          {isLoading ? 'Testing...' : 'Test Contract Connection'}
        </button>
        
        <button
          onClick={testScoreSubmission}
          disabled={isLoading}
          className="btn secondary"
        >
          {isLoading ? 'Testing...' : 'Test Score Submission'}
        </button>
        
        <button
          onClick={testGameData}
          disabled={isLoading}
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
