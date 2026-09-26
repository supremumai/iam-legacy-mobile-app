import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { supabase } from '../lib/supabase';
import { getInitials } from '../lib/avatar';
import { MemberListItem } from '../types/database';
import { Fonts } from '../constants/fonts';
import { useColors } from '../contexts/ThemeContext';

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const { t } = useLanguage();
  const colors = useColors();

  const [members, setMembers] = useState<MemberListItem[]>([]);
  // Separate map for optimistic admin-status updates, keyed by profile id.
  const [adminMap, setAdminMap] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, username, role, location, avatar_url, is_admin')
        .order('created_at', { ascending: true })
        .limit(200);

      if (fetchError) {
        console.warn('[Members] fetch error:', fetchError.message);
        setError(true);
        return;
      }

      const normalized: MemberListItem[] = (data ?? []).map((row: any) => ({
        id: row.id,
        full_name: row.full_name ?? null,
        username: row.username ?? null,
        role: row.role ?? null,
        location: row.location ?? null,
        avatar_url: row.avatar_url ?? null,
        is_admin: row.is_admin ?? false,
      }));

      setMembers(normalized);

      // Seed the optimistic map from the freshly fetched data.
      const map = new Map<string, boolean>();
      normalized.forEach((m) => map.set(m.id, m.is_admin));
      setAdminMap(map);
    } catch (e) {
      console.warn('[Members] fetch threw:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // ── Admin toggle ─────────────────────────────────────────────────────────────

  /**
   * Applies the actual DB update with optimistic state and rollback.
   * Called after any required confirmation dialog has been acknowledged.
   */
  const performToggle = async (member: MemberListItem, newValue: boolean) => {
    const prevValue = adminMap.get(member.id) ?? member.is_admin;

    // Optimistic update
    setAdminMap((prev) => new Map(prev).set(member.id, newValue));

    try {
      const { data: updatedRows, error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: newValue } as any)
        .eq('id', member.id)
        .select('id');

      if (updateError) throw updateError;

      // RLS can silently return 0 rows (no error) when the policy WHERE filters
      // out the target row — treat that as a permission failure, not success.
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error('Only admins can change admin status');
      }
    } catch (e: unknown) {
      // Rollback
      setAdminMap((prev) => new Map(prev).set(member.id, prevValue));

      const msg = e instanceof Error ? e.message : String(e);
      let alertMsg = t('members.error_generic');
      if (msg.includes('Cannot remove the last remaining admin')) {
        alertMsg = t('members.error_last_admin');
      } else if (msg.includes('Only admins can change admin status')) {
        alertMsg = t('members.error_no_permission');
      }
      Alert.alert(t('members.error_title'), alertMsg);
    }
  };

  /**
   * Entry point for the Switch's onValueChange.
   * Demotion (admin → member) requires confirmation; promotion is immediate.
   */
  const handleToggleAdmin = (member: MemberListItem, newValue: boolean) => {
    if (!newValue) {
      // admin → member: confirm first
      const name = member.full_name ?? t('members.this_member_fallback');
      Alert.alert(
        t('members.remove_admin_title'),
        t('members.remove_admin_confirm', { name }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('members.remove'),
            style: 'destructive',
            onPress: () => {
              performToggle(member, newValue);
            },
          },
        ],
      );
    } else {
      // member → admin: no confirmation needed
      performToggle(member, newValue);
    }
  };

  // ── Client-side search ───────────────────────────────────────────────────────
  const filtered = searchText.trim()
    ? members.filter((m) => {
        const q = searchText.toLowerCase();
        return m.full_name?.toLowerCase().includes(q) ?? false;
      })
    : members;

  const subtitleText = loading
    ? t('members.loading')
    : members.length === 1
    ? t('members.one_person')
    : t('members.count_people', { count: members.length });

  // ── Error state ──────────────────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={8}
            activeOpacity={0.6}
            style={{ alignSelf: 'flex-start' }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 16,
              color: colors.textPrimary,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {t('members.could_not_load')}
          </Text>
          <TouchableOpacity
            onPress={fetchMembers}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.gold,
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: colors.background }}>
              {t('events.retry')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Back button */}
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          activeOpacity={0.6}
          style={{ alignSelf: 'flex-start' }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
        <Text style={{ fontFamily: Fonts.heading, fontSize: 24, color: colors.gold }}>
          {t('members.title')}
        </Text>
        <Text
          style={{
            fontFamily: Fonts.body,
            fontSize: 14,
            color: colors.textMuted,
            marginTop: 4,
          }}
        >
          {subtitleText}
        </Text>
      </View>

      {/* Search input */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 16,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Ionicons name="search-outline" size={18} color={colors.gold} />
        <TextInput
          style={{
            flex: 1,
            marginLeft: 12,
            fontFamily: Fonts.body,
            fontSize: 15,
            color: colors.textPrimary,
          }}
          placeholder={t('members.search_placeholder')}
          placeholderTextColor={colors.textTertiary}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Member list */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      ) : (
        <FlatList<MemberListItem>
          data={filtered}
          keyExtractor={(item) => item.id}
          style={{ marginTop: 16 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              {members.length === 0 ? (
                <Text
                  style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary }}
                >
                  {t('members.no_members_yet')}
                </Text>
              ) : (
                <>
                  <Text
                    style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary }}
                  >
                    {t('members.no_members_found')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: Fonts.body,
                      fontSize: 13,
                      color: colors.textMuted,
                      marginTop: 4,
                    }}
                  >
                    {t('members.try_different_search')}
                  </Text>
                </>
              )}
            </View>
          }
          renderItem={({ item: member }) => {
            const initials = getInitials(member.full_name);
            const displayName = member.full_name ?? t('profile.legacy_member_fallback');
            const secondLine = [member.role, member.location].filter(Boolean).join(' · ');

            // Toggle visible only to admin viewers on rows that aren't their own.
            const isSelf = member.id === user?.id;
            const showToggle = isAdmin && !isSelf;
            const toggleValue = adminMap.get(member.id) ?? member.is_admin;

            return (
              // SAFE pattern: static style on Pressable, pressed-opacity via children render-prop.
              <Pressable
                onPress={() => router.push(`/profile?id=${member.id}` as any)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderSubtle,
                }}
              >
                {({ pressed }) => (
                  <>
                    {/* Avatar */}
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                        opacity: pressed ? 0.7 : 1,
                      }}
                    >
                      {member.avatar_url ? (
                        <Image
                          source={{ uri: member.avatar_url }}
                          style={{ width: 44, height: 44 }}
                        />
                      ) : (
                        <Text
                          style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: colors.textPrimary }}
                        >
                          {initials}
                        </Text>
                      )}
                    </View>

                    {/* Name + subtitle */}
                    <View style={{ flex: 1, marginLeft: 12, opacity: pressed ? 0.7 : 1 }}>
                      <Text
                        style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary }}
                      >
                        {displayName}
                      </Text>
                      {secondLine ? (
                        <Text
                          style={{
                            fontFamily: Fonts.body,
                            fontSize: 13,
                            color: colors.textMuted,
                            marginTop: 2,
                          }}
                          numberOfLines={1}
                        >
                          {secondLine}
                        </Text>
                      ) : null}
                    </View>

                    {/* Right slot: admin Switch (other rows) or nav chevron */}
                    {showToggle ? (
                      <Switch
                        value={toggleValue}
                        onValueChange={(newValue) => handleToggleAdmin(member, newValue)}
                        trackColor={{
                          false: colors.whiteOverlay10,
                          true: colors.borderStrong,
                        }}
                        thumbColor={toggleValue ? colors.gold : colors.textSecondary}
                        ios_backgroundColor={colors.whiteOverlay10}
                        style={{ marginLeft: 8 }}
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward-outline"
                        size={18}
                        color={pressed ? colors.textFaint : colors.textMuted}
                      />
                    )}
                  </>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
