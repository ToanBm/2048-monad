import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Ensure environment variables are available at build time
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_MONAD_APP_ID: process.env.NEXT_PUBLIC_MONAD_APP_ID,
    NEXT_PUBLIC_MONAD_PORTAL_URL: process.env.NEXT_PUBLIC_MONAD_PORTAL_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_GAME_ADDRESS: process.env.NEXT_PUBLIC_GAME_ADDRESS,
  },
};

export default nextConfig;
