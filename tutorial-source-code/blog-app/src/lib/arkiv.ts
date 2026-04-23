/**
 * Shared Arkiv constants for the blog app.
 *
 * Every entity created by this app must include `PROJECT_ATTRIBUTE` so that
 * queries can distinguish our data from everything else stored on the
 * shared Arkiv network.
 */
export const PROJECT_ATTRIBUTE = {
  key: "project",
  value: "arkiv-blog-challenge-v1",
} as const;

/** Attribute key used to mark blog post entities. */
export const ENTITY_TYPE_KEY = "entityType";
/** Entity type marker for a BigBeautifulBlog blog entry. */
export const ENTITY_TYPE_POST = "big-beautiful-blog-entry";
/** Entity type marker for a BigBeautifulBlog reaction. */
export const ENTITY_TYPE_REACTION = "big-beautiful-blog-reaction";

/** Numeric attribute used to sort posts by creation date. */
export const CREATED_AT_KEY = "createdAt";

/** Numeric attribute updated whenever a post is edited. */
export const UPDATED_AT_KEY = "updatedAt";

/**
 * Attribute key used on a reaction entity so it can be found via a
 * per-post global query. The attribute key embeds the post id so that
 * anyone can query reactions for a specific post without needing to
 * know the reaction's entity key.
 *
 * Example: `big-beautiful-blog-post-reaction-0xabc…`
 */
export function reactionAttributeKey(postId: string): string {
  return `big-beautiful-blog-post-reaction-${postId.toLowerCase()}`;
}

/**
 * Allowed reactions — only positive emojis, to keep BigBeautifulBlog
 * a positive place. The `id` is persisted on the reaction payload and
 * attribute value so it is stable even if the emoji glyph changes.
 */
export const REACTION_EMOJIS = [
  { id: "smile", emoji: "😊", label: "Smile" },
  { id: "fire", emoji: "🔥", label: "Fire" },
  { id: "thumbs-up", emoji: "👍", label: "Thumbs up" },
  { id: "heart", emoji: "❤️", label: "Heart" },
  { id: "clap", emoji: "👏", label: "Clap" },
  { id: "party", emoji: "🎉", label: "Party" },
  { id: "star", emoji: "⭐", label: "Star" },
] as const;

export type ReactionId = (typeof REACTION_EMOJIS)[number]["id"];

export function isReactionId(value: unknown): value is ReactionId {
  return (
    typeof value === "string" &&
    REACTION_EMOJIS.some((r) => r.id === value)
  );
}

/**
 * The wallet address allowed to create / edit / delete posts.
 * All other connected wallets get a read-only view.
 */
export const ADMIN_ADDRESS =
  "0x86d5Ef282afeA49720B424D0B87BAA145D331c79" as const;

export function isAdminAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  return address.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
}
