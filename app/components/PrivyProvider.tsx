// app/components/Providers.tsx
"use client";
import { PrivyProvider } from "@privy-io/react-auth";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
const MONAD_CROSS_APPID = process.env.NEXT_PUBLIC_MONAD_APP_ID ?? "";

export default function Providers({ children }: { children: React.ReactNode }) {
  if (!PRIVY_APP_ID) {
    console.warn("NEXT_PUBLIC_PRIVY_APP_ID is not set.");
    return <>{children}</>;
  }
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethodsAndOrder: { primary: [`privy:${MONAD_CROSS_APPID}`] },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
