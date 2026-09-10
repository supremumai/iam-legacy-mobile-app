import { supabase } from './supabase';

export type HomeFeedItemType = 'post' | 'resource';

export interface HomeFeedItem {
  type: HomeFeedItemType;
  id: string;              // the underlying post or resource id
  label: string;           // 'COMMUNITY' or 'EDUCATION'
  accentColor: string;     // '#10B981' for post, '#6366F1' for resource
  title: string;           // short headline
  subtitle: string;        // truncated content/title, max 60 chars
  createdAt: string;       // ISO timestamp, used for sorting
}

/** Truncate text to `max` characters, appending an ellipsis if trimmed. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

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
  if (p.username) return `@${String(p.username)}`;
  return 'Legacy Member';
}

/**
 * Fetch the 3 most-recent posts and 3 most-recent resources in parallel,
 * merge them into a unified HomeFeedItem list sorted by createdAt descending,
 * and return the top 3 total.
 *
 * Never throws — any failure returns { items: [], error: '...' }.
 */
export async function fetchLatestUpdates(): Promise<{
  items: HomeFeedItem[];
  error: string | null;
}> {
  try {
    const [postsResult, resourcesResult] = await Promise.all([
      supabase
        .from('posts')
        .select('id, content, created_at, profiles(full_name, username)')
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('resources')
        .select('id, title, created_at, profiles:submitted_by(full_name, username)')
        .order('created_at', { ascending: false })
        .limit(3),
    ]);

    const postItems: HomeFeedItem[] = (postsResult.data ?? []).map((row: any) => ({
      type: 'post' as const,
      id: row.id,
      label: 'COMMUNITY',
      accentColor: '#10B981',
      title: `${getDisplayName(row.profiles)} posted`,
      subtitle: truncate(row.content ?? '', 60),
      createdAt: row.created_at,
    }));

    const resourceItems: HomeFeedItem[] = (resourcesResult.data ?? []).map((row: any) => ({
      type: 'resource' as const,
      id: row.id,
      label: 'EDUCATION',
      accentColor: '#6366F1',
      title: 'New video shared',
      subtitle: truncate(row.title ?? '', 60),
      createdAt: row.created_at,
    }));

    const merged = [...postItems, ...resourceItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return { items: merged.slice(0, 3), error: null };
  } catch {
    return { items: [], error: 'Could not load recent activity.' };
  }
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

export interface HomePostCard {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  authorName: string; // resolved via the established full_name -> @username -> "Legacy Member" chain
}

/** Fetch up to 5 most-recent posts with author display name resolved. */
export async function fetchRecentPosts(): Promise<{
  items: HomePostCard[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, content, image_url, created_at, profiles(full_name, username)')
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) return { items: [], error: 'Could not load posts.' };
    return {
      items: (data ?? []).map((row: any) => ({
        id: row.id,
        content: row.content ?? '',
        image_url: row.image_url ?? null,
        created_at: row.created_at,
        authorName: getDisplayName(row.profiles),
      })),
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

/** Fetch up to 5 most-recent educational resources. */
export async function fetchRecentResources(): Promise<{
  items: HomeResourceCard[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('id, title, youtube_video_id, thumbnail_url, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) return { items: [], error: 'Could not load resources.' };
    return { items: (data ?? []) as HomeResourceCard[], error: null };
  } catch {
    return { items: [], error: 'Could not load resources.' };
  }
}
