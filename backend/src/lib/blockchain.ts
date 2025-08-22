import { createPublicClient, http, createWalletClient } from 'viem';
import { monadTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { GAME_CONTRACT_ABI } from './contract-abi';
import path from 'path';

// Contract configuration
export const CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4' as const;

// Export the ABI for use in other files
export const CONTRACT_ABI = GAME_CONTRACT_ABI;

// Create public client for reading contract data
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http()
});

// Helper function to validate Ethereum address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Helper function to get player data from contract (global totals)
export async function getPlayerData(playerAddress: string) {
  if (!isValidAddress(playerAddress)) {
    throw new Error('Invalid player address');
  }

  try {
    const [totalScore, totalTransactions] = await Promise.all([
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'totalScoreOfPlayer',
        args: [playerAddress as `0x${string}`]
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'totalTransactionsOfPlayer',
        args: [playerAddress as `0x${string}`]
      })
    ]);

    return {
      totalScore,
      totalTransactions
    };
  } catch (error) {
    console.error('Error reading player data:', error);
    throw new Error('Failed to read player data from contract');
  }
}

// Helper function to get player data for a specific game
export async function getPlayerDataPerGame(playerAddress: string, gameAddress: string) {
  if (!isValidAddress(playerAddress) || !isValidAddress(gameAddress)) {
    throw new Error('Invalid player or game address');
  }

  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'playerDataPerGame',
      args: [gameAddress as `0x${string}`, playerAddress as `0x${string}`]
    });

    return {
      score: result[0],
      transactions: result[1]
    };
  } catch (error) {
    console.error('Error reading player data per game:', error);
    throw new Error('Failed to read player data per game from contract');
  }
}

// Function to update player data on blockchain
export async function updatePlayerData(playerAddress: string, scoreAmount: number, transactionAmount: number) {
  if (!isValidAddress(playerAddress)) {
    throw new Error('Invalid player address format');
  }

  if (scoreAmount < 0 || transactionAmount < 0) {
    throw new Error('Score and transaction amounts must be non-negative');
  }

  // Get private key from environment variable
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('WALLET_PRIVATE_KEY environment variable not set');
  }

  try {
    // Create account from private key
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    // Create wallet client
    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http()
    });

    // Call the updatePlayerData function
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'updatePlayerData',
      args: [
        playerAddress as `0x${string}`,
        BigInt(scoreAmount),
        BigInt(transactionAmount)
      ]
    });

    // Save player address to list after successful update
    addPlayerToList(playerAddress);

    return {
      success: true,
      transactionHash: hash,
      message: 'Player data updated successfully'
    };

  } catch (error) {
    console.error('Error updating player data:', error);
    
    // Handle specific viem errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds to complete transaction');
      }
      if (error.message.includes('execution reverted')) {
        throw new Error('Contract execution failed - check if wallet has GAME_ROLE permission');
      }
      if (error.message.includes('AccessControlUnauthorizedAccount')) {
        throw new Error('Unauthorized: Wallet does not have GAME_ROLE permission');
      }
    }

    throw new Error('Failed to update player data');
  }
}

// Get leaderboard from smart contract functions (simple, no event queries)
export async function getGameLeaderboardFromBlockchain(gameAddress: string): Promise<Array<{
  address: string;
  score: number;
  transactions: number;
}>> {
  try {
    console.log('🎯 Getting leaderboard from smart contract functions for game:', gameAddress);
    
    // Get real player list from file storage
    const playerAddresses = getPlayerList();
    
    console.log('📋 Querying scores for', playerAddresses.length, 'players...');
    
    // Call smart contract functions to get real data
    const leaderboard = await Promise.all(
      playerAddresses.map(async (address, index) => {
        try {
          // Call totalScoreOfPlayer and totalTransactionsOfPlayer directly
          const [totalScore, totalTransactions] = await Promise.all([
            publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'totalScoreOfPlayer',
              args: [address as `0x${string}`]
            }),
            publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'totalTransactionsOfPlayer',
              args: [address as `0x${string}`]
            })
          ]);
          
          const score = Number(totalScore);
          const transactions = Number(totalTransactions);
          
          console.log(`✅ Player ${index + 1}: ${address.slice(0, 6)}...${address.slice(-4)} - Score: ${score}, Transactions: ${transactions}`);
          
          return {
            address,
            score,
            transactions
          };
          
        } catch (error) {
          console.error(`❌ Error getting data for player ${address}:`, error);
          return {
            address,
            score: 0,
            transactions: 0
          };
        }
      })
    );
    
    // Sort by score from high to low
    leaderboard.sort((a, b) => b.score - a.score);
    
    console.log('✅ Got real blockchain data:', leaderboard.length, 'players');
    leaderboard.forEach((player, index) => {
      console.log(`🏆 Rank ${index + 1}: ${player.address.slice(0, 6)}...${player.address.slice(-4)} - Score: ${player.score}, Transactions: ${player.transactions}`);
    });
    
    return leaderboard;
    
  } catch (error) {
    console.error('❌ Error getting blockchain leaderboard:', error);
    throw error;
  }
}

// ===== PLAYER MANAGEMENT FUNCTIONS =====

// File to store player list
const PLAYERS_FILE = path.join(__dirname, '../../data/players.json');

// Ensure data directory exists
function ensureDataDir() {
  const fs = require('fs');
  const path = require('path');
  const dataDir = path.dirname(PLAYERS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Get player list
export function getPlayerList(): string[] {
  try {
    const fs = require('fs');
    ensureDataDir();
    if (fs.existsSync(PLAYERS_FILE)) {
      const data = fs.readFileSync(PLAYERS_FILE, 'utf8');
      return JSON.parse(data);
    }
    // File doesn't exist yet, return empty array
    console.log('ℹ️ No players file found, starting with empty list');
    return [];
  } catch (error) {
    console.error('Error reading players file:', error);
    return [];
  }
}

// Add new player to list
export function addPlayerToList(playerAddress: string): void {
  try {
    const fs = require('fs');
    ensureDataDir();
    const players = getPlayerList();
    
    // Only add if not already exists
    if (!players.includes(playerAddress)) {
      players.push(playerAddress);
      fs.writeFileSync(PLAYERS_FILE, JSON.stringify(players, null, 2));
      console.log(`✅ Added new player: ${playerAddress}`);
    } else {
      console.log(`ℹ️ Player already exists: ${playerAddress}`);
    }
  } catch (error) {
    console.error('Error adding player to list:', error);
  }
}

