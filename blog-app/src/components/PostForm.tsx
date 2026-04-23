import { useEffect, useState } from "react";
import type { BlogPost } from "../posts";

interface PostFormProps {
  initial?: BlogPost;
  submitting: boolean;
  onSubmit: (input: { title: string; content: string }) => void | Promise<void>;
  onCancel: () => void;
}

export function PostForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: PostFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setContent(initial?.content ?? "");
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onSubmit({ title, content });
  };

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <h2>{initial ? "Edit post" : "New post"}</h2>
      <label>
        <span>Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
          disabled={submitting}
        />
      </label>
      <label>
        <span>Content</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          required
          disabled={submitting}
        />
      </label>
      <div className="form-actions">
        <button type="submit" className="primary" disabled={submitting}>
          {submitting
            ? initial
              ? "Saving…"
              : "Publishing…"
            : initial
              ? "Save changes"
              : "Publish"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
