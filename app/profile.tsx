import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { getInitials } from '../lib/avatar';
import { fetchProfileWithTopics } from '../lib/profiles';
import { ProfileWithTopics } from '../types/database';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import LevelBadge from '../components/LevelBadge';

function formatCount(n: number): string {
  if (n >= 1000) {
    const formatted = (n / 1000).toFixed(1);
    return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'k' : formatted + 'k';
  }
  return n.toString();
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { profile: ownProfile, user, refreshProfile, loading: authLoading } = useAuth();

  const isOwnProfile = !id || id === user?.id;

  const { t } = useLanguage();

  // ── Other-user state ──────────────────────────────────────────────────────
  const [viewedProfile, setViewedProfile] = useState<ProfileWithTopics | null>(null);
  const [loadingViewed, setLoadingViewed] = useState(false);
  const [viewedError, setViewedError] = useState(false);

  const handleLoadViewed = useCallback(async () => {
    if (!id) return;
    setLoadingViewed(true);
    setViewedError(false);
    const { data, error } = await fetchProfileWithTopics(id);
    if (error || !data) {
      setViewedError(true);
    } else {
      setViewedProfile(data);
    }
    setLoadingViewed(false);
  }, [id]);

  useEffect(() => {
    if (isOwnProfile || !id) return;
    handleLoadViewed();
  }, [id, isOwnProfile, handleLoadViewed]);

  // ── Activity counts (Posts / Comments / Resources) ───────────────────────
  const targetUserId = isOwnProfile ? user?.id : id;

  const [postsCount, setPostsCount] = useState<number>(0);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [commentsCount, setCommentsCount] = useState<number>(0);
  const [loadingComments, setLoadingComments] = useState(true);

  const [resourcesCount, setResourcesCount] = useState<number>(0);
  const [loadingResources, setLoadingResources] = useState(true);

  useEffect(() => {
    setPostsCount(0);
    setCommentsCount(0);
    setResourcesCount(0);
    setLoadingPosts(true);
    setLoadingComments(true);
    setLoadingResources(true);

    if (!targetUserId) {
      setLoadingPosts(false);
      setLoadingComments(false);
      setLoadingResources(false);
      return;
    }

    (async () => {
      try {
        const { count } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', targetUserId);
        setPostsCount(count ?? 0);
      } catch (e) {
        console.warn('[Profile] posts count threw:', e);
        setPostsCount(0);
      } finally {
        setLoadingPosts(false);
      }
    })();

    (async () => {
      try {
        const { count } = await supabase
          .from('post_comments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', targetUserId);
        setCommentsCount(count ?? 0);
      } catch (e) {
        console.warn('[Profile] comments count threw:', e);
        setCommentsCount(0);
      } finally {
        setLoadingComments(false);
      }
    })();

    setResourcesCount(0);
    setLoadingResources(false);
  }, [targetUserId]);

  // ── Loading ───────────────────────────────────────────────────────────────
  const isLoading = isOwnProfile ? authLoading : loadingViewed;
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  // ── Error / null ──────────────────────────────────────────────────────────
  const activeProfile: ProfileWithTopics | null = isOwnProfile ? ownProfile : viewedProfile;
  const hasError = isOwnProfile ? !ownProfile : viewedError || !viewedProfile;
  const handleRetry = isOwnProfile ? refreshProfile : handleLoadViewed;

  if (!activeProfile || hasError) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.textPrimary, marginBottom: 16, textAlign: 'center' }}>
          {t('profile.could_not_load')}
        </Text>
        <Pressable
          onPress={handleRetry}
          style={{
            backgroundColor: Colors.gold,
            borderRadius: 8,
            paddingHorizontal: 24,
            paddingVertical: 10,
          }}
        >
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.background }}>{t('events.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  const initials = getInitials(activeProfile.full_name, activeProfile.username);

  // ── Name / role fallbacks differ by branch ────────────────────────────────
  const displayName = isOwnProfile
    ? (activeProfile.full_name ?? t('profile.complete_your_profile'))
    : (activeProfile.full_name ?? (activeProfile.username ? `@${activeProfile.username}` : t('profile.legacy_member_fallback')));

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Top bar */}
        <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{ alignSelf: 'flex-start' }}
          >
            <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
          </Pressable>
        </View>

        {/* Hero zone */}
        <View
          style={{
            backgroundColor: Colors.surfaceAlt,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            alignItems: 'center',
            paddingTop: 8,
            paddingBottom: 32,
            paddingHorizontal: 20,
            overflow: 'hidden',
          }}
        >
          {/* Cover photo background — purely additive, shown only when cover_url is set */}
          {activeProfile.cover_url ? (
            <Image
              source={{ uri: activeProfile.cover_url }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 140,
              }}
              resizeMode="cover"
            />
          ) : null}

          {/* Avatar */}
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: Colors.surface,
              borderWidth: 2,
              borderColor: Colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {activeProfile.avatar_url ? (
              <Image source={{ uri: activeProfile.avatar_url }} style={{ width: 88, height: 88 }} />
            ) : (
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 30, color: Colors.textPrimary }}>
                {initials}
              </Text>
            )}
          </View>

          {/* Name */}
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 22,
              color: Colors.textPrimary,
              marginTop: 12,
              textAlign: 'center',
            }}
          >
            {displayName}
          </Text>

          {/* Username */}
          {activeProfile.username ? (
            <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: Colors.textMuted, marginTop: 2 }}>
              @{activeProfile.username}
            </Text>
          ) : null}

          {/* Role */}
          {activeProfile.role ? (
            <Text style={{ fontFamily: Fonts.body, fontSize: 14, marginTop: 4, color: Colors.textMuted }}>
              {activeProfile.role}
            </Text>
          ) : isOwnProfile ? (
            <Text style={{ fontFamily: Fonts.body, fontSize: 14, marginTop: 4, color: Colors.textFaint }}>
              {t('profile.add_your_role')}
            </Text>
          ) : null}

          {/* Location */}
          {activeProfile.location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="location-outline" size={13} color={Colors.gold} />
              <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted }}>
                {activeProfile.location}
              </Text>
            </View>
          ) : null}

          {/* Level badge */}
          <View style={{ marginTop: 8 }}>
            <LevelBadge points={activeProfile.points} />
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 2, gap: 40 }}>
            {[
              { id: 'posts', value: loadingPosts ? '—' : formatCount(postsCount), label: t('profile.stat_posts') },
              { id: 'comments', value: loadingComments ? '—' : formatCount(commentsCount), label: t('profile.stat_comments') },
              { id: 'resources', value: loadingResources ? '—' : formatCount(resourcesCount), label: t('profile.stat_resources') },
            ].map((stat) => (
              <View key={stat.id} style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 20, color: Colors.gold }}>
                  {stat.value}
                </Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Account actions — own profile only. Other-user profiles show no action row. */}
        {isOwnProfile ? (
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, gap: 10 }}>
            {(
              [
                { icon: 'create-outline', id: 'edit', route: '/edit-profile' },
                { icon: 'bookmark-outline', id: 'saved', route: '/saved' },
                { icon: 'settings-outline', id: 'settings', route: '/settings' },
              ] as const
            ).map(({ icon, id, route }) => (
              <TouchableOpacity
                key={id}
                onPress={() => router.push(route as any)}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  backgroundColor: Colors.surface,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: Colors.borderStrong,
                  alignItems: 'center',
                  paddingVertical: 12,
                }}
              >
                <Ionicons name={icon} size={20} color={Colors.gold} />
                <Text
                  style={{
                    fontFamily: Fonts.body,
                    fontSize: 11,
                    color: Colors.textSecondary,
                    marginTop: 5,
                  }}
                >
                  {t(`profile.action_${id}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* About section */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 18, color: Colors.gold }}>{t('profile.about_section')}</Text>
          <View
            style={{
              marginTop: 10,
              backgroundColor: Colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: Colors.border,
              padding: 16,
            }}
          >
            {activeProfile.bio ? (
              <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: Colors.textPrimary, lineHeight: 22 }}>
                {activeProfile.bio}
              </Text>
            ) : (
              <View>
                <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: Colors.textFaint, lineHeight: 22 }}>
                  {t('profile.bio_empty')}
                </Text>
                {/* "Add bio" link only appears on own profile */}
                {isOwnProfile && (
                  <Pressable onPress={() => router.push('/edit-profile' as any)}>
                    <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.gold, marginTop: 8 }}>
                      {t('profile.add_bio')}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Topics */}
            {activeProfile.topics && activeProfile.topics.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 8 }}>
                {activeProfile.topics.map((topic) => (
                  <View
                    key={topic.id}
                    style={{
                      backgroundColor: Colors.surfaceAlt,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: Colors.gold }}>
                      #{topic.name.replace(/\s+/g, '')}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
