"use client";
import { useEffect, useState } from "react";
import {
  usePrivy,
  CrossAppAccountWithMetadata,
} from "@privy-io/react-auth";
import { useMonadGamesUser } from "../hooks/useMonadGamesUser";

// Separate component for when Privy is not configured
function AuthNotConfigured() {
  return (
    <div className="text-yellow-400 text-sm">
      Authentication not configured
    </div>
  );
}

// Main auth component with Privy hooks
function PrivyAuth({ onAddressChange }: { onAddressChange: (address: string) => void }) {
  const { authenticated, user, ready, logout, login } = usePrivy();
  const [accountAddress, setAccountAddress] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [hasMonadAccount, setHasMonadAccount] = useState<boolean | null>(null);
  
  const { 
    user: monadUser, 
    hasUsername, 
    isLoading: isLoadingUser, 
    error: userError 
  } = useMonadGamesUser(accountAddress);

  useEffect(() => {
    // Check if privy is ready and user is authenticated
    if (authenticated && user && ready) {
      // Check if user has linkedAccounts
      if (user.linkedAccounts.length > 0) {
        // Get the cross app account created using Monad Games ID        
        const crossAppAccount: CrossAppAccountWithMetadata = user.linkedAccounts.filter(account => account.type === "cross_app" && account.providerApp.id === "cmd8euall0037le0my79qpz42")[0] as CrossAppAccountWithMetadata;

        if (crossAppAccount && crossAppAccount.embeddedWallets.length > 0) {
          const address = crossAppAccount.embeddedWallets[0].address;
          setAccountAddress(address);
          setHasMonadAccount(true);
          onAddressChange(address);
        } else {
          setHasMonadAccount(false);
          setMessage("You need to link your Monad Games ID account to continue.");
        }
      } else {
        setHasMonadAccount(false);
        setMessage("You need to link your Monad Games ID account to continue.");
      }
    } else {
      // Clear address when not authenticated
      setAccountAddress("");
      setHasMonadAccount(null);
      onAddressChange("");
    }
  }, [authenticated, user, ready, onAddressChange]);

  if (!ready) {
    return <div className="status-message info">Loading...</div>;
  }

  if (!authenticated) {
    return (
      <button 
        onClick={login}
        className="auth-btn primary"
      >
        Login
      </button>
    );
  }

  return (
    <div className="auth-actions">
      {hasMonadAccount === false ? (
        // User is authenticated but doesn't have Monad account - show registration link
        <div className="flex flex-col gap-2">
          <span className="status-message warning">Bạn chưa có Monad ID, hãy tạo nó</span>
          <a 
            href="https://monad-games-id-site.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="auth-btn warning"
          >
            Create Monad ID
          </a>
        </div>
      ) : accountAddress ? (
        <>
          {isLoadingUser ? (
            <span className="status-message info">Checking Monad ID...</span>
          ) : hasUsername && monadUser ? (
            <span className="status-message success">Welcome, {monadUser.username}!</span>
          ) : (
            <a 
              href="https://monad-games-id-site.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="auth-btn warning"
            >
              Register Username
            </a>
          )}
        </>
      ) : message ? (
        <span className="status-message error">{message}</span>
      ) : (
        <span className="status-message info">Setting up...</span>
      )}
      
      <button 
        onClick={logout}
        className="auth-btn danger"
      >
        Logout
      </button>
    </div>
  );
}

// Main component that conditionally renders based on Privy configuration
export default function AuthComponent({ onAddressChange }: { onAddressChange: (address: string) => void }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  if (!privyAppId) {
    return <AuthNotConfigured />;
  }
  
  return <PrivyAuth onAddressChange={onAddressChange} />;
}