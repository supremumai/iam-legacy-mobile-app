import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Poll, PollOption, PollWithMeta, PostWithAuthor, Topic } from '../../../types/database';
import { normalizePostRow } from '../../../lib/posts';
import { Fonts } from '../../../constants/fonts';
import GlobalHeader from '../../../components/GlobalHeader';
import PostComposer from '../../../components/PostComposer';
import PostCard from '../../../components/PostCard';
import PollCard from '../../../components/PollCard';
import CommentsSheet from '../../../components/CommentsSheet';

export default function CommunityScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [pollsByPostId, setPollsByPostId] = useState<Map<string, PollWithMeta>>(new Map());
  const [commentsSheetPost, setCommentsSheetPost] = useState<PostWithAuthor | null>(null);

  // Topic filter — null means "All" (no filter)
  const [topics, setTopics] = useState<Array<Pick<Topic, 'id' | 'name' | 'icon'>>>([]);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  // Fetch topics once on mount — fail silently
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('topics')
          .select('id, name, icon')
          .order('sort_order');
        if (data) setTopics(data as Array<Pick<Topic, 'id' | 'name' | 'icon'>>);
      } catch {
        // Topic filter is optional — do nothing on failure
      }
    })();
  }, []);

  const COLS = 'id, user_id, content, image_url, likes_count, comments_count, created_at, updated_at, topic_id, post_type, profiles(id, full_name, username, avatar_url), topic:topics(id, slug, name, icon, sort_order)';

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(COLS)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('[Community] fetchPosts error:', error.message);
        return;
      }

      const fetchedPosts = (data ?? []).map(normalizePostRow);
      setPosts(fetchedPosts);

      // Single query for all liked post ids — no N+1
      if (user?.id && fetchedPosts.length > 0) {
        try {
          const postIds = fetchedPosts.map((p) => p.id);
          const { data: likeRows } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds);
          setLikedPostIds(new Set((likeRows ?? []).map((r: any) => r.post_id as string)));
        } catch (e) {
          console.warn('[Community] likes fetch threw:', e);
          setLikedPostIds(new Set());
        }
      } else {
        setLikedPostIds(new Set());
      }

      // ── Bulk poll fetch — one query per resource, never N+1 ──────────────
      const pollPostIds = fetchedPosts
        .filter((p) => p.post_type === 'poll')
        .map((p) => p.id);

      if (pollPostIds.length > 0) {
        try {
          const { data: pollRows } = await supabase
            .from('polls')
            .select('*, poll_options(*)')
            .in('post_id', pollPostIds);

          const rows = (pollRows ?? []) as any[];
          const pollIds = rows.map((r) => r.id as string);

          // Single query for all votes by current user across these polls
          let voteRows: Array<{ poll_id: string; poll_option_id: string }> = [];
          if (user?.id && pollIds.length > 0) {
            const { data: votes } = await supabase
              .from('poll_votes')
              .select('poll_id, poll_option_id')
              .eq('user_id', user.id)
              .in('poll_id', pollIds);
            voteRows = (votes ?? []) as Array<{ poll_id: string; poll_option_id: string }>;
          }

          // Map poll_id → list of voted option ids
          const votesByPollId = new Map<string, string[]>();
          for (const v of voteRows) {
            const arr = votesByPollId.get(v.poll_id) ?? [];
            arr.push(v.poll_option_id);
            votesByPollId.set(v.poll_id, arr);
          }

          const newPollMap = new Map<string, PollWithMeta>();
          for (const row of rows) {
            const options: PollOption[] = ((row.poll_options ?? []) as any[])
              .map(
                (o: any): PollOption => ({
                  id: o.id,
                  poll_id: o.poll_id,
                  label: o.label,
                  sort_order: o.sort_order ?? 0,
                  votes_count: o.votes_count ?? 0,
                }),
              )
              .sort((a: PollOption, b: PollOption) => a.sort_order - b.sort_order);

            const poll: Poll = {
              id: row.id,
              post_id: row.post_id,
              question: row.question,
              allow_multiple: row.allow_multiple ?? false,
              closes_at: row.closes_at ?? null,
              created_at: row.created_at,
            };

            // total_votes: sum of votes_count already maintained by DB trigger
            const total_votes = options.reduce((sum, o) => sum + o.votes_count, 0);
            const userVotedOptionIds = votesByPollId.get(row.id) ?? [];

            newPollMap.set(row.post_id, { poll, options, userVotedOptionIds, total_votes });
          }

          setPollsByPostId(newPollMap);
        } catch (e) {
          console.warn('[Community] poll fetch threw:', e);
          setPollsByPostId(new Map());
        }
      } else {
        setPollsByPostId(new Map());
      }
    } catch (e) {
      console.warn('[Community] fetchPosts threw:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    fetchPosts();
  }, [fetchPosts]);

  // Silent refetch whenever this screen regains focus (e.g. returning from
  // post detail after a delete, or switching back from another tab/screen).
  // Does not set loading=true, so no spinner — feels seamless.
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handlePostCreated = () => {
    fetchPosts();
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleToggleLike = async (post: PostWithAuthor) => {
    if (!user?.id) return;
    const currentlyLiked = likedPostIds.has(post.id);

    // Optimistic update
    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (currentlyLiked) next.delete(post.id);
      else next.add(post.id);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              likes_count: currentlyLiked
                ? Math.max(0, p.likes_count - 1)
                : p.likes_count + 1,
            }
          : p,
      ),
    );

    try {
      if (!currentlyLiked) {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }
    } catch (e: unknown) {
      // Revert both optimistic changes
      setLikedPostIds((prev) => {
        const next = new Set(prev);
        if (currentlyLiked) next.add(post.id);
        else next.delete(post.id);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                likes_count: currentlyLiked
                  ? p.likes_count + 1
                  : Math.max(0, p.likes_count - 1),
              }
            : p,
        ),
      );
      Alert.alert('Could not update like', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleVoteChange = useCallback((postId: string, updated: PollWithMeta) => {
    setPollsByPostId((prev) => {
      const next = new Map(prev);
      next.set(postId, updated);
      return next;
    });
  }, []);

  const handleCommentCountChange = (postId: string, delta: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments_count: Math.max(0, p.comments_count + delta) }
          : p,
      ),
    );
  };

  // ─── Derived: filter posts by active topic ───────────────────────────────
  const filteredPosts = activeTopicId
    ? posts.filter((p) => p.topic_id === activeTopicId)
    : posts;

  // ─── Header (GlobalHeader + standalone title + composer + separator + topic pills) ──
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
        Community
      </Text>

      <PostComposer onPostCreated={handlePostCreated} />

      {/* Thin gold separator between composer and the filter / feed zone */}
      <View
        style={{
          height: 1,
          backgroundColor: 'rgba(201,168,76,0.22)',
          marginHorizontal: 20,
          marginVertical: 12,
        }}
      />

      {/* Topic filter pills — below the separator (Batch 34) */}
      {topics.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 8 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* "All" pill */}
          <Pressable
            onPress={() => setActiveTopicId(null)}
            style={{
              backgroundColor: activeTopicId === null ? '#c9a84c' : '#1c1a14',
              borderWidth: 1,
              borderColor: activeTopicId === null ? '#c9a84c' : 'rgba(201,168,76,0.22)',
              borderRadius: 100,
              paddingHorizontal: 14,
              paddingVertical: 6,
            }}
          >
            {({ pressed }) => (
              <View style={{ opacity: pressed ? 0.7 : 1 }}>
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 12,
                    color: activeTopicId === null ? '#0a0900' : '#FFFFFF',
                  }}
                >
                  All
                </Text>
              </View>
            )}
          </Pressable>

          {topics.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setActiveTopicId(t.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: activeTopicId === t.id ? '#c9a84c' : '#1c1a14',
                borderWidth: 1,
                borderColor: activeTopicId === t.id ? '#c9a84c' : 'rgba(201,168,76,0.22)',
                borderRadius: 100,
                paddingHorizontal: 14,
                paddingVertical: 6,
                gap: 4,
              }}
            >
              {({ pressed }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    opacity: pressed ? 0.7 : 1,
                  }}
                >
                  {t.icon ? (
                    <Ionicons
                      name={t.icon as any}
                      size={12}
                      color={activeTopicId === t.id ? '#0a0900' : '#c9a84c'}
                    />
                  ) : null}
                  <Text
                    style={{
                      fontFamily: Fonts.bodySemiBold,
                      fontSize: 12,
                      color: activeTopicId === t.id ? '#0a0900' : '#FFFFFF',
                    }}
                  >
                    {t.name}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  // ─── Footer ──────────────────────────────────────────────────────────────
  const listFooter = <View style={{ paddingBottom: 32 }} />;

  // ─── Empty state ─────────────────────────────────────────────────────────
  // When a topic filter is active and there are posts (just none in this topic),
  // show a topic-specific message. Otherwise show the generic "no posts yet".
  const isTopicFilteredEmpty =
    !loading && activeTopicId !== null && posts.length > 0 && filteredPosts.length === 0;
  const activeTopicName = topics.find((t) => t.id === activeTopicId)?.name ?? 'this topic';

  const listEmpty = loading ? (
    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
      <ActivityIndicator color="#c9a84c" size="large" />
    </View>
  ) : isTopicFilteredEmpty ? (
    <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 }}>
      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#FFFFFF' }}>
        No posts in {activeTopicName} yet
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
        Be the first to post here.
      </Text>
    </View>
  ) : (
    <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 }}>
      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#FFFFFF' }}>
        No posts yet
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
        Be the first to share something with the community.
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
      <FlatList<PostWithAuthor>
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.post_type === 'poll') {
            const meta = pollsByPostId.get(item.id);
            if (!meta) return null;
            return (
              <PollCard
                post={item}
                pollMeta={meta}
                currentUserId={user?.id}
                onVoteChange={(updated) => handleVoteChange(item.id, updated)}
              />
            );
          }
          return (
            <PostCard
              post={item}
              currentUserId={user?.id}
              onDeleted={handlePostDeleted}
              isLiked={likedPostIds.has(item.id)}
              onToggleLike={handleToggleLike}
              onOpenComments={(post) => setCommentsSheetPost(post)}
              onOpenPost={(post) => router.push(`/post?id=${post.id}` as any)}
              onEditPost={(post) => router.push(`/edit-post?id=${post.id}` as any)}
            />
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#c9a84c"
            colors={['#c9a84c']}
          />
        }
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
      <CommentsSheet
        visible={commentsSheetPost !== null}
        post={commentsSheetPost}
        onClose={() => setCommentsSheetPost(null)}
        onCommentCountChange={handleCommentCountChange}
      />
    </View>
  );
}
