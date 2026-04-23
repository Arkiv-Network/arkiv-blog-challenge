import { useEffect, useState, useCallback } from "react";
import { ADMIN_ADDRESS, connectWallet, isAdmin } from "./arkiv";
import {
  type BlogPost,
  createPost,
  deletePost,
  listPosts,
  updatePost,
} from "./posts";
import { PostForm } from "./components/PostForm";
import { PostList } from "./components/PostList";

type LoadState = "idle" | "loading" | "ready" | "error";

export function App() {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const admin = isAdmin(account);

  const refresh = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);
    try {
      const data = await listPosts();
      setPosts(data);
      setLoadState("ready");
    } catch (err) {
      console.error("Failed to load posts", err);
      setLoadError((err as Error).message);
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onConnect = async () => {
    setConnectError(null);
    setConnecting(true);
    try {
      const addr = await connectWallet();
      setAccount(addr);
    } catch (err) {
      console.error("Failed to connect wallet", err);
      setConnectError((err as Error).message);
    } finally {
      setConnecting(false);
    }
  };

  const onCreate = async (input: { title: string; content: string }) => {
    if (!account) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await createPost(account, input);
      setCreating(false);
      await refresh();
    } catch (err) {
      console.error("Failed to create post", err);
      setActionError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const onUpdate = async (input: { title: string; content: string }) => {
    if (!account || !editing) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await updatePost(account, editing, input);
      setEditing(null);
      await refresh();
    } catch (err) {
      console.error("Failed to update post", err);
      setActionError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (post: BlogPost) => {
    if (!account) return;
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await deletePost(account, post.id);
      await refresh();
    } catch (err) {
      console.error("Failed to delete post", err);
      setActionError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Arkiv Blog</h1>
          <p className="tagline">
            A decentralized blog backed by{" "}
            <a
              href="https://arkiv.network"
              target="_blank"
              rel="noopener noreferrer"
            >
              Arkiv
            </a>{" "}
            on the Kaolin testnet.
          </p>
        </div>
        <div className="account-box">
          {account ? (
            <>
              <div className="account-address" title={account}>
                {account.slice(0, 6)}…{account.slice(-4)}
              </div>
              <div className={`role-badge ${admin ? "admin" : "viewer"}`}>
                {admin ? "Admin" : "Viewer (read-only)"}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              disabled={connecting}
              className="primary"
            >
              {connecting ? "Connecting…" : "Connect MetaMask"}
            </button>
          )}
          {connectError && <div className="error">{connectError}</div>}
        </div>
      </header>

      {account && !admin && (
        <div className="notice">
          You're signed in as a viewer. Only the admin wallet (
          <code>{ADMIN_ADDRESS}</code>) can create, edit, or delete posts.
        </div>
      )}

      {admin && (
        <section className="admin-bar">
          {creating || editing ? (
            <PostForm
              initial={editing ?? undefined}
              submitting={submitting}
              onSubmit={editing ? onUpdate : onCreate}
              onCancel={() => {
                setCreating(false);
                setEditing(null);
                setActionError(null);
              }}
            />
          ) : (
            <button
              type="button"
              className="primary"
              onClick={() => {
                setCreating(true);
                setActionError(null);
              }}
            >
              + New post
            </button>
          )}
          {actionError && <div className="error">{actionError}</div>}
        </section>
      )}

      <main>
        {loadState === "loading" && <p>Loading posts…</p>}
        {loadState === "error" && (
          <div className="error">
            Failed to load posts: {loadError}
            <button type="button" onClick={refresh} className="link">
              Try again
            </button>
          </div>
        )}
        {loadState === "ready" && (
          <PostList
            posts={posts}
            isAdmin={admin}
            onEdit={(p) => {
              setEditing(p);
              setCreating(false);
              setActionError(null);
            }}
            onDelete={onDelete}
            disabled={submitting}
          />
        )}
      </main>

      <footer className="app-footer">
        Built with the{" "}
        <a
          href="https://www.npmjs.com/package/@arkiv-network/sdk"
          target="_blank"
          rel="noopener noreferrer"
        >
          @arkiv-network/sdk
        </a>
        . Posts are stored as Arkiv entities and sorted by their{" "}
        <code>createdAt</code> attribute.
      </footer>
    </div>
  );
}
