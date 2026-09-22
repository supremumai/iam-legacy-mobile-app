import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { fetchPostById, fetchPollMeta } from '../lib/posts';
import { fetchSavedIds, toggleSave } from '../lib/saves';
import { PollWithMeta, PostWithAuthor } from '../types/database';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';
import PostCard from '../components/PostCard';
import PollCard from '../components/PollCard';
import CommentThread from '../components/CommentThread';

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [pollMeta, setPollMeta] = useState<PollWithMeta | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  // null = still loading / success; string = fetch error; 'not_found' = deleted post
  const [fetchError, setFetchError] = useState<string | 'not_found' | null>(null);

  // ─── Missing id param guard ──────────────────────────────────────────────
  if (!id) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
          >
            <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.textPrimary }}>
            Post not found.
          </Text>
        </View>
      </View>
    );
  }

  // ─── On-mount fetch: post + like status ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const [postResult, likeResult, savedSet] = await Promise.all([
          fetchPostById(id),
          user?.id
            ? supabase
                .from('post_likes')
                .select('id')
                .eq('post_id', id)
                .eq('user_id', user.id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          user?.id
            ? fetchSavedIds('post', [id], user.id)
            : Promise.resolve(new Set<string>()),
        ]);

        if (cancelled) return;

        if (postResult.error) {
          setFetchError(postResult.error);
          return;
        }

        if (!postResult.post) {
          setFetchError('not_found');
          return;
        }

        setPost(postResult.post);
        setIsLiked(likeResult.data !== null);
        setIsSaved(savedSet.has(id));

        // Fetch poll metadata when the post is a poll
        if (postResult.post.post_type === 'poll') {
          const meta = await fetchPollMeta(postResult.post.id, user?.id ?? null);
          if (!cancelled) setPollMeta(meta);
        }
      } catch (e) {
        if (!cancelled) {
          setFetchError('Could not load this post.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  // ─── Silent focus-refetch ─────────────────────────────────────────────────
  // Runs every time this screen regains focus (e.g. returning from edit-post).
  // Does NOT set loading=true — no spinner, replaces post state silently on
  // success, leaves currently-displayed post as-is on error.
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      let cancelled = false;

      (async () => {
        try {
          const result = await fetchPostById(id);
          if (cancelled) return;
          if (result.post) {
            setPost(result.post);
            if (result.post.post_type === 'poll') {
              const meta = await fetchPollMeta(result.post.id, user?.id ?? null);
              if (!cancelled && meta) setPollMeta(meta);
            }
          }
          // On error or not-found: leave existing state unchanged
        } catch {
          // Leave existing state unchanged
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [id, user?.id]),
  );

  // ─── Like toggle (optimistic) ────────────────────────────────────────────
  const handleToggleLike = async (p: PostWithAuthor) => {
    if (!user?.id) return;
    const currentlyLiked = isLiked;

    setIsLiked(!currentlyLiked);
    setPost((prev) =>
      prev
        ? {
            ...prev,
            likes_count: currentlyLiked
              ? Math.max(0, prev.likes_count - 1)
              : prev.likes_count + 1,
          }
        : prev,
    );

    try {
      if (!currentlyLiked) {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: p.id, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', p.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }
    } catch (e: unknown) {
      setIsLiked(currentlyLiked);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              likes_count: currentlyLiked
                ? prev.likes_count + 1
                : Math.max(0, prev.likes_count - 1),
            }
          : prev,
      );
      Alert.alert('Could not update like', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  // ─── Save toggle (optimistic + rollback) — Batch 46b ────────────────────
  const handleToggleSave = async (_p: PostWithAuthor) => {
    if (!post || !user?.id) return;
    const currentlySaved = isSaved;
    setIsSaved(!currentlySaved);
    try {
      await toggleSave('post', post.id, user.id, currentlySaved);
    } catch (e: unknown) {
      setIsSaved(currentlySaved);
      Alert.alert('Could not update save', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  // ─── Share ───────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!post) return;
    const author = post.author;
    const authorDisplayName =
      author?.full_name ??
      (author?.username ? `@${author.username}` : 'Legacy Member');
    const content =
      post.content.length > 200
        ? post.content.slice(0, 200) + '…'
        : post.content;

    try {
      await Share.share({
        message: `${authorDisplayName} on I Am Legacy: "${content}"`,
      });
    } catch {
      // User dismissed share sheet — no-op
    }
  };

  // ─── Top bar ─────────────────────────────────────────────────────────────
  const topBar = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: insets.top,
        paddingHorizontal: 20,
        paddingBottom: 12,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
      </Pressable>

      {post ? (
        <Pressable
          onPress={handleShare}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name="share-social-outline" size={22} color={Colors.gold} />
        </Pressable>
      ) : (
        <View style={{ width: 22 }} />
      )}
    </View>
  );

  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        {topBar}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.gold} size="large" />
        </View>
      </View>
    );
  }

  // ─── Not-found state ─────────────────────────────────────────────────────
  if (fetchError === 'not_found') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        {topBar}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 15,
              color: Colors.textPrimary,
              textAlign: 'center',
            }}
          >
            This post is no longer available.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              marginTop: 20,
              backgroundColor: Colors.gold,
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.background }}>
              Go back
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Fetch error state (network / query failure) ─────────────────────────
  if (fetchError) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        {topBar}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 15,
              color: Colors.textPrimary,
              textAlign: 'center',
              marginBottom: 20,
            }}
          >
            {fetchError}
          </Text>
          <Pressable
            onPress={() => {
              setFetchError(null);
              setLoading(true);
            }}
            style={({ pressed }) => ({
              backgroundColor: Colors.gold,
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.background }}>
              Retry
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Success state ───────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {topBar}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          {post && (
            <>
              {/* Dispatch by post_type: poll → PollCard, text → PostCard */}
              {post.post_type === 'poll' && pollMeta !== null ? (
                <PollCard
                  post={post}
                  pollMeta={pollMeta}
                  currentUserId={user?.id}
                  onVoteChange={setPollMeta}
                />
              ) : (
                <PostCard
                  post={post}
                  currentUserId={user?.id}
                  isLiked={isLiked}
                  onToggleLike={handleToggleLike}
                  isSaved={isSaved}
                  onToggleSave={handleToggleSave}
                  onDeleted={() => router.back()}
                  onOpenComments={() => {}}
                  onOpenPost={() => {}}
                  onEditPost={(p) => router.push(`/edit-post?id=${p.id}` as any)}
                />
              )}
              <CommentThread
                postId={post.id}
                scrollable={false}
                onCommentCountChange={(_postId, delta) => {
                  setPost((prev) =>
                    prev
                      ? { ...prev, comments_count: Math.max(0, prev.comments_count + delta) }
                      : prev,
                  );
                }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
