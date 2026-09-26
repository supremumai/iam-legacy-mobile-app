import { View, Text, Pressable, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { getInitials } from '../lib/avatar';
import { formatRelativeTime } from '../lib/time';
import { findFirstYouTubeVideoId } from '../lib/youtube';
import { PostWithAuthor } from '../types/database';
import { Fonts } from '../constants/fonts';
import { useColors } from '../contexts/ThemeContext';
import YouTubePreview from './YouTubePreview';
import { useLanguage } from '../contexts/LanguageContext';

interface PostCardProps {
  post: PostWithAuthor;
  currentUserId: string | undefined;
  onDeleted: (postId: string) => void;
  isLiked: boolean;
  onToggleLike: (post: PostWithAuthor) => void;
  onOpenComments: (post: PostWithAuthor) => void;
  onOpenPost: (post: PostWithAuthor) => void;
  onEditPost: (post: PostWithAuthor) => void;
  /** Whether this post is saved by the current user. Default: false. */
  isSaved?: boolean;
  /** Called when the user taps the bookmark icon. Parent manages optimistic state. */
  onToggleSave?: (post: PostWithAuthor) => void;
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
  isSaved = false,
  onToggleSave,
}: PostCardProps) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const colors = useColors();
  const isOwner = post.user_id === currentUserId;
  const author = post.author;

  const initials = getInitials(author?.full_name);

  const displayName = author?.full_name ?? 'Legacy Member';

  const editedSuffix = post.updated_at ? t('community.edited_suffix') : '';
  const subLine = `${formatRelativeTime(post.created_at, locale)}${editedSuffix}`;
  const videoId = findFirstYouTubeVideoId(post.content);

  // ─── Two-step delete: confirm then delete ──────────────────────────────────
  const handleDeletePress = () => {
    Alert.alert(
      t('community.delete_post'),
      t('community.delete_confirm_body'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('events.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', post.id);

              if (error) {
                Alert.alert(t('community.could_not_delete_post'), error.message);
                return;
              }

              onDeleted(post.id);
            } catch (e: unknown) {
              Alert.alert(
                t('community.could_not_delete_post'),
                e instanceof Error ? e.message : t('common.unknown_error'),
              );
            }
          },
        },
      ],
    );
  };

  // ─── Kebab menu ───────────────────────────────────────────────────────────
  const handleOptionsPress = () => {
    Alert.alert(t('community.post_options'), undefined, [
      { text: t('community.edit_post'), onPress: () => onEditPost(post) },
      { text: t('community.delete_post'), style: 'destructive', onPress: handleDeletePress },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
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
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {author.avatar_url ? (
                    <Image source={{ uri: author.avatar_url }} style={{ width: 40, height: 40 }} />
                  ) : (
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: colors.textPrimary }}>
                      {initials}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary }}>
                    {displayName}
                  </Text>
                  <Text
                    style={{
                      fontFamily: Fonts.body,
                      fontSize: 12,
                      color: colors.textMuted,
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
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {author?.avatar_url ? (
                <Image source={{ uri: author.avatar_url }} style={{ width: 40, height: 40 }} />
              ) : (
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: colors.textPrimary }}>
                  {initials}
                </Text>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary }}>
                {displayName}
              </Text>
              <Text
                style={{
                  fontFamily: Fonts.body,
                  fontSize: 12,
                  color: colors.textMuted,
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
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
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
            backgroundColor: colors.surfaceAlt,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 100,
            paddingHorizontal: 10,
            paddingVertical: 4,
            marginTop: 8,
            marginBottom: 2,
            gap: 4,
          }}
        >
          {post.topic.icon ? (
            <Ionicons name={post.topic.icon as any} size={12} color={colors.gold} />
          ) : null}
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: colors.gold }}>
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
            color: colors.textPrimary,
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

      {/* ── Stats row: like + comment left, bookmark right ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
        }}
      >
        {/* Left group: like + comment */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <Pressable
            onPress={() => onToggleLike(post)}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={16}
              color={isLiked ? colors.gold : colors.textMuted}
            />
            <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textMuted }}>
              {post.likes_count}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onOpenComments(post)}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
            <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textMuted }}>
              {post.comments_count}
            </Text>
          </Pressable>
        </View>

        {/* Bookmark — static-style TouchableOpacity (bug-recurrence rule) */}
        <TouchableOpacity
          onPress={() => onToggleSave?.(post)}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={17}
            color={isSaved ? colors.gold : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
