import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  HomeEventCard,
  HomePostCard,
  fetchUpcomingEvents,
  fetchRecentPosts,
} from '../../../lib/home';
import { EduCourse, fetchHomeCourses } from '../../../lib/education';
import { formatMonthDayLabel } from '../../../lib/dateFormat';
import { formatRelativeTime } from '../../../lib/time';
import { findFirstYouTubeVideoId, youTubeThumbnailUrl } from '../../../lib/youtube';
import { fetchSavedIds, toggleSave } from '../../../lib/saves';
import { getInitials } from '../../../lib/avatar';
import { supabase } from '../../../lib/supabase';
import { Fonts } from '../../../constants/fonts';
import { useColors } from '../../../contexts/ThemeContext';
import GlobalHeader from '../../../components/GlobalHeader';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';

// ─── Card sub-components ───────────────────────────────────────────────────────
// All Pressables use the SAFE static-style pattern:
//   layout/appearance props → static plain-object `style={{...}}`
//   pressed-opacity         → inner <View style={{ opacity: ... }}> via children render-prop

function EventCard({ item, onPress }: { item: HomeEventCard; onPress: () => void }) {
  const { t, locale } = useLanguage();
  const colors = useColors();
  const dateLabel = item.event_date
    ? formatMonthDayLabel(new Date(item.event_date), locale)
    : null;
  const locationLine = item.is_online ? t('home.online') : item.location ?? null;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 200,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.8 : 1 }}>
          {/* Media area */}
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
                  backgroundColor: colors.warningBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="calendar-outline" size={28} color={colors.warning} />
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
                  color: colors.warning,
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
                color: colors.textPrimary,
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
                  color: colors.textTertiary,
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
  );
}

interface CommunityPostCardProps {
  item: HomePostCard;
  isLiked: boolean;
  isSaved: boolean;
  onPress: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
}

function CommunityPostCard({ item, isLiked, isSaved, onPress, onToggleLike, onToggleSave }: CommunityPostCardProps) {
  const { t, locale } = useLanguage();
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const videoId = item.image_url ? null : findFirstYouTubeVideoId(item.content);
  const thumbUri = item.image_url
    ? item.image_url
    : videoId
    ? youTubeThumbnailUrl(videoId)
    : null;

  const isImage = item.post_type === 'image' && !!item.image_url;
  const isVideo = item.post_type === 'video';
  const isPoll = item.post_type === 'poll';
  const initials = getInitials(item.authorName !== 'Legacy Member' ? item.authorName : null);
  const relativeDate = formatRelativeTime(item.created_at, locale);

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 300,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.8 : 1 }}>
          {/* Media area — images and videos */}
          {(isImage || isVideo) && (
            <View style={{ width: '100%', height: 120 }}>
              {thumbUri ? (
                <Image
                  source={{ uri: thumbUri }}
                  style={{ width: '100%', height: 120 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: '100%',
                    height: 120,
                    backgroundColor: colors.borderSubtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                </View>
              )}
              {isVideo && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.gold,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="play" size={16} color="#0a0900" style={{ marginLeft: 2 }} />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Body */}
          <View style={{ padding: 12 }}>
            {/* Author row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {item.authorAvatar ? (
                  <Image source={{ uri: item.authorAvatar }} style={{ width: 32, height: 32 }} />
                ) : (
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: colors.textPrimary }}>
                    {initials}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: colors.textPrimary }} numberOfLines={1}>
                  {item.authorName}
                </Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: colors.textMuted }}>
                  {relativeDate}
                </Text>
              </View>
            </View>

            {/* Topic pill */}
            {item.topic_name ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: colors.background,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: colors.gold }}>
                  #{item.topic_name.replace(/\s+/g, '')}
                </Text>
              </View>
            ) : null}

            {/* Content */}
            {isPoll ? (
              <>
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 13,
                    color: colors.textPrimary,
                    marginBottom: 6,
                    lineHeight: 19,
                  }}
                  numberOfLines={2}
                >
                  {item.pollQuestion ?? item.content}
                </Text>
                {item.pollOptions.slice(0, 2).map((opt) => {
                  const pct = item.pollTotalVotes > 0
                    ? Math.round((opt.votes_count / item.pollTotalVotes) * 100)
                    : 0;
                  return (
                    <View
                      key={opt.id}
                      style={{
                        height: 28,
                        backgroundColor: '#111008',
                        borderRadius: 5,
                        borderWidth: 1,
                        borderColor: colors.borderStrong,
                        overflow: 'hidden',
                        justifyContent: 'center',
                        marginBottom: 4,
                      }}
                    >
                      {pct > 0 && (
                        <View
                          style={{
                            position: 'absolute',
                            left: 0, top: 0, bottom: 0,
                            width: `${pct}%`,
                            backgroundColor: 'rgba(201,168,76,0.25)',
                          }}
                        />
                      )}
                      <View
                        style={{
                          flexDirection: 'row',
                          paddingHorizontal: 8,
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text
                          style={{ fontFamily: Fonts.body, fontSize: 11, color: colors.textPrimary }}
                          numberOfLines={1}
                        >
                          {opt.label}
                        </Text>
                        {item.pollTotalVotes > 0 && (
                          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: colors.gold }}>
                            {pct}%
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
                <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                  {item.pollTotalVotes === 1 ? t('community.one_vote') : t('community.count_votes', { count: item.pollTotalVotes })}
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontFamily: Fonts.body,
                    fontSize: 13,
                    color: colors.textSecondary,
                    lineHeight: 19,
                  }}
                  numberOfLines={expanded ? undefined : 5}
                >
                  {item.content}
                </Text>
                {!expanded && item.content.length > 200 ? (
                  <Pressable onPress={(e) => { e.stopPropagation?.(); setExpanded(true); }}>
                    <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.gold, marginTop: 2 }}>
                      {t('home.see_more')}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>

          {/* Action row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingBottom: 12,
              gap: 16,
            }}
          >
            <Pressable
              onPress={(e) => { e.stopPropagation?.(); onToggleLike(); }}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={18} color={isLiked ? colors.error : colors.textMuted} />
              <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.textMuted }}>
                {item.likes_count}
              </Text>
            </Pressable>
            <Pressable
              onPress={onPress}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
              <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.textMuted }}>
                {item.comments_count}
              </Text>
            </Pressable>
            <Pressable
              onPress={(e) => { e.stopPropagation?.(); onToggleSave(); }}
              hitSlop={8}
              style={{ marginLeft: 'auto' }}
            >
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color={isSaved ? colors.gold : colors.textMuted} />
            </Pressable>
          </View>
        </View>
      )}
    </Pressable>
  );
}

function CourseCard({ item, onPress }: { item: EduCourse; onPress: () => void }) {
  const { t } = useLanguage();
  const colors = useColors();

  const difficultyColor =
    item.difficulty === 'advanced'
      ? colors.error
      : item.difficulty === 'intermediate'
      ? colors.warning
      : colors.success;

  const difficultyLabels: Record<string, string> = {
    beginner: t('education.difficulty_beginner'),
    intermediate: t('education.difficulty_intermediate'),
    advanced: t('education.difficulty_advanced'),
  };
  const difficultyLabel = item.difficulty ? (difficultyLabels[item.difficulty] ?? item.difficulty) : null;

  const modulesLabel =
    item.modules_count === 1
      ? t('home.one_module')
      : t('home.count_modules', { count: item.modules_count });

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 200,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.8 : 1 }}>
          <View style={{ width: '100%', height: 110 }}>
            {item.thumbnail_url ? (
              <Image
                source={{ uri: item.thumbnail_url }}
                style={{ width: '100%', height: 110 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: '100%',
                  height: 110,
                  backgroundColor: colors.borderSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="book-outline" size={28} color={colors.gold} />
              </View>
            )}
          </View>

          <View style={{ padding: 12 }}>
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: colors.textPrimary,
                marginBottom: 6,
              }}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {difficultyLabel ? (
                <Text
                  style={{
                    fontFamily: Fonts.bodyBold,
                    fontSize: 10,
                    color: difficultyColor,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                  }}
                >
                  {difficultyLabel}
                </Text>
              ) : null}
              <Text
                style={{
                  fontFamily: Fonts.body,
                  fontSize: 11,
                  color: colors.textTertiary,
                }}
              >
                {modulesLabel}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

// ─── Carousel section separator ───────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  const colors = useColors();
  return (
    <Text
      style={{
        fontFamily: Fonts.heading,
        fontSize: 18,
        color: colors.gold,
        paddingHorizontal: 20,
        marginTop: 28,
        marginBottom: 12,
      }}
    >
      {children}
    </Text>
  );
}

function EmptySection({ message }: { message: string }) {
  const colors = useColors();
  return (
    <Text
      style={{
        fontFamily: Fonts.body,
        fontSize: 13,
        color: colors.textTertiary,
        paddingHorizontal: 20,
      }}
    >
      {message}
    </Text>
  );
}

function CardSeparator() {
  return <View style={{ width: 12 }} />;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const colors = useColors();
  const { user } = useAuth();

  // Each section has independent loaded/items state
  const [events, setEvents] = useState<HomeEventCard[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [posts, setPosts] = useState<HomePostCard[]>([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [courses, setCourses] = useState<EduCourse[]>([]);
  const [coursesLoaded, setCoursesLoaded] = useState(false);

  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Three independent IIFEs — none awaits the others; all fire concurrently.
    (async () => {
      const { items } = await fetchUpcomingEvents();
      setEvents(items);
      setEventsLoaded(true);
    })();

    (async () => {
      const { items } = await fetchRecentPosts();
      setPosts(items);
      setPostsLoaded(true);

      if (user?.id && items.length > 0) {
        try {
          const postIds = items.map((p) => p.id);
          const [likeRows, savedSet] = await Promise.all([
            supabase
              .from('post_likes')
              .select('post_id')
              .eq('user_id', user.id)
              .in('post_id', postIds),
            fetchSavedIds('post', postIds, user.id),
          ]);
          setLikedPostIds(new Set((likeRows.data ?? []).map((r: any) => r.post_id as string)));
          setSavedPostIds(savedSet);
        } catch (e) {
          console.warn('[Home] likes/saves fetch threw:', e);
        }
      }
    })();

    (async () => {
      const items = await fetchHomeCourses();
      setCourses(items);
      setCoursesLoaded(true);
    })();
  }, [user?.id]);

  const handleToggleLike = async (post: HomePostCard) => {
    if (!user?.id) return;
    const currentlyLiked = likedPostIds.has(post.id);

    setLikedPostIds((prev) => {
      const next = new Set(prev);
      currentlyLiked ? next.delete(post.id) : next.add(post.id);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likes_count: currentlyLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1 }
          : p,
      ),
    );

    try {
      if (!currentlyLiked) {
        const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
        if (error) throw error;
      }
    } catch (e) {
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        currentlyLiked ? next.add(post.id) : next.delete(post.id);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, likes_count: currentlyLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1) }
            : p,
        ),
      );
      Alert.alert(t('community.could_not_update_like'));
    }
  };

  const handleToggleSave = async (post: HomePostCard) => {
    if (!user?.id) return;
    const isCurrentlySaved = savedPostIds.has(post.id);

    setSavedPostIds((prev) => {
      const next = new Set(prev);
      isCurrentlySaved ? next.delete(post.id) : next.add(post.id);
      return next;
    });

    try {
      await toggleSave('post', post.id, user.id, isCurrentlySaved);
    } catch (e) {
      setSavedPostIds((prev) => {
        const next = new Set(prev);
        isCurrentlySaved ? next.add(post.id) : next.delete(post.id);
        return next;
      });
      Alert.alert(t('community.could_not_update_save'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GlobalHeader />

      {/* ── Carousels ────────────────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* SECTION 1 — Upcoming Events */}
        <SectionTitle>{t('home.upcoming_events')}</SectionTitle>
        {eventsLoaded ? (
          events.length === 0 ? (
            <EmptySection message={t('home.no_upcoming_events')} />
          ) : (
            <FlatList<HomeEventCard>
              horizontal
              data={events}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              ItemSeparatorComponent={CardSeparator}
              renderItem={({ item }) => (
                <EventCard item={item} onPress={() => router.push(`/event/${item.id}` as any)} />
              )}
            />
          )
        ) : null}

        {/* SECTION 2 — From the Community */}
        <SectionTitle>{t('home.from_the_community')}</SectionTitle>
        {postsLoaded ? (
          posts.length === 0 ? (
            <EmptySection message={t('home.no_posts_yet')} />
          ) : (
            <FlatList<HomePostCard>
              horizontal
              data={posts}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              ItemSeparatorComponent={CardSeparator}
              renderItem={({ item }) => (
                <CommunityPostCard
                  item={item}
                  isLiked={likedPostIds.has(item.id)}
                  isSaved={savedPostIds.has(item.id)}
                  onPress={() => router.push(`/post?id=${item.id}` as any)}
                  onToggleLike={() => handleToggleLike(item)}
                  onToggleSave={() => handleToggleSave(item)}
                />
              )}
            />
          )
        ) : null}

        {/* SECTION 3 — Latest in Education */}
        <SectionTitle>{t('home.latest_in_education')}</SectionTitle>
        {coursesLoaded ? (
          courses.length === 0 ? (
            <EmptySection message={t('home.no_courses_yet')} />
          ) : (
            <FlatList<EduCourse>
              horizontal
              data={courses}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              ItemSeparatorComponent={CardSeparator}
              renderItem={({ item }) => (
                <CourseCard
                  item={item}
                  onPress={() => router.push(`/education/course/${item.id}` as any)}
                />
              )}
            />
          )
        ) : null}
      </ScrollView>

    </View>
  );
}
