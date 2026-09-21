import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, Text, View } from 'react-native';
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
import { findFirstYouTubeVideoId, youTubeThumbnailUrl } from '../../../lib/youtube';
import { Fonts } from '../../../constants/fonts';
import { Colors } from '../../../constants/colors';
import GlobalHeader from '../../../components/GlobalHeader';
import { useLanguage } from '../../../contexts/LanguageContext';

// ─── Card sub-components ───────────────────────────────────────────────────────
// All Pressables use the SAFE static-style pattern:
//   layout/appearance props → static plain-object `style={{...}}`
//   pressed-opacity         → inner <View style={{ opacity: ... }}> via children render-prop

function EventCard({ item, onPress }: { item: HomeEventCard; onPress: () => void }) {
  const { t, locale } = useLanguage();
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
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
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
                  backgroundColor: Colors.warningBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="calendar-outline" size={28} color={Colors.warning} />
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
                  color: Colors.warning,
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
                color: Colors.textPrimary,
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
                  color: Colors.textTertiary,
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

function CommunityPostCard({ item, onPress }: { item: HomePostCard; onPress: () => void }) {
  const { t } = useLanguage();
  // Image priority: uploaded image → YouTube thumbnail → placeholder
  const videoId = item.image_url ? null : findFirstYouTubeVideoId(item.content);
  const thumbUri = item.image_url
    ? item.image_url
    : videoId
    ? youTubeThumbnailUrl(videoId)
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 200,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
      }}
    >
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.8 : 1 }}>
          {/* Media area */}
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
                  backgroundColor: Colors.successBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="chatbubble-outline" size={28} color={Colors.success} />
              </View>
            )}
          </View>

          {/* Body */}
          <View style={{ padding: 12 }}>
            <Text
              style={{
                fontFamily: Fonts.bodyBold,
                fontSize: 10,
                color: Colors.success,
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
                color: Colors.textPrimary,
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
                color: Colors.textTertiary,
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
  );
}

function CourseCard({ item, onPress }: { item: EduCourse; onPress: () => void }) {
  const { t } = useLanguage();

  const difficultyColor =
    item.difficulty === 'advanced'
      ? Colors.error
      : item.difficulty === 'intermediate'
      ? Colors.warning
      : Colors.success;

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
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
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
                  backgroundColor: Colors.borderSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="book-outline" size={28} color={Colors.gold} />
              </View>
            )}
          </View>

          <View style={{ padding: 12 }}>
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: Colors.textPrimary,
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
                  color: Colors.textTertiary,
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
  return (
    <Text
      style={{
        fontFamily: Fonts.heading,
        fontSize: 18,
        color: Colors.gold,
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
  return (
    <Text
      style={{
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.textTertiary,
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

  // Each section has independent loaded/items state
  const [events, setEvents] = useState<HomeEventCard[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [posts, setPosts] = useState<HomePostCard[]>([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [courses, setCourses] = useState<EduCourse[]>([]);
  const [coursesLoaded, setCoursesLoaded] = useState(false);

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
    })();

    (async () => {
      const items = await fetchHomeCourses();
      setCourses(items);
      setCoursesLoaded(true);
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
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
                <EventCard item={item} onPress={() => router.push('/events' as any)} />
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
                  onPress={() => router.push(`/post?id=${item.id}` as any)}
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
