import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBlocks } from '../contexts/BlocksContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useColors } from '../contexts/ThemeContext';
import { Fonts } from '../constants/fonts';
import { supabase } from '../lib/supabase';
import { getInitials } from '../lib/avatar';

interface BlockedProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export default function BlockedUsersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const { t } = useLanguage();
  const { blockedIds, blockedKey, loaded, unblock } = useBlocks();

  const [profiles, setProfiles] = useState<BlockedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) return;
    if (blockedIds.size === 0) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', [...blockedIds]);
      if (cancelled) return;
      if (fetchError) setError(true);
      else {
        setError(false);
        setProfiles((data ?? []) as BlockedProfile[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loaded, blockedKey]);

  // Rows vanish the moment the context drops the id, before any refetch.
  const rows = profiles.filter((p) => blockedIds.has(p.id));

  const handleUnblock = async (id: string) => {
    setWorkingId(id);
    const ok = await unblock(id);
    setWorkingId(null);
    if (!ok) Alert.alert(t('common.error_title'), t('moderation.unblock_error'));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
        <Text style={{ fontFamily: Fonts.heading, fontSize: 22, color: colors.gold }}>
          {t('moderation.blocked_users')}
        </Text>
      </View>

      {loading || !loaded ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary, textAlign: 'center' }}>
            {t('moderation.blocked_load_error')}
          </Text>
        </View>
      ) : (
        <FlatList<BlockedProfile>
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 }}>
              <Ionicons name="ban-outline" size={44} color={colors.gold} style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary }}>
                {t('moderation.blocked_empty')}
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' }}>
                {t('moderation.blocked_empty_sub')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={{ width: 40, height: 40 }} />
                ) : (
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: colors.textPrimary }}>
                    {getInitials(item.full_name)}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary }} numberOfLines={1}>
                  {item.full_name ?? t('profile.legacy_member_fallback')}
                </Text>
                {item.username ? (
                  <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 1 }} numberOfLines={1}>
                    @{item.username}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => handleUnblock(item.id)}
                disabled={workingId === item.id}
                activeOpacity={0.75}
                style={{
                  borderWidth: 1.5,
                  borderColor: colors.gold,
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  opacity: workingId === item.id ? 0.5 : 1,
                }}
              >
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: colors.gold }}>
                  {t('moderation.unblock_user')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
