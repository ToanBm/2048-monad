"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { useMemo } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

  // During build time or when no app ID is provided, render children without Privy
  if (!privyAppId) {
    console.warn('NEXT_PUBLIC_PRIVY_APP_ID is not set. Privy authentication will not be available.');
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethodsAndOrder: {
          // Don't forget to enable Monad Games ID support in:
          // Global Wallet > Integrations > Monad Games ID (click on the slide to enable)
          primary: [`privy:${process.env.NEXT_PUBLIC_MONAD_APP_ID ?? ""}`], // This is the Cross App ID
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
