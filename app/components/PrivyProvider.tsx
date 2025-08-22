"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { useMemo } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const privyAppId = 'cmeb4lcu60030js0crxx422ro';

  const config = useMemo(() => ({
    loginMethodsAndOrder: {
      // Don't forget to enable Monad Games ID support in:
      // Global Wallet > Integrations > Monad Games ID (click on the slide to enable)
      primary: ['privy:cmd8euall0037le0my79qpz42'] as const, // This is the Cross App ID
    },
  }), []);

  // During build time or when no app ID is provided, render children without Privy
  if (!privyAppId) {
    console.warn('NEXT_PUBLIC_PRIVY_APP_ID is not set. Privy authentication will not be available.');
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={config}
    >
      {children}
    </PrivyProvider>
  );
}
