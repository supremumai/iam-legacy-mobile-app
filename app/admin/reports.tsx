import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ActionSheet from '../../components/ActionSheet';
import { SimModal } from '../../components/SimModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { useColors } from '../../contexts/ThemeContext';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { Fonts } from '../../constants/fonts';
import { supabase } from '../../lib/supabase';
import { decodeReason, ReportTargetType } from '../../lib/moderation';
import { formatRelativeTime } from '../../lib/time';

type ReportStatus = 'pending' | 'reviewed' | 'removed' | 'dismissed';

interface ReportRow {
  id: string;
  reporter_id: string | null;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
}

interface TargetPreview {
  missing: boolean;
  text: string | null;
  authorId: string | null;
  authorName: string | null;
  postId: string | null;
}

const first = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

export default function AdminReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const { t, locale } = useLanguage();
  const isAdmin = useIsAdmin();

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [previews, setPreviews] = useState<Record<string, TargetPreview>>({});
  const [reporterNames, setReporterNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<ReportRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('content_reports')
        .select('id, reporter_id, target_type, target_id, reason, status, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (fetchError) throw fetchError;

      const rows = (data ?? []) as ReportRow[];
      const idsOf = (type: ReportTargetType) => [...new Set(rows.filter((r) => r.target_type === type).map((r) => r.target_id))];
      const postIds = idsOf('post');
      const commentIds = idsOf('comment');
      const userIds = idsOf('user');
      const reporterIds = [...new Set(rows.map((r) => r.reporter_id).filter(Boolean) as string[])];
      const profileIds = [...new Set([...userIds, ...reporterIds])];

      const [postsRes, commentsRes, profilesRes] = await Promise.all([
        postIds.length
          ? supabase.from('posts').select('id, user_id, content, profiles(id, full_name)').in('id', postIds)
          : Promise.resolve({ data: [] as any[] }),
        commentIds.length
          ? supabase.from('post_comments').select('id, post_id, user_id, content, profiles(id, full_name)').in('id', commentIds)
          : Promise.resolve({ data: [] as any[] }),
        profileIds.length
          ? supabase.from('profiles').select('id, full_name, username').in('id', profileIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const nameById: Record<string, string> = {};
      for (const p of (profilesRes.data ?? []) as any[]) {
        nameById[p.id] = p.full_name ?? (p.username ? `@${p.username}` : t('profile.legacy_member_fallback'));
      }

      const postById = new Map<string, any>(((postsRes.data ?? []) as any[]).map((p) => [p.id, p]));
      const commentById = new Map<string, any>(((commentsRes.data ?? []) as any[]).map((c) => [c.id, c]));

      const next: Record<string, TargetPreview> = {};
      for (const r of rows) {
        if (r.target_type === 'post') {
          const p = postById.get(r.target_id);
          next[r.id] = p
            ? { missing: false, text: p.content, authorId: p.user_id, authorName: first(p.profiles)?.full_name ?? null, postId: p.id }
            : { missing: true, text: null, authorId: null, authorName: null, postId: null };
        } else if (r.target_type === 'comment') {
          const c = commentById.get(r.target_id);
          next[r.id] = c
            ? { missing: false, text: c.content, authorId: c.user_id, authorName: first(c.profiles)?.full_name ?? null, postId: c.post_id }
            : { missing: true, text: null, authorId: null, authorName: null, postId: null };
        } else {
          const name = nameById[r.target_id];
          next[r.id] = { missing: !name, text: null, authorId: r.target_id, authorName: name ?? null, postId: null };
        }
      }

      setReports(rows);
      setPreviews(next);
      setReporterNames(nameById);
      setError(false);
    } catch (e) {
      console.warn('[AdminReports] load failed:', e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAdmin) load();
    else setLoading(false);
  }, [isAdmin, load]);

  const setStatus = async (report: ReportRow, status: ReportStatus, wholeTarget: boolean) => {
    let query = supabase.from('content_reports').update({ status });
    query = wholeTarget
      ? query.eq('target_type', report.target_type).eq('target_id', report.target_id).eq('status', 'pending')
      : query.eq('id', report.id);
    const { data, error: updateError } = await query.select('id');
    if (updateError || !data || data.length === 0) throw new Error(updateError?.message ?? 'no rows updated');
    const changed = new Set((data as { id: string }[]).map((r) => r.id));
    setReports((prev) => prev.map((r) => (changed.has(r.id) ? { ...r, status } : r)));
  };

  // A PostgrestError is a plain object, not an Error, so read its fields directly.
  const describeError = (e: unknown): string => {
    const x = e as { message?: string; details?: string; hint?: string; code?: string } | null;
    const parts = [
      x?.code ? `[${x.code}]` : '',
      x?.message ?? (typeof e === 'string' ? e : ''),
      x?.details ?? '',
      x?.hint ?? '',
    ].filter(Boolean);
    return parts.join(' ').trim() || t('common.unknown_error');
  };

  const reportActionError = (e: unknown, headline = t('moderation.action_error')) => {
    console.warn('[AdminReports] action failed:', e);
    setActionError(`${headline}\n\n${describeError(e)}`);
  };

  const run = async (report: ReportRow, action: () => Promise<void>) => {
    setWorkingId(report.id);
    try {
      await action();
    } catch (e) {
      reportActionError(e);
    } finally {
      setWorkingId(null);
    }
  };

  const handleDismiss = (report: ReportRow) => run(report, () => setStatus(report, 'dismissed', false));
  const handleReviewed = (report: ReportRow) => run(report, () => setStatus(report, 'reviewed', true));

  const handleRemove = (report: ReportRow) =>
    run(report, async () => {
      const table = report.target_type === 'post' ? 'posts' : 'post_comments';

      // 1. Delete and ask for the row back. Any database error (RLS, trigger,
      //    FK) is thrown with its real message and nothing is recorded.
      const { data: deleted, error: delError } = await supabase
        .from(table)
        .delete()
        .eq('id', report.target_id)
        .select('id');
      if (delError) throw delError;

      // 2. Confirm. RETURNING proves the delete. If it came back empty, accept
      //    "already gone" only when a successful re-read shows the row is absent.
      if (!deleted || deleted.length === 0) {
        const { data: stillThere, error: readError } = await supabase
          .from(table)
          .select('id')
          .eq('id', report.target_id)
          .maybeSingle();
        if (readError) throw readError;
        if (stillThere) throw new Error(t('moderation.remove_not_deleted'));
      }

      setPreviews((prev) => {
        const next = { ...prev };
        for (const r of reports) {
          if (r.target_type === report.target_type && r.target_id === report.target_id && next[r.id]) {
            next[r.id] = { ...next[r.id], missing: true, text: null };
          }
        }
        return next;
      });

      // 3. Only now mark the reports removed; if that fails the content is
      //    already gone, so say exactly that.
      try {
        await setStatus(report, 'removed', true);
      } catch (e) {
        reportActionError(e, t('moderation.removed_status_error'));
      }
    });

  const chip = (label: string, color: string) => (
    <View style={{ borderRadius: 6, borderWidth: 1, borderColor: color, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</Text>
    </View>
  );

  const statusColor = (s: ReportStatus) =>
    s === 'pending' ? colors.gold : s === 'removed' ? colors.error : colors.textMuted;

  const renderItem = ({ item }: { item: ReportRow }) => {
    const preview = previews[item.id];
    const { reason, details } = decodeReason(item.reason);
    const reporterName = item.reporter_id ? (reporterNames[item.reporter_id] ?? t('profile.legacy_member_fallback')) : '—';
    const isPending = item.status === 'pending';
    const busy = workingId === item.id;
    const openTarget = () => {
      if (!preview || preview.missing) return;
      if (item.target_type === 'user' && preview.authorId) router.push(`/profile?id=${preview.authorId}` as any);
      else if (preview.postId) router.push(`/post?id=${preview.postId}` as any);
    };

    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          opacity: isPending ? 1 : 0.7,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {chip(t(`moderation.target_${item.target_type}`), colors.gold)}
          {chip(t(`moderation.status_${item.status}`), statusColor(item.status))}
          <View style={{ flex: 1 }} />
          <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.textMuted }}>
            {formatRelativeTime(item.created_at, locale)}
          </Text>
        </View>

        <Pressable
          onPress={openTarget}
          style={({ pressed }) => ({
            backgroundColor: colors.surfaceAlt,
            borderRadius: 8,
            padding: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          {preview?.missing ? (
            <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textMuted, fontStyle: 'italic' }}>
              {t('moderation.target_missing')}
            </Text>
          ) : (
            <>
              {preview?.authorName ? (
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: colors.textPrimary }}>{preview.authorName}</Text>
              ) : null}
              {preview?.text ? (
                <Text
                  numberOfLines={4}
                  style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginTop: preview.authorName ? 4 : 0 }}
                >
                  {preview.text}
                </Text>
              ) : null}
            </>
          )}
        </Pressable>

        <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textPrimary, marginTop: 12 }}>
          <Text style={{ fontFamily: Fonts.bodySemiBold, color: colors.gold }}>{t('moderation.reason_label')}: </Text>
          {reason ? t(`moderation.reason_${reason}`) : details}
          {reason && details ? ` — ${details}` : ''}
        </Text>
        <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
          {t('moderation.reported_by', { name: reporterName })}
        </Text>

        {isPending && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            {item.target_type === 'user' ? (
              <TouchableOpacity
                onPress={() => handleReviewed(item)}
                disabled={busy}
                activeOpacity={0.75}
                style={{ flex: 1, backgroundColor: colors.gold, borderRadius: 8, paddingVertical: 10, alignItems: 'center', opacity: busy ? 0.5 : 1 }}
              >
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: colors.background }}>{t('moderation.action_reviewed')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setPendingRemove(item)}
                disabled={busy || preview?.missing}
                activeOpacity={0.75}
                style={{ flex: 1, backgroundColor: colors.error, borderRadius: 8, paddingVertical: 10, alignItems: 'center', opacity: busy || preview?.missing ? 0.4 : 1 }}
              >
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: '#fff' }}>{t('moderation.action_remove')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleDismiss(item)}
              disabled={busy}
              activeOpacity={0.75}
              style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 10, alignItems: 'center', opacity: busy ? 0.5 : 1 }}
            >
              {busy ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: colors.textSecondary }}>{t('moderation.action_dismiss')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Pending first, then resolved, newest first within each group.
  const sorted = [...reports].sort((a, b) => {
    if ((a.status === 'pending') !== (b.status === 'pending')) return a.status === 'pending' ? -1 : 1;
    return b.created_at.localeCompare(a.created_at);
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SimModal visible={!!actionError} message={actionError ?? ''} onClose={() => setActionError(null)} />

      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Fonts.heading, fontSize: 22, color: colors.gold }}>{t('moderation.reports_title')}</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary, textAlign: 'center', marginBottom: 16 }}>
            {t('moderation.reports_load_error')}
          </Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              load();
            }}
            style={{ backgroundColor: colors.gold, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: colors.background }}>{t('events.retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList<ReportRow>
          data={sorted}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.gold}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="flag-outline" size={44} color={colors.gold} style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary }}>{t('moderation.reports_empty')}</Text>
            </View>
          }
        />
      )}

      <ActionSheet
        visible={!!pendingRemove}
        onClose={() => setPendingRemove(null)}
        title={`${t('moderation.remove_confirm_title')} ${t('moderation.remove_confirm_body')}`}
        actions={[
          {
            label: t('moderation.action_remove'),
            icon: 'trash-outline',
            destructive: true,
            onPress: () => pendingRemove && handleRemove(pendingRemove),
          },
        ]}
      />
    </View>
  );
}
