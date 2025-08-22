// API configuration for frontend to call backend VPS
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_API_BASE_URL || 'http://your-vps-ip:3001'  // VPS backend
  : 'http://localhost:3001';                                            // Local backend

export const API_ENDPOINTS = {
  UPDATE_PLAYER_DATA: `${API_BASE_URL}/api/update-player-data`,
  GET_PLAYER_DATA: `${API_BASE_URL}/api/get-player-data`,
  GET_PLAYER_DATA_PER_GAME: `${API_BASE_URL}/api/get-player-data-per-game`,
  GET_PRIVY_CONFIG: `${API_BASE_URL}/api/get-privy-config`,
  ADD_PLAYER_TO_LIST: `${API_BASE_URL}/api/add-player-to-list`,
  GET_LEADERBOARD: `${API_BASE_URL}/api/get-leaderboard`,
};

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}

// Environment check
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
