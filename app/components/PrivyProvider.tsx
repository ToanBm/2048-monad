"use client";
import { PrivyProvider } from "@privy-io/react-auth";
import { useEnv } from "./EnvProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const env = useEnv();
  
  if (!env.NEXT_PUBLIC_PRIVY_APP_ID) {
    console.warn("NEXT_PUBLIC_PRIVY_APP_ID is not set.");
    return <>{children}</>;
  }
  
  return (
    <PrivyProvider
      appId={env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        loginMethodsAndOrder: { 
          primary: [`privy:${env.NEXT_PUBLIC_MONAD_APP_ID}`] 
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
