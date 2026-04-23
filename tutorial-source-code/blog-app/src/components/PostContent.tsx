/**
 * Render a blog post body with very small markdown-like support:
 *   - `![alt](url)`         → inline image (data: URIs included),
 *   - `[label](url)`        → hyperlink,
 *   - bare http/https URLs  → hyperlink, and when a URL is the only thing
 *     on its line a "miniature" preview card is rendered for popular
 *     social networks (YouTube thumbnail, X / GitHub / Instagram / …).
 *
 * No external markdown library is pulled in: the parser stays small enough
 * to keep the bundle tight and avoids dependency churn for this tutorial.
 */
import { Fragment, type ReactNode } from "react";

import { detectSocialPreview, URL_REGEX } from "../lib/content";

interface PostContentProps {
  content: string;
}

const IMAGE_MD = /^!\[([^\]]*)\]\((.+?)\)$/;
const LINK_MD = /\[([^\]]+)\]\(([^\s)]+)\)/g;

export function PostContent({ content }: PostContentProps) {
  // Split on blank lines to form "paragraphs".  Image markdown and bare
  // social links are typically on their own line so this gives us natural
  // block boundaries without needing a real markdown parser.
  const blocks = content.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, index) => (
        <Block key={index} text={block} />
      ))}
    </>
  );
}

function Block({ text }: { text: string }) {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;

  // A whole-block image: render as a figure.
  const imageMatch = trimmed.match(IMAGE_MD);
  if (imageMatch) {
    const [, alt, src] = imageMatch;
    return (
      <figure className="post-image">
        <img src={src} alt={alt} loading="lazy" />
        {alt && <figcaption>{alt}</figcaption>}
      </figure>
    );
  }

  // A whole-block bare URL: render as a social/link miniature.
  if (/^https?:\/\/\S+$/.test(trimmed)) {
    const preview = detectSocialPreview(trimmed);
    if (preview) {
      return <SocialCard preview={preview} />;
    }
  }

  // Otherwise render as paragraphs preserving single-line breaks.
  return (
    <>
      {text.split("\n").map((line, i) => (
        <p key={i}>{renderInline(line)}</p>
      ))}
    </>
  );
}

function SocialCard({ preview }: { preview: ReturnType<typeof detectSocialPreview> }) {
  if (!preview) return null;
  return (
    <a
      className={`social-card social-${preview.kind}`}
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {preview.thumbnail && (
        <div className="social-card-thumb">
          <img src={preview.thumbnail} alt="" loading="lazy" />
          {preview.kind === "youtube" && (
            <span className="social-card-play" aria-hidden="true">
              ▶
            </span>
          )}
        </div>
      )}
      <div className="social-card-meta">
        <img className="social-card-favicon" src={preview.favicon} alt="" />
        <div>
          <div className="social-card-label">{preview.label}</div>
          <div className="social-card-url">{preview.url}</div>
        </div>
      </div>
    </a>
  );
}

/**
 * Render the inline content of a single line: `[label](url)` markdown links
 * first, then any remaining bare URLs are auto-linked.
 */
function renderInline(line: string): ReactNode {
  const parts: ReactNode[] = [];
  let cursor = 0;
  // Reset regex lastIndex for each invocation.
  LINK_MD.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = LINK_MD.exec(line)) !== null) {
    if (match.index > cursor) {
      parts.push(autoLink(line.slice(cursor, match.index), `t${parts.length}`));
    }
    parts.push(
      <a key={`l${parts.length}`} href={match[2]} target="_blank" rel="noopener noreferrer">
        {match[1]}
      </a>,
    );
    cursor = match.index + match[0].length;
  }
  if (cursor < line.length) {
    parts.push(autoLink(line.slice(cursor), `t${parts.length}`));
  }
  return parts.length > 0 ? <Fragment>{parts}</Fragment> : line;
}

function autoLink(text: string, keyPrefix: string): ReactNode {
  const parts: ReactNode[] = [];
  let cursor = 0;
  URL_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > cursor) {
      parts.push(text.slice(cursor, match.index));
    }
    parts.push(
      <a
        key={`${keyPrefix}-${parts.length}`}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
      >
        {match[0]}
      </a>,
    );
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <Fragment>{parts}</Fragment>;
}
