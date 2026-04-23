import { desc, eq } from "@arkiv-network/sdk/query";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";

import {
  ADMIN_ADDRESS,
  CREATED_AT_KEY,
  ENTITY_TYPE_KEY,
  ENTITY_TYPE_POST,
  PROJECT_ATTRIBUTE,
  UPDATED_AT_KEY,
} from "./arkiv";
import { createArkivClients, publicClient } from "./wallet";

export interface BlogPost {
  /** Arkiv entity key — stable unique identifier (the post id). */
  entityKey: `0x${string}`;
  title: string;
  content: string;
  /** Unix epoch ms (also stored as a numeric attribute for sorting). */
  createdAt: number;
  /** Unix epoch ms of last edit (or createdAt if never edited). */
  updatedAt: number;
}

/** Backwards-compatible alias — a BigBeautifulBlog entry is a BlogPost. */
export type BigBeautifulBlogEntry = BlogPost;

interface BlogPostPayload {
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Load all blog posts owned by the admin wallet, sorted by the
 * `createdAt` numeric attribute (newest first).
 *
 * We filter by `.ownedBy(ADMIN_ADDRESS)` so that only posts authored by
 * the trusted admin wallet are shown — this prevents anyone else from
 * injecting fake posts using our project attribute.
 */
export async function loadPosts(): Promise<BlogPost[]> {
  const result = await publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq(ENTITY_TYPE_KEY, ENTITY_TYPE_POST),
    ])
    // Filter to entities owned by the admin wallet. The admin is the only
    // wallet authorised to create entities through this app, so this acts
    // as a trusted-source filter — no other wallet can inject fake posts
    // even if they attach the same project attribute.
    .ownedBy(ADMIN_ADDRESS)
    .orderBy(desc(CREATED_AT_KEY, "number"))
    .withPayload(true)
    .withMetadata(true)
    .limit(100)
    .fetch();

  return result.entities
    .map((entity): BlogPost | null => {
      try {
        const payload = entity.toJson() as Partial<BlogPostPayload> | null;
        if (
          !payload ||
          typeof payload.title !== "string" ||
          typeof payload.content !== "string"
        ) {
          return null;
        }
        const createdAt =
          typeof payload.createdAt === "number" ? payload.createdAt : 0;
        const updatedAt =
          typeof payload.updatedAt === "number"
            ? payload.updatedAt
            : createdAt;
        return {
          entityKey: entity.key,
          title: payload.title,
          content: payload.content,
          createdAt,
          updatedAt,
        };
      } catch {
        return null;
      }
    })
    .filter((post): post is BlogPost => post !== null);
}

function requireWalletClient(account: `0x${string}`) {
  const { walletClient } = createArkivClients(account);
  if (!walletClient) {
    throw new Error("Wallet client unavailable — is MetaMask installed?");
  }
  return walletClient;
}

export async function createPost(
  account: `0x${string}`,
  title: string,
  content: string,
): Promise<`0x${string}`> {
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  if (!trimmedTitle || !trimmedContent) {
    throw new Error("Title and content are required");
  }

  const walletClient = requireWalletClient(account);
  const now = Date.now();

  const { entityKey } = await walletClient.createEntity({
    payload: jsonToPayload({
      title: trimmedTitle,
      content: trimmedContent,
      createdAt: now,
      updatedAt: now,
    } satisfies BlogPostPayload),
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: ENTITY_TYPE_KEY, value: ENTITY_TYPE_POST },
      { key: CREATED_AT_KEY, value: now },
      { key: UPDATED_AT_KEY, value: now },
    ],
    expiresIn: ExpirationTime.fromDays(365),
  });

  return entityKey;
}

export async function updatePost(
  account: `0x${string}`,
  post: BlogPost,
  title: string,
  content: string,
): Promise<void> {
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  if (!trimmedTitle || !trimmedContent) {
    throw new Error("Title and content are required");
  }

  const walletClient = requireWalletClient(account);
  const now = Date.now();

  await walletClient.updateEntity({
    entityKey: post.entityKey,
    payload: jsonToPayload({
      title: trimmedTitle,
      content: trimmedContent,
      createdAt: post.createdAt,
      updatedAt: now,
    } satisfies BlogPostPayload),
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: ENTITY_TYPE_KEY, value: ENTITY_TYPE_POST },
      // Keep original createdAt so sort order remains stable across edits.
      { key: CREATED_AT_KEY, value: post.createdAt },
      { key: UPDATED_AT_KEY, value: now },
    ],
    expiresIn: ExpirationTime.fromDays(365),
  });
}

export async function deletePost(
  account: `0x${string}`,
  entityKey: `0x${string}`,
): Promise<void> {
  const walletClient = requireWalletClient(account);
  await walletClient.deleteEntity({ entityKey });
}
