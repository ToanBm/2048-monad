import { useState, useEffect } from 'react';
import { useEnv } from '../components/EnvProvider';

interface MonadGamesUser {
  id: number;
  username: string;
  walletAddress: string;
}

interface UserResponse {
  hasUsername: boolean;
  user?: MonadGamesUser;
}

interface UseMonadGamesUserReturn {
  user: MonadGamesUser | null;
  hasUsername: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useMonadGamesUser(walletAddress: string): UseMonadGamesUserReturn {
  const [user, setUser] = useState<MonadGamesUser | null>(null);
  const [hasUsername, setHasUsername] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const env = useEnv();

  useEffect(() => {
    if (!walletAddress) {
      setUser(null);
      setHasUsername(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Ensure URL has www prefix for monadclip.fun
        const baseUrl = env.NEXT_PUBLIC_MONAD_PORTAL_URL.includes('monadclip.fun') && !env.NEXT_PUBLIC_MONAD_PORTAL_URL.includes('www.')
          ? env.NEXT_PUBLIC_MONAD_PORTAL_URL.replace('monadclip.fun', 'www.monadclip.fun')
          : env.NEXT_PUBLIC_MONAD_PORTAL_URL;
        const url = `${baseUrl}/api/check-wallet?wallet=${walletAddress}`;
        console.log('Fetching Monad user data:', { url, walletAddress, env: env.NEXT_PUBLIC_MONAD_PORTAL_URL });
        
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: UserResponse = await response.json();
        console.log('Monad user data received:', data);
        
        setHasUsername(data.hasUsername);
        setUser(data.user || null);
      } catch (err) {
        console.error('Error fetching Monad user data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setHasUsername(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [walletAddress, env.NEXT_PUBLIC_MONAD_PORTAL_URL]);

  return {
    user,
    hasUsername,
    isLoading,
    error,
  };
}