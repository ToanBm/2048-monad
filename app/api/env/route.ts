export async function GET() {
  // Log để debug
  console.log('🔍 API /env - process.env keys:', Object.keys(process.env));
  console.log('🔍 API /env - NEXT_PUBLIC_PRIVY_APP_ID:', process.env.NEXT_PUBLIC_PRIVY_APP_ID);
  
  const envVars = {
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
    NEXT_PUBLIC_MONAD_APP_ID: process.env.NEXT_PUBLIC_MONAD_APP_ID || '',
    NEXT_PUBLIC_MONAD_PORTAL_URL: process.env.NEXT_PUBLIC_MONAD_PORTAL_URL || '',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    NEXT_PUBLIC_GAME_ADDRESS: process.env.NEXT_PUBLIC_GAME_ADDRESS || '',
    NEXT_PUBLIC_DISABLE_BACKEND: process.env.NEXT_PUBLIC_DISABLE_BACKEND || '',
  };
  
  console.log('🔍 API /env - returning:', envVars);
  return Response.json(envVars);
}
