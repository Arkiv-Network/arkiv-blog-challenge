import { eq } from "@arkiv-network/sdk/query";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";

import {
  CREATED_AT_KEY,
  ENTITY_TYPE_KEY,
  ENTITY_TYPE_REACTION,
  PROJECT_ATTRIBUTE,
  isReactionId,
  reactionAttributeKey,
  type ReactionId,
} from "./arkiv";
import { createArkivClients, publicClient } from "./wallet";

export interface BlogReaction {
  entityKey: `0x${string}`;
  postId: string;
  reactionId: ReactionId;
  author: `0x${string}` | null;
  createdAt: number;
}

interface BlogReactionPayload {
  postId: string;
  reactionId: ReactionId;
  createdAt: number;
}

/**
 * Load all public reactions authored by any wallet for any
 * BigBeautifulBlog post. The caller groups them by `postId`.
 *
 * Reactions are *not* filtered by owner — by design, anyone may
 * react to a post. We only filter on our project attribute and
 * entity-type marker to avoid picking up unrelated entities.
 */
export async function loadAllReactions(): Promise<BlogReaction[]> {
  const result = await publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq(ENTITY_TYPE_KEY, ENTITY_TYPE_REACTION),
    ])
    .withPayload(true)
    .withMetadata(true)
    .limit(1000)
    .fetch();

  return result.entities
    .map((entity): BlogReaction | null => {
      try {
        const payload = entity.toJson() as Partial<BlogReactionPayload> | null;
        if (
          !payload ||
          typeof payload.postId !== "string" ||
          !isReactionId(payload.reactionId)
        ) {
          return null;
        }
        const createdAt =
          typeof payload.createdAt === "number" ? payload.createdAt : 0;
        const owner = (entity.owner ?? null) as `0x${string}` | null;
        return {
          entityKey: entity.key,
          postId: payload.postId.toLowerCase(),
          reactionId: payload.reactionId,
          author: owner,
          createdAt,
        };
      } catch {
        return null;
      }
    })
    .filter((r): r is BlogReaction => r !== null);
}

/**
 * Create a reaction for a post. Any connected wallet may call this —
 * there is no admin restriction on reactions.
 */
export async function createReaction(
  account: `0x${string}`,
  postId: `0x${string}`,
  reactionId: ReactionId,
): Promise<`0x${string}`> {
  const { walletClient } = createArkivClients(account);
  if (!walletClient) {
    throw new Error("Wallet client unavailable — is MetaMask installed?");
  }

  const now = Date.now();
  const normalisedPostId = postId.toLowerCase();

  const { entityKey } = await walletClient.createEntity({
    payload: jsonToPayload({
      postId: normalisedPostId,
      reactionId,
      createdAt: now,
    } satisfies BlogReactionPayload),
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: ENTITY_TYPE_KEY, value: ENTITY_TYPE_REACTION },
      // Per-post global attribute — callers who know the post id can
      // query reactions for a specific post directly via this key.
      { key: reactionAttributeKey(normalisedPostId), value: reactionId },
      { key: CREATED_AT_KEY, value: now },
    ],
    expiresIn: ExpirationTime.fromDays(365),
  });

  return entityKey;
}

/**
 * Group a flat list of reactions by post id.
 */
export function groupReactionsByPost(
  reactions: BlogReaction[],
): Map<string, BlogReaction[]> {
  const map = new Map<string, BlogReaction[]>();
  for (const reaction of reactions) {
    const key = reaction.postId;
    const list = map.get(key);
    if (list) {
      list.push(reaction);
    } else {
      map.set(key, [reaction]);
    }
  }
  return map;
}
