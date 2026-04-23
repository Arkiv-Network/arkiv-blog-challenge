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
export const ENTITY_TYPE_POST = "blog-post";

/** Numeric attribute used to sort posts by creation date. */
export const CREATED_AT_KEY = "createdAt";

/** Numeric attribute updated whenever a post is edited. */
export const UPDATED_AT_KEY = "updatedAt";

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
