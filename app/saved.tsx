import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { toggleSave } from '../lib/saves';
import { HomeEventCard, HomePostCard, HomeResourceCard } from '../lib/home';
import { formatMonthDayLabel } from '../lib/dateFormat';
import { findFirstYouTubeVideoId, youTubeThumbnailUrl, youTubeWatchUrl } from '../lib/youtube';
import { Fonts } from '../constants/fonts';

// ─── Display-name helper (mirrors private fn in lib/home.ts) ─────────────────

function resolveDisplayName(profilesRaw: unknown, legacyFallback: string): string {
  const p: Record<string, unknown> | null = Array.isArray(profilesRaw)
    ? ((profilesRaw[0] as Record<string, unknown>) ?? null)
    : ((profilesRaw as Record<string, unknown>) ?? null);
  if (!p) return legacyFallback;
  if (p.full_name) return String(p.full_name);
  if (p.username) return `@${String(p.username)}`;
  return legacyFallback;
}

// ─── Carousel layout helpers ──────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: Fonts.heading,
        fontSize: 18,
        color: '#c9a84c',
        paddingHorizontal: 20,
        marginTop: 28,
        marginBottom: 12,
      }}
    >
      {children}
    </Text>
  );
}

function CardSeparator() {
  return <View style={{ width: 12 }} />;
}

// ─── Card sub-components (200px, same chrome as Home carousels) ───────────────
// Each card splits into:
//   • Upper Pressable  — navigates on tap
//   • Lower bar        — bookmark icon (+ registration badge for events)
//     These two are siblings inside a View so tapping the lower bar
//     never triggers navigation.

function SavedEventCard({
  item,
  onUnsave,
  onPress,
}: {
  item: HomeEventCard;
  onUnsave: () => void;
  onPress: () => void;
}) {
  const { t, locale } = useLanguage();
  const dateLabel = item.event_date
    ? formatMonthDayLabel(new Date(item.event_date), locale)
    : null;
  const locationLine = item.is_online ? t('home.online') : item.location ?? null;

  return (
    <View
      style={{
        width: 200,
        borderRadius: 12,
        backgroundColor: '#1c1a14',
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.22)',
        overflow: 'hidden',
      }}
    >
      {/* Tappable area — navigates to Events tab */}
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <View style={{ opacity: pressed ? 0.8 : 1 }}>
            {/* Media */}
            <View style={{ width: '100%', height: 110 }}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={{ width: '100%', height: 110 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: '100%',
                    height: 110,
                    backgroundColor: 'rgba(245,158,11,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="calendar-outline" size={28} color="#F59E0B" />
                </View>
              )}
            </View>

            {/* Body */}
            <View style={{ padding: 12 }}>
              {dateLabel ? (
                <Text
                  style={{
                    fontFamily: Fonts.bodyBold,
                    fontSize: 11,
                    color: '#F59E0B',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                  }}
                >
                  {dateLabel}
                </Text>
              ) : null}
              <Text
                style={{
                  fontFamily: Fonts.bodySemiBold,
                  fontSize: 14,
                  color: '#FFFFFF',
                  marginTop: 4,
                }}
                numberOfLines={2}
              >
                {item.title ?? t('home.untitled_event')}
              </Text>
              {locationLine ? (
                <Text
                  style={{
                    fontFamily: Fonts.body,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.45)',
                    marginTop: 3,
                  }}
                  numberOfLines={1}
                >
                  {locationLine}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </Pressable>

      {/* Lower bar: bookmark only (right-aligned) */}
      <View style={{ alignItems: 'flex-end', paddingHorizontal: 12, paddingBottom: 10 }}>
        <TouchableOpacity onPress={onUnsave} activeOpacity={0.7} hitSlop={8}>
          <Ionicons name="bookmark" size={16} color="#c9a84c" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SavedPostCard({
  item,
  onUnsave,
  onPress,
}: {
  item: HomePostCard;
  onUnsave: () => void;
  onPress: () => void;
}) {
  const { t } = useLanguage();
  const videoId = item.image_url ? null : findFirstYouTubeVideoId(item.content);
  const thumbUri = item.image_url
    ? item.image_url
    : videoId
    ? youTubeThumbnailUrl(videoId)
    : null;

  return (
    <View
      style={{
        width: 200,
        borderRadius: 12,
        backgroundColor: '#1c1a14',
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.22)',
        overflow: 'hidden',
      }}
    >
      {/* Tappable area — navigates to post detail */}
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <View style={{ opacity: pressed ? 0.8 : 1 }}>
            {/* Media */}
            <View style={{ width: '100%', height: 110 }}>
              {thumbUri ? (
                <Image
                  source={{ uri: thumbUri }}
                  style={{ width: '100%', height: 110 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: '100%',
                    height: 110,
                    backgroundColor: 'rgba(16,185,129,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={28} color="#10B981" />
                </View>
              )}
            </View>

            {/* Body */}
            <View style={{ padding: 12 }}>
              <Text
                style={{
                  fontFamily: Fonts.bodyBold,
                  fontSize: 10,
                  color: '#10B981',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                {t('home.community_badge')}
              </Text>
              <Text
                style={{
                  fontFamily: Fonts.bodySemiBold,
                  fontSize: 13,
                  color: '#FFFFFF',
                  marginTop: 3,
                }}
                numberOfLines={1}
              >
                {item.authorName}
              </Text>
              <Text
                style={{
                  fontFamily: Fonts.body,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.45)',
                  marginTop: 3,
                }}
                numberOfLines={2}
              >
                {item.content}
              </Text>
            </View>
          </View>
        )}
      </Pressable>

      {/* Lower bar: bookmark only (right-aligned) */}
      <View style={{ alignItems: 'flex-end', paddingHorizontal: 12, paddingBottom: 10 }}>
        <TouchableOpacity onPress={onUnsave} activeOpacity={0.7} hitSlop={8}>
          <Ionicons name="bookmark" size={16} color="#c9a84c" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SavedResourceCard({
  item,
  onUnsave,
  onPress,
}: {
  item: HomeResourceCard;
  onUnsave: () => void;
  onPress: () => void;
}) {
  const { t } = useLanguage();
  const thumbUri = item.thumbnail_url ?? youTubeThumbnailUrl(item.youtube_video_id);

  return (
    <View
      style={{
        width: 200,
        borderRadius: 12,
        backgroundColor: '#1c1a14',
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.22)',
        overflow: 'hidden',
      }}
    >
      {/* Tappable area — opens YouTube */}
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <View style={{ opacity: pressed ? 0.8 : 1 }}>
            {/* Media with play overlay */}
            <View style={{ width: '100%', height: 110 }}>
              <Image
                source={{ uri: thumbUri }}
                style={{ width: '100%', height: 110 }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: 'rgba(0,0,0,0.52)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="play" size={16} color="#FFFFFF" />
                </View>
              </View>
            </View>

            {/* Body */}
            <View style={{ padding: 12 }}>
              <Text
                style={{
                  fontFamily: Fonts.bodyBold,
                  fontSize: 10,
                  color: '#6366F1',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                {t('home.education_badge')}
              </Text>
              <Text
                style={{
                  fontFamily: Fonts.bodySemiBold,
                  fontSize: 13,
                  color: '#FFFFFF',
                  marginTop: 3,
                }}
                numberOfLines={2}
              >
                {item.title}
              </Text>
            </View>
          </View>
        )}
      </Pressable>

      {/* Lower bar: bookmark only (right-aligned) */}
      <View style={{ alignItems: 'flex-end', paddingHorizontal: 12, paddingBottom: 10 }}>
        <TouchableOpacity onPress={onUnsave} activeOpacity={0.7} hitSlop={8}>
          <Ionicons name="bookmark" size={16} color="#c9a84c" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const { t } = useLanguage();

  const [events, setEvents] = useState<HomeEventCard[]>([]);
  const [posts, setPosts] = useState<HomePostCard[]>([]);
  const [resources, setResources] = useState<HomeResourceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch all saved items (bulk, no N+1) ──────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      // Step 1: all save rows for this user
      const { data: saveRows, error: saveError } = await supabase
        .from('saves')
        .select('saveable_type, saveable_id')
        .eq('user_id', user.id);

      if (saveError) throw saveError;

      const rows = (saveRows ?? []) as Array<{ saveable_type: string; saveable_id: string }>;
      const eventIds = rows
        .filter((r) => r.saveable_type === 'event')
        .map((r) => r.saveable_id);
      const postIds = rows
        .filter((r) => r.saveable_type === 'post')
        .map((r) => r.saveable_id);
      const resourceIds = rows
        .filter((r) => r.saveable_type === 'resource')
        .map((r) => r.saveable_id);

      // Sentinel for empty groups — avoids unnecessary queries
      const noData = { data: [] as any[], error: null };

      // Step 2: bulk fetch objects, all in parallel
      const [eventsResult, postsResult, resourcesResult] = await Promise.all([
        eventIds.length > 0
          ? supabase
              .from('events')
              .select('id, title, location, event_date, is_online, image_url')
              .in('id', eventIds)
          : Promise.resolve(noData),
        postIds.length > 0
          ? supabase
              .from('posts')
              .select('id, content, image_url, created_at, profiles(full_name, username)')
              .in('id', postIds)
          : Promise.resolve(noData),
        Promise.resolve(noData),
      ]);

      setEvents((eventsResult.data ?? []) as HomeEventCard[]);
      setPosts(
        (postsResult.data ?? []).map((row: any) => ({
          id: row.id,
          content: row.content ?? '',
          image_url: row.image_url ?? null,
          created_at: row.created_at,
          authorName: resolveDisplayName(row.profiles, t('profile.legacy_member_fallback')),
        })),
      );
      setResources((resourcesResult.data ?? []) as HomeResourceCard[]);
    } catch (e) {
      console.warn('[Saved] fetchData threw:', e);
      // Partial display is better than wiping state on error; leave existing lists
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ── Unsave handlers: optimistic remove + rollback on error ────────────────

  const handleUnsaveEvent = async (event: HomeEventCard) => {
    if (!user?.id) return;
    setEvents((prev) => prev.filter((e) => e.id !== event.id));
    try {
      await toggleSave('event', event.id, user.id, true);
    } catch (e: unknown) {
      setEvents((prev) => [...prev, event]);
      Alert.alert(t('saved.could_not_remove'), e instanceof Error ? e.message : t('common.unknown_error'));
    }
  };

  const handleUnsavePost = async (post: HomePostCard) => {
    if (!user?.id) return;
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    try {
      await toggleSave('post', post.id, user.id, true);
    } catch (e: unknown) {
      setPosts((prev) => [...prev, post]);
      Alert.alert(t('saved.could_not_remove'), e instanceof Error ? e.message : t('common.unknown_error'));
    }
  };

  const handleUnsaveResource = async (resource: HomeResourceCard) => {
    if (!user?.id) return;
    setResources((prev) => prev.filter((r) => r.id !== resource.id));
    try {
      await toggleSave('resource', resource.id, user.id, true);
    } catch (e: unknown) {
      setResources((prev) => [...prev, resource]);
      Alert.alert(t('saved.could_not_remove'), e instanceof Error ? e.message : t('common.unknown_error'));
    }
  };

  const hasAnySaved = events.length > 0 || posts.length > 0 || resources.length > 0;

  // ── Shared header bar ─────────────────────────────────────────────────────
  const headerBar = (
    <View
      style={{
        paddingTop: insets.top + 4,
        paddingHorizontal: 20,
        paddingBottom: 6,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Pressable onPress={() => router.back()} hitSlop={8} style={{ padding: 4 }}>
        {({ pressed }) => (
          <View style={{ opacity: pressed ? 0.6 : 1 }}>
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </View>
        )}
      </Pressable>
      <Text
        style={{
          fontFamily: Fonts.heading,
          fontSize: 20,
          color: '#c9a84c',
          marginLeft: 6,
        }}
      >
        {t('saved.title')}
      </Text>
    </View>
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
        {headerBar}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#c9a84c" size="large" />
        </View>
      </View>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!hasAnySaved) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
        {headerBar}
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Ionicons name="bookmark-outline" size={52} color="rgba(201,168,76,0.35)" />
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 17,
              color: '#FFFFFF',
              marginTop: 18,
              textAlign: 'center',
            }}
          >
            {t('saved.empty_title')}
          </Text>
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 14,
              color: 'rgba(255,255,255,0.55)',
              marginTop: 8,
              textAlign: 'center',
              lineHeight: 21,
            }}
          >
            {t('saved.empty_body')}
          </Text>
        </View>
      </View>
    );
  }

  // ── Main: 3 conditional carousels ─────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
      {headerBar}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#c9a84c"
            colors={['#c9a84c']}
          />
        }
      >
        {/* SECTION 1 — Events (hidden when empty) */}
        {events.length > 0 ? (
          <>
            <SectionTitle>{t('saved.section_events')}</SectionTitle>
            <FlatList<HomeEventCard>
              horizontal
              data={events}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              ItemSeparatorComponent={CardSeparator}
              renderItem={({ item }) => (
                <SavedEventCard
                  item={item}
                  onUnsave={() => handleUnsaveEvent(item)}
                  onPress={() => router.push('/events' as any)}
                />
              )}
            />
          </>
        ) : null}

        {/* SECTION 2 — From the Community (hidden when empty) */}
        {posts.length > 0 ? (
          <>
            <SectionTitle>{t('home.from_the_community')}</SectionTitle>
            <FlatList<HomePostCard>
              horizontal
              data={posts}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              ItemSeparatorComponent={CardSeparator}
              renderItem={({ item }) => (
                <SavedPostCard
                  item={item}
                  onUnsave={() => handleUnsavePost(item)}
                  onPress={() => router.push(`/post?id=${item.id}` as any)}
                />
              )}
            />
          </>
        ) : null}

        {/* SECTION 3 — Education (hidden when empty) */}
        {resources.length > 0 ? (
          <>
            <SectionTitle>{t('saved.section_education')}</SectionTitle>
            <FlatList<HomeResourceCard>
              horizontal
              data={resources}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              ItemSeparatorComponent={CardSeparator}
              renderItem={({ item }) => (
                <SavedResourceCard
                  item={item}
                  onUnsave={() => handleUnsaveResource(item)}
                  onPress={() => {
                    Linking.openURL(youTubeWatchUrl(item.youtube_video_id)).catch(() => {
                      Alert.alert(t('saved.could_not_open_video'));
                    });
                  }}
                />
              )}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
