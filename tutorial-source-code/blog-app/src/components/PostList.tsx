import { useState } from "react";

import { deletePost, updatePost, type BlogPost } from "../lib/posts";
import { PostBodyEditor } from "./PostBodyEditor";
import { PostContent } from "./PostContent";

interface PostListProps {
  posts: BlogPost[];
  account: `0x${string}` | null;
  isAdmin: boolean;
  onChanged: () => void | Promise<void>;
}

export function PostList({ posts, account, isAdmin, onChanged }: PostListProps) {
  if (posts.length === 0) {
    return <p className="hint">No posts yet.</p>;
  }

  return (
    <ul className="post-list">
      {posts.map((post) => (
        <PostItem
          key={post.entityKey}
          post={post}
          account={account}
          isAdmin={isAdmin}
          onChanged={onChanged}
        />
      ))}
    </ul>
  );
}

interface PostItemProps {
  post: BlogPost;
  account: `0x${string}` | null;
  isAdmin: boolean;
  onChanged: () => void | Promise<void>;
}

function PostItem({ post, account, isAdmin, onChanged }: PostItemProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overLimit, setOverLimit] = useState(false);

  const startEdit = () => {
    setTitle(post.title);
    setContent(post.content);
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!account) return;
    setBusy(true);
    setError(null);
    try {
      await updatePost(account, post, title, content);
      setEditing(false);
      await onChanged();
    } catch (err) {
      console.error("Failed to update post", err);
      setError((err as Error).message ?? "Failed to update post");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!account) return;
    if (!window.confirm(`Delete post "${post.title}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      await deletePost(account, post.entityKey);
      await onChanged();
    } catch (err) {
      console.error("Failed to delete post", err);
      setError((err as Error).message ?? "Failed to delete post");
      setBusy(false);
    }
  };

  const created = new Date(post.createdAt).toLocaleString();
  const updated = new Date(post.updatedAt).toLocaleString();
  const wasEdited = post.updatedAt > post.createdAt;

  return (
    <li className="post-item card">
      {editing ? (
        <form onSubmit={handleUpdate} className="post-form">
          <label>
            <span>Title</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={200}
            />
          </label>
          <label>
            <span>Content</span>
            <PostBodyEditor
              title={title}
              content={content}
              onContentChange={setContent}
              createdAt={post.createdAt}
              onSizeChange={({ overLimit }) => setOverLimit(overLimit)}
              disabled={busy}
            />
          </label>
          {error && <div className="error-banner">{error}</div>}
          <div className="form-actions">
            <button
              type="submit"
              disabled={busy || !title.trim() || !content.trim() || overLimit}
              className="primary"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={cancelEdit} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <header className="post-header">
            <h3>{post.title}</h3>
            <small>
              {created}
              {wasEdited && <> · edited {updated}</>}
            </small>
          </header>
          <div className="post-body">
            <PostContent content={post.content} />
          </div>
          {error && <div className="error-banner">{error}</div>}
          {isAdmin && (
            <div className="form-actions">
              <button type="button" onClick={startEdit} disabled={busy}>
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="danger"
              >
                {busy ? "Working…" : "Delete"}
              </button>
            </div>
          )}
        </>
      )}
    </li>
  );
}
