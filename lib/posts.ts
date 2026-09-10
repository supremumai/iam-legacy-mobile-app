import { supabase } from './supabase';
import { Poll, PollOption, PollWithMeta, PostAuthor, PostWithAuthor, Topic } from '../types/database';

const POST_COLS =
  'id, user_id, content, image_url, likes_count, comments_count, created_at, updated_at, topic_id, post_type, profiles(id, full_name, username, avatar_url), topic:topics(id, slug, name, icon, sort_order)';

/**
 * Normalize a raw Supabase post row (with embedded `profiles`) into a
 * PostWithAuthor. The `profiles` embed can arrive as an object or a
 * single-element array depending on join type — handle both defensively.
 */
export function normalizePostRow(row: any): PostWithAuthor {
  // ── Author embed (profiles) ───────────────────────────────────────────────
  const authorRaw: any = Array.isArray(row.profiles)
    ? (row.profiles[0] ?? null)
    : (row.profiles ?? null);

  const author: PostAuthor | null = authorRaw
    ? {
        id: authorRaw.id,
        full_name: authorRaw.full_name ?? null,
        username: authorRaw.username ?? null,
        avatar_url: authorRaw.avatar_url ?? null,
      }
    : null;

  // ── Topic embed (topic:topics) ────────────────────────────────────────────
  // Same defensive shape-normalisation as profiles: Supabase can return the
  // embed as an object or a single-element array depending on join type.
  const topicRaw: any = Array.isArray(row.topic)
    ? (row.topic[0] ?? null)
    : (row.topic ?? null);

  const topic: Topic | null = topicRaw
    ? {
        id: topicRaw.id,
        slug: topicRaw.slug ?? '',
        name: topicRaw.name,
        description: topicRaw.description ?? null,
        icon: topicRaw.icon ?? null,
        sort_order: topicRaw.sort_order ?? 0,
      }
    : null;

  return {
    id: row.id,
    user_id: row.user_id,
    content: row.content,
    image_url: row.image_url ?? null,
    likes_count: row.likes_count ?? 0,
    comments_count: row.comments_count ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
    topic_id: row.topic_id ?? null,
    post_type: (row.post_type === 'poll' ? 'poll' : 'text') as 'text' | 'poll',
    author,
    topic,
  };
}

/**
 * Fetch a single post by id, including its author profile embed.
 * Returns { post: null, error: null } when the post doesn't exist
 * (e.g. was deleted) — callers should distinguish this from a
 * genuine fetch error ({ post: null, error: '...' }).
 */
export async function fetchPostById(postId: string): Promise<{
  post: PostWithAuthor | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_COLS)
      .eq('id', postId)
      .maybeSingle();

    if (error) {
      console.warn('[fetchPostById] error:', error.message);
      return { post: null, error: 'Could not load this post.' };
    }

    if (!data) {
      // Post not found — not an error, it may have been deleted
      return { post: null, error: null };
    }

    return { post: normalizePostRow(data), error: null };
  } catch (e) {
    console.warn('[fetchPostById] threw:', e);
    return { post: null, error: 'Could not load this post.' };
  }
}

/**
 * Fetch poll metadata (options + current user's votes) for a single poll post.
 * Used by the post-detail screen; community.tsx uses its own bulk fetch for
 * efficiency. Returns null if the poll doesn't exist or any fetch fails.
 */
export async function fetchPollMeta(
  postId: string,
  userId: string | null,
): Promise<PollWithMeta | null> {
  try {
    const { data: pollRow } = await supabase
      .from('polls')
      .select('*, poll_options(*)')
      .eq('post_id', postId)
      .maybeSingle();

    if (!pollRow) return null;
    const row = pollRow as any;

    const options: PollOption[] = ((row.poll_options ?? []) as any[])
      .map(
        (o: any): PollOption => ({
          id: o.id,
          poll_id: o.poll_id,
          label: o.label,
          sort_order: o.sort_order ?? 0,
          votes_count: o.votes_count ?? 0,
        }),
      )
      .sort((a: PollOption, b: PollOption) => a.sort_order - b.sort_order);

    const poll: Poll = {
      id: row.id,
      post_id: row.post_id,
      question: row.question,
      allow_multiple: row.allow_multiple ?? false,
      closes_at: row.closes_at ?? null,
      created_at: row.created_at,
    };

    const total_votes = options.reduce((sum, o) => sum + o.votes_count, 0);

    let userVotedOptionIds: string[] = [];
    if (userId && options.length > 0) {
      const { data: votes } = await supabase
        .from('poll_votes')
        .select('poll_option_id')
        .eq('poll_id', row.id)
        .eq('user_id', userId);
      userVotedOptionIds = ((votes ?? []) as any[]).map(
        (v: any) => v.poll_option_id as string,
      );
    }

    return { poll, options, userVotedOptionIds, total_votes };
  } catch (e) {
    console.warn('[fetchPollMeta] threw:', e);
    return null;
  }
}
