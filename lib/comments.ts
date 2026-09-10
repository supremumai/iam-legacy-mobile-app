import { CommentWithAuthor, ThreadedComment } from '../types/database';

/**
 * Converts a flat array of comments (ascending created_at) into a threaded
 * structure with one level of nesting.
 *
 * Rules:
 * - Comments with parent_id === null are top-level.
 * - Comments whose parent_id matches a top-level comment's id are replies
 *   and are attached to that parent's `replies` array (ascending order).
 * - Orphans (parent_id set but the referenced id is absent from the input)
 *   are promoted to top-level so no comment is ever lost.
 * - The input array is NOT mutated.
 * - O(n) — single pass to index, single pass to assign.
 */
export function buildCommentThreads(
  comments: CommentWithAuthor[],
): ThreadedComment[] {
  // Pass 1: index every comment by id and initialise replies array.
  const map = new Map<string, ThreadedComment>();
  for (const c of comments) {
    map.set(c.id, { ...c, replies: [] });
  }

  // Pass 2: attach replies to parents; collect top-level and orphans.
  const topLevel: ThreadedComment[] = [];
  for (const threaded of map.values()) {
    if (threaded.parent_id === null) {
      topLevel.push(threaded);
    } else {
      const parent = map.get(threaded.parent_id);
      if (parent) {
        parent.replies.push(threaded);
      } else {
        // Orphan — parent was deleted or not fetched; treat as top-level.
        topLevel.push(threaded);
      }
    }
  }

  // Both arrays are already in ascending created_at order because the input
  // is ordered that way and Map preserves insertion order. No extra sort needed.
  return topLevel;
}
