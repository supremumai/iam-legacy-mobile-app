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
import { useIsAdmin } from '../hooks/useIsAdmin';
import { supabase } from '../lib/supabase';
import { getInitials } from '../lib/avatar';
import { MemberListItem } from '../types/database';
import { Fonts } from '../constants/fonts';

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();

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
      let alertMsg = 'Could not update admin status.';
      if (msg.includes('Cannot remove the last remaining admin')) {
        alertMsg = 'This is the only admin. Promote someone else first.';
      } else if (msg.includes('Only admins can change admin status')) {
        alertMsg = "You don't have permission to do this.";
      }
      Alert.alert('Error', alertMsg);
    }
  };

  /**
   * Entry point for the Switch's onValueChange.
   * Demotion (admin → member) requires confirmation; promotion is immediate.
   */
  const handleToggleAdmin = (member: MemberListItem, newValue: boolean) => {
    if (!newValue) {
      // admin → member: confirm first
      const name = member.full_name ?? member.username ?? 'this member';
      Alert.alert(
        'Remove Admin Access',
        `Remove admin access from ${name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
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
        return (
          (m.full_name?.toLowerCase().includes(q) ?? false) ||
          (m.username?.toLowerCase().includes(q) ?? false)
        );
      })
    : members;

  const subtitleText = loading
    ? 'Loading...'
    : `${members.length} ${members.length === 1 ? 'person' : 'people'} in the community`;

  // ── Error state ──────────────────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
        <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={8}
            activeOpacity={0.6}
            style={{ alignSelf: 'flex-start' }}
          >
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
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
              color: '#FFFFFF',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            Could not load members
          </Text>
          <TouchableOpacity
            onPress={fetchMembers}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#c9a84c',
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: '#0a0900' }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
      {/* Back button */}
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          activeOpacity={0.6}
          style={{ alignSelf: 'flex-start' }}
        >
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
        <Text style={{ fontFamily: Fonts.heading, fontSize: 24, color: '#c9a84c' }}>
          Members
        </Text>
        <Text
          style={{
            fontFamily: Fonts.body,
            fontSize: 14,
            color: 'rgba(255,255,255,0.55)',
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
          backgroundColor: '#1c1a14',
          borderWidth: 1,
          borderColor: 'rgba(201,168,76,0.22)',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Ionicons name="search-outline" size={18} color="#c9a84c" />
        <TextInput
          style={{
            flex: 1,
            marginLeft: 12,
            fontFamily: Fonts.body,
            fontSize: 15,
            color: '#FFFFFF',
          }}
          placeholder="Search members..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
          </Pressable>
        )}
      </View>

      {/* Member list */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#c9a84c" size="large" />
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
                  style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#FFFFFF' }}
                >
                  No members yet
                </Text>
              ) : (
                <>
                  <Text
                    style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#FFFFFF' }}
                  >
                    No members found
                  </Text>
                  <Text
                    style={{
                      fontFamily: Fonts.body,
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.55)',
                      marginTop: 4,
                    }}
                  >
                    Try a different search.
                  </Text>
                </>
              )}
            </View>
          }
          renderItem={({ item: member }) => {
            const initials = getInitials(member.full_name, member.username);
            const displayName =
              member.full_name ??
              (member.username ? `@${member.username}` : 'Legacy Member');
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
                  borderBottomColor: 'rgba(201,168,76,0.08)',
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
                        backgroundColor: '#1c1a14',
                        borderWidth: 1,
                        borderColor: 'rgba(201,168,76,0.22)',
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
                          style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: '#FFFFFF' }}
                        >
                          {initials}
                        </Text>
                      )}
                    </View>

                    {/* Name + subtitle */}
                    <View style={{ flex: 1, marginLeft: 12, opacity: pressed ? 0.7 : 1 }}>
                      <Text
                        style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#FFFFFF' }}
                      >
                        {displayName}
                      </Text>
                      {secondLine ? (
                        <Text
                          style={{
                            fontFamily: Fonts.body,
                            fontSize: 13,
                            color: 'rgba(255,255,255,0.55)',
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
                          false: 'rgba(255,255,255,0.1)',
                          true: 'rgba(201,168,76,0.5)',
                        }}
                        thumbColor={toggleValue ? '#c9a84c' : 'rgba(255,255,255,0.6)'}
                        ios_backgroundColor="rgba(255,255,255,0.1)"
                        style={{ marginLeft: 8 }}
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward-outline"
                        size={18}
                        color={pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.55)'}
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
