import { useState } from "react";

import { createPost } from "../lib/posts";
import { PostBodyEditor } from "./PostBodyEditor";

interface PostEditorProps {
  account: `0x${string}`;
  onSaved: () => void | Promise<void>;
}

/**
 * Admin-only form for creating new blog posts.
 */
export function PostEditor({ account, onSaved }: PostEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overLimit, setOverLimit] = useState(false);

  const reset = () => {
    setTitle("");
    setContent("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createPost(account, title, content);
      reset();
      await onSaved();
    } catch (err) {
      console.error("Failed to create post", err);
      setError((err as Error).message ?? "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card">
      <h2>New post</h2>
      <form onSubmit={handleSubmit} className="post-form">
        <label>
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Post title"
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
            onSizeChange={({ overLimit }) => setOverLimit(overLimit)}
            disabled={submitting}
          />
        </label>
        {error && <div className="error-banner">{error}</div>}
        <div className="form-actions">
          <button
            type="submit"
            disabled={
              submitting || !title.trim() || !content.trim() || overLimit
            }
            className="primary"
          >
            {submitting ? "Publishing…" : "Publish"}
          </button>
          <button type="button" onClick={reset} disabled={submitting}>
            Clear
          </button>
        </div>
      </form>
    </section>
  );
}
