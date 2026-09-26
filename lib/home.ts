import { supabase } from './supabase';

/**
 * Normalize the `profiles` embed (arrives as an object or a single-element
 * array depending on join type) and return a display name following the
 * established fallback chain: full_name -> "@username" -> "Legacy Member".
 */
function getDisplayName(profilesRaw: unknown): string {
  const p: Record<string, unknown> | null = Array.isArray(profilesRaw)
    ? ((profilesRaw[0] as Record<string, unknown>) ?? null)
    : ((profilesRaw as Record<string, unknown>) ?? null);
  if (!p) return 'Legacy Member';
  if (p.full_name) return String(p.full_name);
  return 'Legacy Member';
}

// ─── Carousel types + fetchers ────────────────────────────────────────────────

export interface HomeEventCard {
  id: string;
  title: string | null;
  location: string | null;
  event_date: string | null;
  is_online: boolean | null;
  image_url: string | null;
}

/** Fetch up to 5 upcoming events (event_date >= now), ascending by date. */
export async function fetchUpcomingEvents(): Promise<{
  items: HomeEventCard[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, location, event_date, is_online, image_url')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(5);
    if (error) return { items: [], error: 'Could not load events.' };
    return { items: (data ?? []) as HomeEventCard[], error: null };
  } catch {
    return { items: [], error: 'Could not load events.' };
  }
}

export interface PollOption {
  id: string;
  label: string;
  sort_order: number;
  votes_count: number;
}

export interface HomePostCard {
  id: string;
  post_type: string;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  authorName: string;
  authorAvatar: string | null;
  // poll fields (only when post_type === 'poll')
  pollQuestion: string | null;
  pollOptions: PollOption[];
  pollTotalVotes: number;
}

/** Fetch up to 5 most-recent posts with author name, avatar, and poll data resolved in one query. */
export async function fetchRecentPosts(): Promise<{
  items: HomePostCard[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(
        'id, post_type, content, image_url, created_at, likes_count, profiles(full_name, username, avatar_url), polls(question, poll_options(id, label, sort_order, votes_count))',
      )
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) return { items: [], error: 'Could not load posts.' };

    return {
      items: (data ?? []).map((row: any) => {
        const pollRaw = Array.isArray(row.polls) ? row.polls[0] : row.polls;
        const pollOptions: PollOption[] = pollRaw?.poll_options
          ? [...pollRaw.poll_options].sort((a: PollOption, b: PollOption) => a.sort_order - b.sort_order)
          : [];
        const pollTotalVotes = pollOptions.reduce((acc, o) => acc + (o.votes_count ?? 0), 0);

        const profileRaw = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

        return {
          id: row.id,
          post_type: row.post_type ?? 'text',
          content: row.content ?? '',
          image_url: row.image_url ?? null,
          created_at: row.created_at,
          likes_count: row.likes_count ?? 0,
          authorName: getDisplayName(row.profiles),
          authorAvatar: profileRaw?.avatar_url ?? null,
          pollQuestion: pollRaw?.question ?? null,
          pollOptions,
          pollTotalVotes,
        };
      }),
      error: null,
    };
  } catch {
    return { items: [], error: 'Could not load posts.' };
  }
}

export interface HomeResourceCard {
  id: string;
  title: string;
  youtube_video_id: string;
  thumbnail_url: string | null;
  created_at: string;
}

/** Educational resources were migrated to the LMS — always returns empty. */
export async function fetchRecentResources(): Promise<{
  items: HomeResourceCard[];
  error: string | null;
}> {
  return { items: [], error: null };
}
