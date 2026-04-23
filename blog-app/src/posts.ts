import { desc, eq } from "@arkiv-network/sdk/query";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import {
  ADMIN_ADDRESS,
  POST_ENTITY_TYPE,
  PROJECT_ATTRIBUTE,
  createReadClient,
  createWriteClient,
} from "./arkiv";

export interface BlogPost {
  /** The Arkiv entity key — used as the unique post id. */
  id: string;
  title: string;
  content: string;
  /** Milliseconds since epoch when the post was first created. */
  createdAt: number;
  /** Milliseconds since epoch when the post was last updated. */
  updatedAt: number;
}

interface BlogPostPayload {
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

/** How long each post lives on Arkiv before it has to be extended. */
const POST_LIFETIME = ExpirationTime.fromDays(365);

function isBlogPostPayload(value: unknown): value is BlogPostPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    typeof v.content === "string" &&
    typeof v.createdAt === "number" &&
    typeof v.updatedAt === "number"
  );
}

/**
 * Fetch all blog posts created by the admin wallet, sorted newest first by
 * the `createdAt` numeric attribute (Arkiv-side sort, not client-side).
 */
export async function listPosts(): Promise<BlogPost[]> {
  const publicClient = createReadClient();

  const result = await publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq("entityType", POST_ENTITY_TYPE),
    ])
    // Per skill best-practice #12: only trust posts authored by the admin
    // wallet so nobody can inject fake posts using our project attribute.
    .createdBy(ADMIN_ADDRESS)
    .orderBy(desc("createdAt", "number"))
    .withPayload(true)
    .withMetadata(true)
    .limit(100)
    .fetch();

  const posts: BlogPost[] = [];
  for (const entity of result.entities) {
    let payload: unknown;
    try {
      payload = entity.toJson();
    } catch {
      continue;
    }
    if (!isBlogPostPayload(payload)) continue;

    posts.push({
      id: entity.key,
      title: payload.title,
      content: payload.content,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
    });
  }

  return posts;
}

export async function createPost(
  account: `0x${string}`,
  input: { title: string; content: string },
): Promise<string> {
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title) throw new Error("Title is required");
  if (!content) throw new Error("Content is required");

  const walletClient = createWriteClient(account);
  const now = Date.now();

  const { entityKey } = await walletClient.createEntity({
    payload: jsonToPayload({
      title,
      content,
      createdAt: now,
      updatedAt: now,
    } satisfies BlogPostPayload),
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "entityType", value: POST_ENTITY_TYPE },
      { key: "createdAt", value: now },
      { key: "updatedAt", value: now },
    ],
    expiresIn: POST_LIFETIME,
  });

  return entityKey;
}

export async function updatePost(
  account: `0x${string}`,
  post: BlogPost,
  input: { title: string; content: string },
): Promise<void> {
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title) throw new Error("Title is required");
  if (!content) throw new Error("Content is required");

  const walletClient = createWriteClient(account);
  const now = Date.now();

  await walletClient.updateEntity({
    entityKey: post.id as `0x${string}`,
    payload: jsonToPayload({
      title,
      content,
      createdAt: post.createdAt,
      updatedAt: now,
    } satisfies BlogPostPayload),
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "entityType", value: POST_ENTITY_TYPE },
      { key: "createdAt", value: post.createdAt },
      { key: "updatedAt", value: now },
    ],
    expiresIn: POST_LIFETIME,
  });
}

export async function deletePost(
  account: `0x${string}`,
  postId: string,
): Promise<void> {
  const walletClient = createWriteClient(account);
  await walletClient.deleteEntity({ entityKey: postId as `0x${string}` });
}
