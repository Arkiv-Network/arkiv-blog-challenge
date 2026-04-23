/**
 * Helpers shared by the post editor and renderer:
 *  - payload size limit (Arkiv stores the JSON payload, so we keep it small),
 *  - inline image data-URIs created from drag-and-dropped files,
 *  - lightweight detection of popular social-network URLs so we can render a
 *    "miniature" preview card without a backend.
 */

/**
 * Maximum size in bytes of the JSON payload sent to Arkiv when creating or
 * updating a post.  The user is warned and the submit button is disabled
 * once this limit is exceeded.  30 kB is enough room for a reasonable text
 * post plus a small inline image or two.
 */
export const MAX_PAYLOAD_BYTES = 30 * 1024;

interface PayloadShape {
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Compute the exact UTF-8 byte size of the JSON payload that will be sent to
 * Arkiv.  We use the same shape that `lib/posts.ts` serialises so the editor
 * can warn users before they hit the network.
 */
export function computePayloadBytes(payload: PayloadShape): number {
  const json = JSON.stringify(payload);
  return new TextEncoder().encode(json).length;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} kB`;
}

/** Read a `File` as a `data:` URI suitable for embedding inline. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") resolve(result);
      else reject(new Error("Failed to read file"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Insert `snippet` into `original` at the given caret position (replacing any
 * selected range).  Returns the new string plus the caret position to set on
 * the textarea after the insertion.
 */
export function insertAtCaret(
  original: string,
  snippet: string,
  selectionStart: number,
  selectionEnd: number,
): { value: string; caret: number } {
  const before = original.slice(0, selectionStart);
  const after = original.slice(selectionEnd);
  const value = `${before}${snippet}${after}`;
  return { value, caret: selectionStart + snippet.length };
}

export type SocialKind =
  | "youtube"
  | "twitter"
  | "github"
  | "instagram"
  | "linkedin"
  | "facebook"
  | "tiktok"
  | "reddit"
  | "mastodon"
  | "generic";

export interface SocialPreview {
  kind: SocialKind;
  /** Display label for the link (e.g. "YouTube", domain name). */
  label: string;
  /** Original URL. */
  url: string;
  /** Optional thumbnail image URL (used for the miniature). */
  thumbnail?: string;
  /** Favicon URL — works for any HTTP(S) link via Google's service. */
  favicon: string;
}

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

function youtubeVideoId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id || null;
  }
  if (YOUTUBE_HOSTS.has(host)) {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const m = url.pathname.match(/^\/(?:embed|shorts|v)\/([^/]+)/);
    if (m) return m[1];
  }
  return null;
}

/**
 * Inspect a URL and return a lightweight preview descriptor for known social
 * networks.  No network calls are made — for YouTube we derive the thumbnail
 * URL from the video id, for everything else we use Google's public favicon
 * service so the card always has an icon.
 */
export function detectSocialPreview(rawUrl: string): SocialPreview | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const favicon = `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host)}`;

  const ytId = youtubeVideoId(url);
  if (ytId) {
    return {
      kind: "youtube",
      label: "YouTube",
      url: rawUrl,
      thumbnail: `https://img.youtube.com/vi/${encodeURIComponent(ytId)}/hqdefault.jpg`,
      favicon,
    };
  }

  const known: Array<[RegExp, SocialKind, string]> = [
    [/(^|\.)twitter\.com$|(^|\.)x\.com$/, "twitter", "X (Twitter)"],
    [/(^|\.)github\.com$/, "github", "GitHub"],
    [/(^|\.)instagram\.com$/, "instagram", "Instagram"],
    [/(^|\.)linkedin\.com$/, "linkedin", "LinkedIn"],
    [/(^|\.)facebook\.com$|(^|\.)fb\.com$/, "facebook", "Facebook"],
    [/(^|\.)tiktok\.com$/, "tiktok", "TikTok"],
    [/(^|\.)reddit\.com$/, "reddit", "Reddit"],
    [/(^|\.)mastodon\.[a-z.]+$|(^|\.)mas\.to$/, "mastodon", "Mastodon"],
  ];

  for (const [re, kind, label] of known) {
    if (re.test(host)) {
      return { kind, label, url: rawUrl, favicon };
    }
  }
  return { kind: "generic", label: host, url: rawUrl, favicon };
}

/** Match a bare URL inside text. */
export const URL_REGEX = /\bhttps?:\/\/[^\s<>"')]+/g;
