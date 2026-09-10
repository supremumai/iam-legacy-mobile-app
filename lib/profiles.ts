import { supabase } from './supabase';
import { ProfileWithTopics, Topic } from '../types/database';

export async function fetchProfileWithTopics(
  userId: string,
): Promise<{ data: ProfileWithTopics | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, profile_topics(topics(*))')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { data: null, error: error?.message ?? 'Profile not found' };
    }

    const raw = data as any;
    const topics: Topic[] = (raw.profile_topics ?? [])
      .map((pt: any) => pt.topics as Topic | null)
      .filter((t: Topic | null): t is Topic => t !== null && t !== undefined);

    const profile: ProfileWithTopics = {
      id: raw.id,
      full_name: raw.full_name ?? null,
      username: raw.username ?? null,
      role: raw.role ?? null,
      bio: raw.bio ?? null,
      location: raw.location ?? null,
      avatar_url: raw.avatar_url ?? null,
      cover_url: raw.cover_url ?? null,
      followers_count: raw.followers_count ?? 0,
      following_count: raw.following_count ?? 0,
      points: raw.points ?? 0,
      is_admin: raw.is_admin ?? false,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      topics,
    };

    return { data: profile, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}
