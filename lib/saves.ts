import { supabase } from './supabase';

export type SaveableType = 'post' | 'event' | 'resource';

/**
 * Toggle a save against the unified `saves` table.
 * Inserts when not yet saved, deletes when already saved.
 * Returns the new saved state (true = now saved).
 * Throws on Supabase error — caller is responsible for optimistic rollback.
 */
export async function toggleSave(
  saveableType: SaveableType,
  saveableId: string,
  userId: string,
  isCurrentlySaved: boolean,
): Promise<boolean> {
  if (!isCurrentlySaved) {
    const { error } = await supabase
      .from('saves')
      .insert({ user_id: userId, saveable_type: saveableType, saveable_id: saveableId });
    if (error) throw error;
    return true;
  } else {
    const { error } = await supabase
      .from('saves')
      .delete()
      .eq('user_id', userId)
      .eq('saveable_type', saveableType)
      .eq('saveable_id', saveableId);
    if (error) throw error;
    return false;
  }
}

/**
 * Bulk-fetch the set of saveable_ids that userId has saved for a given type.
 * Single query — never N+1. Returns empty Set on error (non-throwing).
 */
export async function fetchSavedIds(
  saveableType: SaveableType,
  ids: string[],
  userId: string,
): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  try {
    const { data, error } = await supabase
      .from('saves')
      .select('saveable_id')
      .eq('user_id', userId)
      .eq('saveable_type', saveableType)
      .in('saveable_id', ids);
    if (error) throw error;
    return new Set((data ?? []).map((r: any) => r.saveable_id as string));
  } catch (e) {
    console.warn('[saves] fetchSavedIds threw:', e);
    return new Set();
  }
}
