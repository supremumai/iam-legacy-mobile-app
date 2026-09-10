import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  HomeEventCard,
  HomePostCard,
  HomeResourceCard,
  fetchUpcomingEvents,
  fetchRecentPosts,
  fetchRecentResources,
} from '../../../lib/home';
import { findFirstYouTubeVideoId, youTubeThumbnailUrl } from '../../../lib/youtube';
import { Fonts } from '../../../constants/fonts';
import GlobalHeader from '../../../components/GlobalHeader';

// ─── Card sub-components ───────────────────────────────────────────────────────
// All Pressables use the SAFE static-style pattern:
//   layout/appearance props → static plain-object `style={{...}}`
//   pressed-opacity         → inner <View style={{ opacity: ... }}> via children render-prop

function EventCard({ item, onPress }: { item: HomeEventCard; onPress: () => void }) {
  const dateLabel = item.event_date
    ? (() => {
        const d = new Date(item.event_date);
        return (
          d.toLocaleString('en-US', { month: 'short' }).toUpperCase() + ' ' + d.getDate()
        );
      })()
    : null;
  const locationLine = item.is_online ? 'Online' : item.location ?? null;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 200,
        borderRadius: 12,
        backgroundColor: '#1c1a14',
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.22)',
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
              {item.title ?? 'Untitled Event'}
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
  );
}

function CommunityPostCard({ item, onPress }: { item: HomePostCard; onPress: () => void }) {
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
        backgroundColor: '#1c1a14',
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.22)',
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
              COMMUNITY
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
  );
}

function ResourceCard({ item, onPress }: { item: HomeResourceCard; onPress: () => void }) {
  const thumbUri = item.thumbnail_url ?? youTubeThumbnailUrl(item.youtube_video_id);

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 200,
        borderRadius: 12,
        backgroundColor: '#1c1a14',
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.22)',
        overflow: 'hidden',
      }}
    >
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.8 : 1 }}>
          {/* Media area with play-circle overlay */}
          <View style={{ width: '100%', height: 110 }}>
            <Image
              source={{ uri: thumbUri }}
              style={{ width: '100%', height: 110 }}
              resizeMode="cover"
            />
            {/* Centered play circle */}
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
              EDUCATION
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
  );
}

// ─── Carousel section separator ───────────────────────────────────────────────

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

function EmptySection({ message }: { message: string }) {
  return (
    <Text
      style={{
        fontFamily: Fonts.body,
        fontSize: 13,
        color: 'rgba(255,255,255,0.45)',
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

  // Each section has independent loaded/items state
  const [events, setEvents] = useState<HomeEventCard[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [posts, setPosts] = useState<HomePostCard[]>([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [resources, setResources] = useState<HomeResourceCard[]>([]);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);

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
      const { items } = await fetchRecentResources();
      setResources(items);
      setResourcesLoaded(true);
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
      <GlobalHeader />

      {/* ── Carousels ────────────────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* SECTION 1 — Upcoming Events */}
        <SectionTitle>Upcoming Events</SectionTitle>
        {eventsLoaded ? (
          events.length === 0 ? (
            <EmptySection message="No upcoming events" />
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
        <SectionTitle>From the Community</SectionTitle>
        {postsLoaded ? (
          posts.length === 0 ? (
            <EmptySection message="No posts yet" />
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
        <SectionTitle>Latest in Education</SectionTitle>
        {resourcesLoaded ? (
          resources.length === 0 ? (
            <EmptySection message="No videos yet" />
          ) : (
            <FlatList<HomeResourceCard>
              horizontal
              data={resources}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              ItemSeparatorComponent={CardSeparator}
              renderItem={({ item }) => (
                <ResourceCard item={item} onPress={() => router.push('/education' as any)} />
              )}
            />
          )
        ) : null}
      </ScrollView>

    </View>
  );
}
