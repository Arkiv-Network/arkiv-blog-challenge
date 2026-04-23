import { useCallback, useEffect, useState } from "react";

import { ADMIN_ADDRESS, isAdminAddress } from "./lib/arkiv";
import { connectWallet } from "./lib/wallet";
import { loadPosts, type BlogPost } from "./lib/posts";
import { PostList } from "./components/PostList";
import { PostEditor } from "./components/PostEditor";

export function App() {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const isAdmin = isAdminAddress(account);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await loadPosts();
      setPosts(fetched);
    } catch (err) {
      console.error("Failed to load posts", err);
      setError((err as Error).message ?? "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const address = await connectWallet();
      setAccount(address);
    } catch (err) {
      console.error("Failed to connect wallet", err);
      setError((err as Error).message ?? "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Arkiv Blog</h1>
          <p className="subtitle">
            A decentralized blog stored on the Arkiv Kaolin testnet.
          </p>
        </div>
        <div className="account-area">
          {account ? (
            <div className="account-info">
              <span className="account-address">
                {account.slice(0, 6)}…{account.slice(-4)}
              </span>
              <span
                className={`role-badge ${isAdmin ? "role-admin" : "role-user"}`}
              >
                {isAdmin ? "Admin" : "Reader"}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="primary"
            >
              {connecting ? "Connecting…" : "Connect MetaMask"}
            </button>
          )}
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {!account && (
        <p className="hint">
          Browsing as a guest — connect your wallet to manage posts (admin
          only). Admin address: <code>{ADMIN_ADDRESS}</code>
        </p>
      )}

      {account && !isAdmin && (
        <p className="hint">
          Connected wallet is not the admin. You can read posts but cannot
          edit them.
        </p>
      )}

      {isAdmin && account && (
        <PostEditor account={account} onSaved={refresh} />
      )}

      <section>
        <div className="list-header">
          <h2>Posts</h2>
          <button type="button" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
        {loading ? (
          <p>Loading posts…</p>
        ) : (
          <PostList
            posts={posts}
            account={account}
            isAdmin={isAdmin}
            onChanged={refresh}
          />
        )}
      </section>

      <footer className="app-footer">
        <p>
          Backend: Arkiv Kaolin testnet ·{" "}
          <a
            href="https://explorer.kaolin.hoodi.arkiv.network"
            target="_blank"
            rel="noreferrer"
          >
            Explorer
          </a>
        </p>
      </footer>
    </div>
  );
}
