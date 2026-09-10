import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { PostAuthor, ResourceWithMeta, Topic } from '../../../types/database';
import { Fonts } from '../../../constants/fonts';
import GlobalHeader from '../../../components/GlobalHeader';
import ResourceCard from '../../../components/ResourceCard';
import AddResourceModal from '../../../components/AddResourceModal';

// Verified FK constraint names:
//   resources_submitted_by_fkey → profiles (alias key: submitter)
//   resources_topic_id_fkey     → topics   (alias key: topic)
const RESOURCE_COLS =
  'id, submitted_by, topic_id, title, description, youtube_url, youtube_video_id, thumbnail_url, channel_name, duration_seconds, likes_count, views_count, created_at, ' +
  'submitter:profiles!resources_submitted_by_fkey(id, full_name, username, avatar_url), ' +
  'topic:topics!resources_topic_id_fkey(id, slug, name, description, icon, sort_order)';

function normalizeResources(data: any[]): ResourceWithMeta[] {
  return data.map((raw: any) => {
    const submitterRaw: any = Array.isArray(raw.submitter)
      ? (raw.submitter[0] ?? null)
      : (raw.submitter ?? null);

    const topicRaw: any = Array.isArray(raw.topic)
      ? (raw.topic[0] ?? null)
      : (raw.topic ?? null);

    const submitter: PostAuthor | null = submitterRaw
      ? {
          id: submitterRaw.id,
          full_name: submitterRaw.full_name ?? null,
          username: submitterRaw.username ?? null,
          avatar_url: submitterRaw.avatar_url ?? null,
        }
      : null;

    const topic: Topic | null = topicRaw
      ? {
          id: topicRaw.id,
          slug: topicRaw.slug,
          name: topicRaw.name,
          description: topicRaw.description ?? null,
          icon: topicRaw.icon ?? null,
          sort_order: topicRaw.sort_order,
        }
      : null;

    return {
      id: raw.id,
      submitted_by: raw.submitted_by,
      topic_id: raw.topic_id,
      title: raw.title,
      description: raw.description ?? null,
      youtube_url: raw.youtube_url,
      youtube_video_id: raw.youtube_video_id,
      thumbnail_url: raw.thumbnail_url ?? null,
      channel_name: raw.channel_name ?? null,
      duration_seconds: raw.duration_seconds ?? null,
      likes_count: raw.likes_count ?? 0,
      views_count: raw.views_count ?? 0,
      created_at: raw.created_at,
      submitter,
      topic,
    };
  });
}

type FilterTopic = { id: string; name: string };

export default function EducationScreen() {
  const { user } = useAuth();

  const [filterTopics, setFilterTopics] = useState<FilterTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const [resources, setResources] = useState<ResourceWithMeta[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const [addModalVisible, setAddModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    setError(false);
    try {
      const [topicsResult, resourcesResult] = await Promise.all([
        supabase
          .from('topics')
          .select('id, name')
          .order('sort_order', { ascending: true }),
        supabase
          .from('resources')
          .select(RESOURCE_COLS)
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (topicsResult.error) {
        console.warn('[Education] topics fetch error:', topicsResult.error.message);
      } else {
        setFilterTopics((topicsResult.data ?? []) as FilterTopic[]);
      }

      if (resourcesResult.error) {
        console.warn('[Education] resources fetch error:', resourcesResult.error.message);
        setError(true);
        return;
      }

      const fetched = normalizeResources(resourcesResult.data ?? []);
      setResources(fetched);

      // Single query per table — no per-card queries
      if (user?.id && fetched.length > 0) {
        const resourceIds = fetched.map((r) => r.id);
        const [likesResult, savesResult] = await Promise.all([
          supabase
            .from('resource_likes')
            .select('resource_id')
            .eq('user_id', user.id)
            .in('resource_id', resourceIds),
          supabase
            .from('resource_saves')
            .select('resource_id')
            .eq('user_id', user.id)
            .in('resource_id', resourceIds),
        ]);
        setLikedIds(
          new Set((likesResult.data ?? []).map((r: any) => r.resource_id as string)),
        );
        setSavedIds(
          new Set((savesResult.data ?? []).map((r: any) => r.resource_id as string)),
        );
      } else {
        setLikedIds(new Set());
        setSavedIds(new Set());
      }
    } catch (e) {
      console.warn('[Education] fetchData threw:', e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ── Like toggle (optimistic + rollback) ─────────────────────────────────
  const handleToggleLike = async (resource: ResourceWithMeta) => {
    if (!user?.id) return;
    const isLiked = likedIds.has(resource.id);

    setLikedIds((prev) => {
      const next = new Set(prev);
      isLiked ? next.delete(resource.id) : next.add(resource.id);
      return next;
    });
    setResources((prev) =>
      prev.map((r) =>
        r.id === resource.id
          ? {
              ...r,
              likes_count: isLiked
                ? Math.max(0, r.likes_count - 1)
                : r.likes_count + 1,
            }
          : r,
      ),
    );

    try {
      if (!isLiked) {
        const { error } = await supabase
          .from('resource_likes')
          .insert({ resource_id: resource.id, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('resource_likes')
          .delete()
          .eq('resource_id', resource.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }
    } catch (e: unknown) {
      setLikedIds((prev) => {
        const next = new Set(prev);
        isLiked ? next.add(resource.id) : next.delete(resource.id);
        return next;
      });
      setResources((prev) =>
        prev.map((r) =>
          r.id === resource.id
            ? {
                ...r,
                likes_count: isLiked
                  ? r.likes_count + 1
                  : Math.max(0, r.likes_count - 1),
              }
            : r,
        ),
      );
      Alert.alert('Could not update like', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  // ── Save toggle (optimistic + rollback) ─────────────────────────────────
  const handleToggleSave = async (resource: ResourceWithMeta) => {
    if (!user?.id) return;
    const isSaved = savedIds.has(resource.id);

    setSavedIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(resource.id) : next.add(resource.id);
      return next;
    });

    try {
      if (!isSaved) {
        const { error } = await supabase
          .from('resource_saves')
          .insert({ resource_id: resource.id, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('resource_saves')
          .delete()
          .eq('resource_id', resource.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }
    } catch (e: unknown) {
      setSavedIds((prev) => {
        const next = new Set(prev);
        isSaved ? next.add(resource.id) : next.delete(resource.id);
        return next;
      });
      Alert.alert('Could not update save', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleDeleted = (resourceId: string) => {
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
  };

  // ── Filtered list (client-side, no refetch) ─────────────────────────────
  const filteredResources = selectedTopicId
    ? resources.filter((r) => r.topic_id === selectedTopicId)
    : resources;

  // ── Error screen ─────────────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
        <GlobalHeader />
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 24,
            color: '#c9a84c',
            paddingHorizontal: 20,
            marginTop: 16,
          }}
        >
          Education
        </Text>
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
            Could not load the library
          </Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              fetchData();
            }}
            style={({ pressed }) => ({
              backgroundColor: '#c9a84c',
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: '#0a0900' }}>
              Retry
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── List header ──────────────────────────────────────────────────────────
  const listHeader = (
    <View>
      <GlobalHeader />
      <Text
        style={{
          fontFamily: Fonts.heading,
          fontSize: 24,
          color: '#c9a84c',
          paddingHorizontal: 20,
          marginTop: 16,
        }}
      >
        Education
      </Text>

      {/* Share a Video button */}
      <Pressable
        onPress={() => setAddModalVisible(true)}
        style={{ marginHorizontal: 20, marginTop: 16, borderRadius: 8, overflow: 'hidden' }}
      >
        {({ pressed }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#c9a84c',
              borderRadius: 8,
              paddingVertical: 12,
              gap: 8,
              opacity: pressed ? 0.85 : 1,
            }}
          >
            <Ionicons name="add" size={20} color="#0a0900" />
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: '#0a0900' }}>
              Share a Video
            </Text>
          </View>
        )}
      </Pressable>

      {/* Category filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, gap: 8 }}
      >
        {/* "All" pill */}
        <Pressable
          onPress={() => setSelectedTopicId(null)}
          style={{
            backgroundColor: selectedTopicId === null ? '#c9a84c' : '#1c1a14',
            borderWidth: selectedTopicId === null ? 0 : 1,
            borderColor: 'rgba(201,168,76,0.22)',
            borderRadius: 999,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              fontFamily: selectedTopicId === null ? Fonts.bodyBold : Fonts.bodySemiBold,
              fontSize: 14,
              color: selectedTopicId === null ? '#0a0900' : '#FFFFFF',
            }}
          >
            All
          </Text>
        </Pressable>

        {filterTopics.map((topic) => {
          const active = selectedTopicId === topic.id;
          return (
            <Pressable
              key={topic.id}
              onPress={() => setSelectedTopicId(topic.id)}
              style={{
                backgroundColor: active ? '#c9a84c' : '#1c1a14',
                borderWidth: active ? 0 : 1,
                borderColor: 'rgba(201,168,76,0.22)',
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: active ? Fonts.bodyBold : Fonts.bodySemiBold,
                  fontSize: 14,
                  color: active ? '#0a0900' : '#FFFFFF',
                }}
              >
                {topic.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Section label */}
      <Text
        style={{
          paddingHorizontal: 20,
          marginTop: 24,
          marginBottom: 8,
          fontFamily: Fonts.heading,
          fontSize: 18,
          color: '#c9a84c',
        }}
      >
        Library
      </Text>
    </View>
  );

  // ── Empty state ──────────────────────────────────────────────────────────
  const listEmpty = loading ? (
    <View style={{ alignItems: 'center', paddingVertical: 48 }}>
      <ActivityIndicator color="#c9a84c" size="large" />
    </View>
  ) : selectedTopicId ? (
    <View
      style={{ alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 }}
    >
      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#FFFFFF' }}>
        No videos in this topic yet
      </Text>
      <Text
        style={{
          fontFamily: Fonts.body,
          fontSize: 13,
          color: 'rgba(255,255,255,0.55)',
          marginTop: 4,
          textAlign: 'center',
        }}
      >
        Be the first to add one.
      </Text>
    </View>
  ) : (
    <View
      style={{ alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 }}
    >
      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#FFFFFF' }}>
        No videos yet
      </Text>
      <Text
        style={{
          fontFamily: Fonts.body,
          fontSize: 13,
          color: 'rgba(255,255,255,0.55)',
          marginTop: 4,
          textAlign: 'center',
        }}
      >
        Share the first video with the community.
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
      <FlatList<ResourceWithMeta>
        data={filteredResources}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginHorizontal: 20 }}>
            <ResourceCard
              resource={item}
              isLiked={likedIds.has(item.id)}
              isSaved={savedIds.has(item.id)}
              currentUserId={user?.id}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              onDeleted={handleDeleted}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#c9a84c"
            colors={['#c9a84c']}
          />
        }
        ListHeaderComponent={listHeader}
        ListFooterComponent={<View style={{ paddingBottom: 32 }} />}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={{ paddingBottom: 0 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <AddResourceModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onResourceAdded={() => {
          setAddModalVisible(false);
          fetchData();
        }}
      />
    </View>
  );
}
