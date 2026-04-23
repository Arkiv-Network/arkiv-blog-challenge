import { useMemo, useState } from "react";

import {
  REACTION_EMOJIS,
  type ReactionId,
} from "../lib/arkiv";
import { createReaction, type BlogReaction } from "../lib/reactions";

interface ReactionsProps {
  postId: `0x${string}`;
  reactions: BlogReaction[];
  account: `0x${string}` | null;
  onChanged: () => void | Promise<void>;
}

/**
 * Renders reaction counts for a post and — when a wallet is
 * connected — lets the viewer add one of the positive emojis.
 *
 * Anyone with a connected wallet can react; there is no admin
 * restriction.
 */
export function Reactions({
  postId,
  reactions,
  account,
  onChanged,
}: ReactionsProps) {
  const [busyId, setBusyId] = useState<ReactionId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map = new Map<ReactionId, number>();
    for (const reaction of reactions) {
      map.set(reaction.reactionId, (map.get(reaction.reactionId) ?? 0) + 1);
    }
    return map;
  }, [reactions]);

  const myReactions = useMemo(() => {
    if (!account) return new Set<ReactionId>();
    const lower = account.toLowerCase();
    return new Set(
      reactions
        .filter((r) => r.author && r.author.toLowerCase() === lower)
        .map((r) => r.reactionId),
    );
  }, [reactions, account]);

  const handleReact = async (reactionId: ReactionId) => {
    if (!account) return;
    setBusyId(reactionId);
    setError(null);
    try {
      await createReaction(account, postId, reactionId);
      await onChanged();
    } catch (err) {
      console.error("Failed to add reaction", err);
      setError((err as Error).message ?? "Failed to add reaction");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="reactions">
      <ul className="reaction-list">
        {REACTION_EMOJIS.map(({ id, emoji, label }) => {
          const count = counts.get(id) ?? 0;
          const mine = myReactions.has(id);
          const disabled = !account || busyId !== null;
          return (
            <li key={id}>
              <button
                type="button"
                className={`reaction-button${mine ? " reaction-mine" : ""}`}
                onClick={() => void handleReact(id)}
                disabled={disabled}
                title={
                  account
                    ? `React with ${label}`
                    : "Connect a wallet to react"
                }
                aria-label={`${label} (${count})`}
              >
                <span className="reaction-emoji" aria-hidden="true">
                  {emoji}
                </span>
                <span className="reaction-count">{count}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {error && <div className="error-banner">{error}</div>}
      {!account && (
        <p className="reaction-hint">
          Connect your wallet to add a reaction.
        </p>
      )}
    </div>
  );
}
