import { supabase } from './supabase';

export type ReportTargetType = 'post' | 'comment' | 'user';
export type ReportReason = 'spam' | 'offensive' | 'harassment' | 'other';

export const REPORT_REASONS: ReportReason[] = ['spam', 'offensive', 'harassment', 'other'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** content_reports.reason is a single text column: "<code>" or "<code>: <details>". */
export function encodeReason(reason: ReportReason, details?: string): string {
  const trimmed = (details ?? '').trim();
  return trimmed ? `${reason}: ${trimmed}` : reason;
}

export function decodeReason(raw: string): { reason: ReportReason | null; details: string } {
  const match = /^(spam|offensive|harassment|other)(?:: ([\s\S]*))?$/.exec(raw ?? '');
  if (!match) return { reason: null, details: raw ?? '' };
  return { reason: match[1] as ReportReason, details: match[2] ?? '' };
}

export async function submitReport(params: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}): Promise<string | null> {
  const { error } = await supabase.from('content_reports').insert({
    reporter_id: params.reporterId,
    target_type: params.targetType,
    target_id: params.targetId,
    reason: encodeReason(params.reason, params.details),
  });
  return error ? error.message : null;
}

export async function fetchBlockedIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocker_id', userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { blocked_id: string }) => r.blocked_id);
}

/** Returns an error message, or null on success. A duplicate block counts as success. */
export async function insertBlock(blockerId: string, blockedId: string): Promise<string | null> {
  const { error } = await supabase
    .from('user_blocks')
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error && error.code !== '23505') return error.message;
  return null;
}

export async function deleteBlock(blockerId: string, blockedId: string): Promise<string | null> {
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
  return error ? error.message : null;
}

/**
 * PostgREST `in` list for `.not(column, 'in', list)`, or null when there is
 * nothing to exclude. Only well-formed UUIDs are interpolated.
 */
export function blockedInList(ids: Iterable<string>): string | null {
  const safe = [...ids].filter((id) => UUID_RE.test(id));
  return safe.length > 0 ? `(${safe.join(',')})` : null;
}

/** Server-side exclusion of blocked authors. Pass the id column to filter on. */
export function excludeBlocked<Q extends { not: (column: string, op: string, value: string) => Q }>(
  query: Q,
  column: string,
  ids: Iterable<string>,
): Q {
  const list = blockedInList(ids);
  return list ? query.not(column, 'in', list) : query;
}
