import type { BlogPost } from "../posts";

interface PostListProps {
  posts: BlogPost[];
  isAdmin: boolean;
  disabled?: boolean;
  onEdit: (post: BlogPost) => void;
  onDelete: (post: BlogPost) => void;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString();
}

export function PostList({
  posts,
  isAdmin,
  disabled,
  onEdit,
  onDelete,
}: PostListProps) {
  if (posts.length === 0) {
    return (
      <p className="empty">
        No posts yet.{" "}
        {isAdmin
          ? "Create the first one!"
          : "Check back soon — the admin hasn't published anything."}
      </p>
    );
  }

  return (
    <ul className="post-list">
      {posts.map((post) => (
        <li key={post.id} className="post">
          <article>
            <h2>{post.title}</h2>
            <div className="post-meta">
              <time dateTime={new Date(post.createdAt).toISOString()}>
                Published {formatDate(post.createdAt)}
              </time>
              {post.updatedAt > post.createdAt && (
                <span> · edited {formatDate(post.updatedAt)}</span>
              )}
            </div>
            <p className="post-content">{post.content}</p>
            <div className="post-id" title={post.id}>
              entity: <code>{post.id.slice(0, 16)}…</code>
            </div>
            {isAdmin && (
              <div className="post-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => onEdit(post)}
                  disabled={disabled}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => onDelete(post)}
                  disabled={disabled}
                >
                  Delete
                </button>
              </div>
            )}
          </article>
        </li>
      ))}
    </ul>
  );
}
