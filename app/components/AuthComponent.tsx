"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  usePrivy,
  type CrossAppAccountWithMetadata,
} from "@privy-io/react-auth";
import { useMonadGamesUser } from "../hooks/useMonadGamesUser";

const MONAD_APP_ID = process.env.NEXT_PUBLIC_MONAD_APP_ID;
const MONAD_PORTAL_URL = process.env.NEXT_PUBLIC_MONAD_PORTAL_URL;

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

  const crossAppAccount = useMemo<
    CrossAppAccountWithMetadata | undefined
  >(() => {
    if (!user) return undefined;
    return user.linkedAccounts
      .filter((a): a is CrossAppAccountWithMetadata => a.type === "cross_app")
      .find((a) => a.providerApp?.id === MONAD_APP_ID);
  }, [user]);

  const accountAddress = useMemo(() => {
    const addr = crossAppAccount?.embeddedWallets?.[0]?.address;
    return typeof addr === "string" ? addr : "";
  }, [crossAppAccount]);

  const [prevAddr, setPrevAddr] = useState<string>("");

  useEffect(() => {
    if (accountAddress !== prevAddr) {
      setPrevAddr(accountAddress);
      onAddressChange(accountAddress);
    }
  }, [accountAddress, prevAddr, onAddressChange]);

  const hasMonadAccount = !!crossAppAccount;
  const {
    user: monadUser,
    hasUsername,
    isLoading: isLoadingUser,
  } = useMonadGamesUser(accountAddress);

  const profileUrl =
    hasUsername && monadUser?.username
      ? `${MONAD_PORTAL_URL}/u/${monadUser.username}`
      : MONAD_PORTAL_URL;

  const [showCopyAlert, setShowCopyAlert] = useState(false);

  const handleCopy = useCallback(() => {
    if (!accountAddress) return;
    navigator.clipboard.writeText(accountAddress).then(() => {
      setShowCopyAlert(true);
      setTimeout(() => setShowCopyAlert(false), 2000); // Hide after 2 seconds
    }).catch(() => {});
  }, [accountAddress]);

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

  // === CONNECTED: 2 buttons (Monad ID, Embedded Wallet) ===
  return (
    <div className="auth-actions-row">
      <div className="user-btn">
        <span>
          {isLoadingUser
            ? "Welcome: …"
            : hasUsername && monadUser?.username
            ? `@${monadUser.username}`
            : "@Monad ID"}
        </span>
        <button
          onClick={logout}
          aria-label="Sign out"
          title="Sign out"
        >
          [→]
        </button>
      </div>

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
    </div>
  );
}

export default function AuthComponent({ onAddressChange }: Props) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!privyAppId) return <AuthNotConfigured />;
  return <PrivyAuth onAddressChange={onAddressChange} />;
}
