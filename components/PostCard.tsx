import { View, Text, Pressable, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { getInitials } from '../lib/avatar';
import { formatRelativeTime } from '../lib/time';
import { findFirstYouTubeVideoId } from '../lib/youtube';
import { PostWithAuthor } from '../types/database';
import { Fonts } from '../constants/fonts';
import YouTubePreview from './YouTubePreview';

interface PostCardProps {
  post: PostWithAuthor;
  currentUserId: string | undefined;
  onDeleted: (postId: string) => void;
  isLiked: boolean;
  onToggleLike: (post: PostWithAuthor) => void;
  onOpenComments: (post: PostWithAuthor) => void;
  onOpenPost: (post: PostWithAuthor) => void;
  onEditPost: (post: PostWithAuthor) => void;
}

export default function PostCard({
  post,
  currentUserId,
  onDeleted,
  isLiked,
  onToggleLike,
  onOpenComments,
  onOpenPost,
  onEditPost,
}: PostCardProps) {
  const router = useRouter();
  const isOwner = post.user_id === currentUserId;
  const author = post.author;

  const initials = getInitials(author?.full_name, author?.username);

  const displayName =
    author?.full_name ??
    (author?.username ? `@${author.username}` : 'Legacy Member');

  const editedSuffix = post.updated_at ? ' (edited)' : '';
  const subLine = author?.username
    ? `@${author.username} · ${formatRelativeTime(post.created_at)}${editedSuffix}`
    : `${formatRelativeTime(post.created_at)}${editedSuffix}`;
  const videoId = findFirstYouTubeVideoId(post.content);

  // ─── Two-step delete: confirm then delete ──────────────────────────────────
  const handleDeletePress = () => {
    Alert.alert(
      'Delete Post',
      "This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', post.id);

              if (error) {
                Alert.alert('Could not delete', error.message);
                return;
              }

              onDeleted(post.id);
            } catch (e: unknown) {
              Alert.alert(
                'Could not delete',
                e instanceof Error ? e.message : 'Unknown error',
              );
            }
          },
        },
      ],
    );
  };

  // ─── Kebab menu ───────────────────────────────────────────────────────────
  const handleOptionsPress = () => {
    Alert.alert('Post Options', undefined, [
      { text: 'Edit Post', onPress: () => onEditPost(post) },
      { text: 'Delete Post', style: 'destructive', onPress: handleDeletePress },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View
      style={{
        backgroundColor: '#1c1a14',
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.22)',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 12,
      }}
    >
      {/* ── Header row: avatar | name block (flex:1) | kebab icon ── */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
        onLayout={(e) => console.log('HEADER ROW width:', e.nativeEvent.layout.width)}
      >
        {/* Avatar + Name — tappable to view author profile */}
        {author?.id ? (
          <Pressable
            onPress={() => router.push(`/profile?id=${author.id}` as any)}
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
          >
            {({ pressed }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, opacity: pressed ? 0.7 : 1 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#1c1a14',
                    borderWidth: 1,
                    borderColor: 'rgba(201,168,76,0.22)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {author.avatar_url ? (
                    <Image source={{ uri: author.avatar_url }} style={{ width: 40, height: 40 }} />
                  ) : (
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: '#FFFFFF' }}>
                      {initials}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#FFFFFF' }}>
                    {displayName}
                  </Text>
                  <Text
                    style={{
                      fontFamily: Fonts.body,
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.55)',
                      marginTop: 1,
                    }}
                  >
                    {subLine}
                  </Text>
                </View>
              </View>
            )}
          </Pressable>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#1c1a14',
                borderWidth: 1,
                borderColor: 'rgba(201,168,76,0.22)',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {author?.avatar_url ? (
                <Image source={{ uri: author.avatar_url }} style={{ width: 40, height: 40 }} />
              ) : (
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: '#FFFFFF' }}>
                  {initials}
                </Text>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#FFFFFF' }}>
                {displayName}
              </Text>
              <Text
                style={{
                  fontFamily: Fonts.body,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: 1,
                }}
              >
                {subLine}
              </Text>
            </View>
          </View>
        )}

        {/* Kebab menu (owner only) — fixed-size, far right, vertically centered */}
        {isOwner && (
          <Pressable
            onPress={handleOptionsPress}
            hitSlop={8}
            onLayout={(e) => console.log('KEBAB x:', e.nativeEvent.layout.x, 'width:', e.nativeEvent.layout.width)}
            style={{ paddingLeft: 8 }}
          >
            {({ pressed }) => (
              <View style={{ opacity: pressed ? 0.6 : 1 }}>
                <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.55)" />
              </View>
            )}
          </Pressable>
        )}
      </View>

      {/* ── Topic pill — only when post has a topic ── */}
      {post.topic ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            backgroundColor: '#111008',
            borderWidth: 1,
            borderColor: 'rgba(201,168,76,0.22)',
            borderRadius: 100,
            paddingHorizontal: 10,
            paddingVertical: 4,
            marginTop: 8,
            marginBottom: 2,
            gap: 4,
          }}
        >
          {post.topic.icon ? (
            <Ionicons name={post.topic.icon as any} size={12} color="#c9a84c" />
          ) : null}
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: '#c9a84c' }}>
            {post.topic.name}
          </Text>
        </View>
      ) : null}

      {/* ── Content + image — tappable to open post detail ── */}
      <Pressable
        onPress={() => onOpenPost(post)}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <Text
          style={{
            fontFamily: Fonts.body,
            fontSize: 14,
            color: '#FFFFFF',
            lineHeight: 21,
            marginTop: 12,
          }}
        >
          {post.content}
        </Text>

        {/* Post image — shown only when image_url is present (image wins over video) */}
        {post.image_url ? (
          <Image
            source={{ uri: post.image_url }}
            style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 8, marginTop: 12 }}
            resizeMode="cover"
          />
        ) : null}
      </Pressable>

      {/* YouTube preview — sibling to onOpenPost Pressable, not nested inside it.
          Nested Pressables have unreliable precedence on Android; keeping YouTubePreview
          as a sibling means its tap always opens the video while tapping the text above
          still navigates to the post detail screen. Only shown when no uploaded image. */}
      {!post.image_url && videoId ? (
        <YouTubePreview videoId={videoId} size="full" />
      ) : null}

      {/* ── Stats row ── */}
      <View style={{ flexDirection: 'row', gap: 20, marginTop: 12 }}>
        <Pressable
          onPress={() => onToggleLike(post)}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={isLiked ? '#c9a84c' : 'rgba(255,255,255,0.55)'}
          />
          <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
            {post.likes_count}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onOpenComments(post)}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Ionicons name="chatbubble-outline" size={16} color="rgba(255,255,255,0.55)" />
          <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
            {post.comments_count}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
