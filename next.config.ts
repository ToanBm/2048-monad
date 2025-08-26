import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Ensure environment variables are available at build time
    NEXT_PUBLIC_PRIVY_APP_ID: "cmeb4lcu60030js0crxx422ro",
    NEXT_PUBLIC_MONAD_APP_ID: "cmd8euall0037le0my79qpz42",
    NEXT_PUBLIC_MONAD_PORTAL_URL: "https://monad-games-id-site.vercel.app",
    NEXT_PUBLIC_API_BASE_URL: "https://your-vps-ip:3001",
    NEXT_PUBLIC_GAME_ADDRESS: "0xc62cc8d9cf9186f5f1e6458641b45c70c1899537",
  },
};

export default nextConfig;
