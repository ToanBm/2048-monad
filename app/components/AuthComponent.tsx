"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  usePrivy,
  type CrossAppAccountWithMetadata,
} from "@privy-io/react-auth";
import { useMonadGamesUser } from "../hooks/useMonadGamesUser";
import { useEnv } from "./EnvProvider";

function AuthNotConfigured() {
  return (
    <div className="status-message warning">Authentication not configured</div>
  );
}

type Props = { onAddressChange: (address: string) => void };

// Shorten address for UI
const shortAddr = (addr?: string) =>
  addr && addr.startsWith("0x") && addr.length > 10
    ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
    : addr || "";

function PrivyAuth({ onAddressChange }: Props) {
  const { authenticated, user, ready, logout, login } = usePrivy();
  const env = useEnv();

  const crossAppAccount = useMemo<
    CrossAppAccountWithMetadata | undefined
  >(() => {
    if (!user) return undefined;
    return user.linkedAccounts
      .filter((a): a is CrossAppAccountWithMetadata => a.type === "cross_app")
      .find((a) => a.providerApp?.id === env.NEXT_PUBLIC_MONAD_APP_ID);
  }, [user, env.NEXT_PUBLIC_MONAD_APP_ID]);

  const accountAddress = useMemo(() => {
    // Lấy từ cross app account (Monad Games ID)
    const addr = crossAppAccount?.embeddedWallets?.[0]?.address;
    

    
    return typeof addr === "string" ? addr : "";
  }, [crossAppAccount, user]);

  const [prevAddr, setPrevAddr] = useState<string>("");

  useEffect(() => {
    if (accountAddress !== prevAddr) {
      setPrevAddr(accountAddress);
      onAddressChange(accountAddress);
    }
  }, [accountAddress, prevAddr, onAddressChange]);

  // Tự động tạo cross app account khi user login
  useEffect(() => {
    if (authenticated && user && !crossAppAccount) {
      // Privy sẽ tự động tạo cross app account khi cần
    }
  }, [authenticated, user, crossAppAccount]);

  const hasMonadAccount = !!crossAppAccount;
  const {
    user: monadUser,
    hasUsername,
    isLoading: isLoadingUser,
  } = useMonadGamesUser(accountAddress);

  const profileUrl =
    hasUsername && monadUser?.username
      ? `${env.NEXT_PUBLIC_MONAD_PORTAL_URL}/u/${monadUser.username}`
      : env.NEXT_PUBLIC_MONAD_PORTAL_URL;

  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const handleCopy = useCallback(() => {
    if (!accountAddress) return;
    navigator.clipboard.writeText(accountAddress).then(() => {
      setShowCopyAlert(true);
      setTimeout(() => setShowCopyAlert(false), 2000); // Hide after 2 seconds
    }).catch(() => {});
  }, [accountAddress]);

  const handleCreateMonadId = useCallback(() => {
    // Chỉ mở link tạo Monad ID khi chưa có
    window.open(env.NEXT_PUBLIC_MONAD_PORTAL_URL, '_blank');
  }, [env.NEXT_PUBLIC_MONAD_PORTAL_URL]);

  if (!ready) return <div className="status-message info">Loading…</div>;

  // === NOT CONNECTED: only 1 "Connect" button ===
  if (!authenticated) {
    return (
      <div className="auth-actions-row">
        <button
          onClick={login}
          className="user-btn"
          aria-label="Connect account"
        >
          Login
        </button>
      </div>
    );
  }

  // === CONNECTED: 2 buttons (Embedded Wallet, Monad ID) ===
  return (
    <div className="auth-actions-row">
      {/* Embedded Wallet button - click to copy */}
      <div className="wallet-btn">
        <button
          onClick={handleCopy}
          title={accountAddress}
        >
          {shortAddr(accountAddress)}
        </button>
        {showCopyAlert && (
          <div className="copy-alert">
            Wallet copied!
          </div>
        )}
      </div>

      <div className="user-btn">
        {isLoadingUser ? (
          <span className="monad-id-display">Welcome: …</span>
        ) : hasUsername && monadUser?.username ? (
          // Khi đã có ID, chỉ hiển thị text, không có link
          <span className="monad-id-display-static">
            @{monadUser.username}
          </span>
        ) : (
          // Khi chưa có ID, có thể click để tạo
          <span 
            onClick={handleCreateMonadId}
            className="monad-id-display"
            title="Click to create Monad ID"
            style={{ cursor: 'pointer' }}
          >
            Create Monad ID
          </span>
        )}
        <button
          onClick={logout}
          aria-label="Sign out"
          title="Sign out"
          className="logout-btn"
        >
          <img src="/logout.svg" alt="Logout" className="logout-icon" />
        </button>
      </div>
    </div>
  );
}

export default function AuthComponent({ onAddressChange }: Props) {
  const env = useEnv();
  if (!env.NEXT_PUBLIC_PRIVY_APP_ID) return <AuthNotConfigured />;
  return <PrivyAuth onAddressChange={onAddressChange} />;
}
