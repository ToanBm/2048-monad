import { Router } from 'express';
import { updatePlayerData, getPlayerData, getGameLeaderboardFromBlockchain, addPlayerToList } from '../lib/blockchain';

const router = Router();

// Update player data (calls smart contract)
router.post('/update-player-data', async (req, res) => {
  try {
    const { playerAddress, scoreAmount, transactionAmount } = req.body;

    // Validation
    if (!playerAddress || scoreAmount === undefined || transactionAmount === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: playerAddress, scoreAmount, transactionAmount'
      });
    }

    const result = await updatePlayerData(playerAddress, scoreAmount, transactionAmount);
    res.json(result);
  } catch (error) {
    console.error('Error updating player data:', error);
    res.status(500).json({ error: 'Failed to update player data' });
  }
});

// Add player to backend list only (does NOT call smart contract)
router.post('/add-player-to-list', async (req, res) => {
  try {
    const { playerAddress } = req.body;

    // Validation
    if (!playerAddress) {
      return res.status(400).json({
        error: 'Missing required field: playerAddress'
      });
    }

    // Only add to backend list, don't call smart contract
    addPlayerToList(playerAddress);
    
    res.json({
      success: true,
      message: 'Player added to backend list successfully'
    });
  } catch (error) {
    console.error('Error adding player to list:', error);
    res.status(500).json({ error: 'Failed to add player to list' });
  }
});

// Get player data
router.get('/get-player-data', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Address parameter required' });
    }

    const result = await getPlayerData(address);
    res.json(result);
  } catch (error) {
    console.error('Error getting player data:', error);
    res.status(500).json({ error: 'Failed to get player data' });
  }
});

// Get leaderboard
router.get('/get-leaderboard', async (req, res) => {
  try {
    const result = await getGameLeaderboardFromBlockchain('0x732C3356FE0718f4dA2e821838016Dc5083cab10');
    res.json(result);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

export default router;
