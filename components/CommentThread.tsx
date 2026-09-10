import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getInitials } from '../lib/avatar';
import { formatRelativeTime } from '../lib/time';
import { buildCommentThreads } from '../lib/comments';
import { findFirstYouTubeVideoId } from '../lib/youtube';
import { CommentWithAuthor, PostAuthor, ThreadedComment } from '../types/database';
import { Fonts } from '../constants/fonts';
import YouTubePreview from './YouTubePreview';

export interface CommentThreadProps {
  postId: string;
  onCommentCountChange: (postId: string, delta: number) => void;
  /**
   * Optional close callback — only meaningful in a Modal context.
   * The full-screen post detail usage doesn't pass this.
   */
  onRequestClose?: () => void;
  /**
   * When true (default) the component owns its own FlatList scroll — used
   * when embedded in the CommentsSheet modal which provides a fixed-height
   * container. When false, comment items are rendered as plain Views so the
   * parent ScrollView handles scrolling — used on the full-screen post detail
   * screen where PostCard + comments + composer all scroll together.
   */
  scrollable?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeAuthor(raw: any): PostAuthor | null {
  const authorRaw = Array.isArray(raw.profiles)
    ? (raw.profiles[0] ?? null)
    : (raw.profiles ?? null);
  if (!authorRaw) return null;
  return {
    id: authorRaw.id,
    full_name: authorRaw.full_name ?? null,
    username: authorRaw.username ?? null,
    avatar_url: authorRaw.avatar_url ?? null,
  };
}

function resolveDisplayName(author: PostAuthor | null): string {
  return author?.full_name ?? (author?.username ? `@${author.username}` : 'Legacy Member');
}

const COMMENT_COLS =
  'id, post_id, user_id, parent_id, content, created_at, profiles(id, full_name, username, avatar_url)';

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  author: PostAuthor | null;
  size: number;
}

function CommentAvatar({ author, size }: AvatarProps) {
  const initials = getInitials(author?.full_name, author?.username);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
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
        <Image source={{ uri: author.avatar_url }} style={{ width: size, height: size }} />
      ) : (
        <Text
          style={{
            fontFamily: Fonts.bodyBold,
            fontSize: size <= 22 ? 8 : 10,
            color: '#FFFFFF',
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

// ─── Single comment row ───────────────────────────────────────────────────────

interface CommentRowProps {
  comment: CommentWithAuthor;
  isReply: boolean;
  currentUserId: string | undefined;
  onReply: (c: CommentWithAuthor) => void;
  onDelete: (c: CommentWithAuthor) => void;
}

function CommentRow({ comment, isReply, currentUserId, onReply, onDelete }: CommentRowProps) {
  const isOwner = comment.user_id === currentUserId;
  const authorName = resolveDisplayName(comment.author);
  const avatarSize = isReply ? 22 : 28;
  const commentVideoId = findFirstYouTubeVideoId(comment.content);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
      }}
    >
      <CommentAvatar author={comment.author} size={avatarSize} />

      <View style={{ flex: 1, marginLeft: 10 }}>
        {/* Name + time + delete */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: isReply ? 12 : 13,
              color: '#FFFFFF',
            }}
          >
            {authorName}
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: isReply ? 11 : 12,
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              {' · '}
              {formatRelativeTime(comment.created_at)}
            </Text>
          </Text>
          {isOwner && (
            <Pressable
              onPress={() => onDelete(comment)}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name="trash-outline" size={15} color="rgba(255,255,255,0.55)" />
            </Pressable>
          )}
        </View>

        {/* Content */}
        <Text
          style={{
            fontFamily: Fonts.body,
            fontSize: isReply ? 13 : 14,
            color: '#FFFFFF',
            lineHeight: isReply ? 18 : 20,
            marginTop: 2,
          }}
        >
          {comment.content}
        </Text>

        {/* YouTube preview — compact, sits within the comment's flex:1 block so
            replies are automatically indented at the same level as the text */}
        {commentVideoId ? (
          <YouTubePreview videoId={commentVideoId} size="compact" />
        ) : null}

        {/* Reply button */}
        <Pressable
          onPress={() => onReply(comment)}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start', marginTop: 4 })}
        >
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 12,
              color: '#c9a84c',
            }}
          >
            Reply
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Threaded item (top-level + its replies) ──────────────────────────────────

interface ThreadedItemProps {
  thread: ThreadedComment;
  currentUserId: string | undefined;
  onReply: (c: CommentWithAuthor) => void;
  onDelete: (c: CommentWithAuthor) => void;
}

function ThreadedItem({ thread, currentUserId, onReply, onDelete }: ThreadedItemProps) {
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(201,168,76,0.08)',
      }}
    >
      {/* Top-level comment */}
      <CommentRow
        comment={thread}
        isReply={false}
        currentUserId={currentUserId}
        onReply={onReply}
        onDelete={onDelete}
      />

      {/* Replies block */}
      {thread.replies.length > 0 && (
        <View
          style={{
            marginLeft: 36,
            borderLeftWidth: 1,
            borderLeftColor: 'rgba(201,168,76,0.12)',
            paddingLeft: 12,
            marginBottom: 8,
          }}
        >
          {thread.replies.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              isReply={true}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Composer + reply bar (shared between both scroll modes) ──────────────────

interface ComposerProps {
  replyingTo: CommentWithAuthor | null;
  onClearReply: () => void;
  inputText: string;
  onChangeText: (t: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  inputRef: React.RefObject<TextInput | null>;
}

function ComposerSection({
  replyingTo,
  onClearReply,
  inputText,
  onChangeText,
  onSubmit,
  canSubmit,
  inputRef,
}: ComposerProps) {
  const inputVideoId = findFirstYouTubeVideoId(inputText);

  return (
    <>
      {/* Reply context bar */}
      {replyingTo ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 8,
            backgroundColor: '#111008',
            borderTopWidth: 1,
            borderTopColor: 'rgba(201,168,76,0.12)',
          }}
        >
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 12,
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            Replying to {resolveDisplayName(replyingTo.author)}
          </Text>
          <Pressable
            onPress={onClearReply}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="close" size={16} color="rgba(255,255,255,0.55)" />
          </Pressable>
        </View>
      ) : null}

      {/* Live YouTube preview — shown while typing a comment that contains a link */}
      {inputVideoId ? (
        <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
          <YouTubePreview videoId={inputVideoId} size="compact" />
        </View>
      ) : null}

      {/* Composer footer */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: 'rgba(201,168,76,0.12)',
        }}
      >
        <TextInput
          ref={inputRef}
          style={{
            flex: 1,
            fontFamily: Fonts.body,
            fontSize: 14,
            color: '#FFFFFF',
            backgroundColor: 'transparent',
            maxHeight: 96,
          }}
          placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={inputText}
          onChangeText={onChangeText}
          multiline
          maxLength={2000}
          returnKeyType="default"
        />
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          hitSlop={8}
          style={{ marginLeft: 12 }}
        >
          <Ionicons
            name="arrow-up-circle"
            size={28}
            color={canSubmit ? '#c9a84c' : 'rgba(201,168,76,0.3)'}
          />
        </Pressable>
      </View>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CommentThread({
  postId,
  onCommentCountChange,
  onRequestClose: _onRequestClose,
  scrollable = true,
}: CommentThreadProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommentWithAuthor | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Fetch comments on mount and whenever postId changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setComments([]);

    (async () => {
      try {
        const { data, error } = await supabase
          .from('post_comments')
          .select(COMMENT_COLS)
          .eq('post_id', postId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) {
          console.warn('[CommentThread] fetch error:', error.message);
          return;
        }

        if (!cancelled) {
          const normalized: CommentWithAuthor[] = (data ?? []).map((raw: any) => ({
            id: raw.id,
            post_id: raw.post_id,
            user_id: raw.user_id,
            parent_id: raw.parent_id ?? null,
            content: raw.content,
            created_at: raw.created_at,
            author: normalizeAuthor(raw),
          }));
          setComments(normalized);
        }
      } catch (e) {
        console.warn('[CommentThread] fetch threw:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const handleReply = (comment: CommentWithAuthor) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!user?.id || submitting) return;
    const trimmed = inputText.trim();
    if (!trimmed || trimmed.length > 2000) return;

    // Depth cap: replying to a reply attaches to the grandparent
    const parentId = replyingTo
      ? (replyingTo.parent_id ?? replyingTo.id)
      : null;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: trimmed,
          parent_id: parentId,
        })
        .select(COMMENT_COLS)
        .single();

      if (error) {
        Alert.alert('Could not comment', error.message);
        return;
      }

      const newComment: CommentWithAuthor = {
        id: data.id,
        post_id: data.post_id,
        user_id: data.user_id,
        parent_id: data.parent_id ?? null,
        content: data.content,
        created_at: data.created_at,
        author: normalizeAuthor(data),
      };

      setComments((prev) => [...prev, newComment]);
      setInputText('');
      setReplyingTo(null);
      onCommentCountChange(postId, 1);
    } catch (e: unknown) {
      Alert.alert('Could not comment', e instanceof Error ? e.message : 'Unknown error');
      // Keep replyingTo so the user doesn't lose their reply target
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (comment: CommentWithAuthor) => {
    // Count replies that would cascade-delete with a top-level comment
    const repliesCount =
      comment.parent_id === null
        ? comments.filter((c) => c.parent_id === comment.id).length
        : 0;

    const alertMessage =
      repliesCount > 0
        ? `This will also delete ${repliesCount} ${repliesCount === 1 ? 'reply' : 'replies'}. This can't be undone.`
        : "This can't be undone.";

    Alert.alert('Delete Comment', alertMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('post_comments')
              .delete()
              .eq('id', comment.id);

            if (error) {
              Alert.alert('Could not delete', error.message);
              return;
            }

            if (repliesCount > 0) {
              // Remove parent AND all its replies from local flat list
              setComments((prev) =>
                prev.filter((c) => c.id !== comment.id && c.parent_id !== comment.id),
              );
              onCommentCountChange(postId, -(1 + repliesCount));
            } else {
              setComments((prev) => prev.filter((c) => c.id !== comment.id));
              onCommentCountChange(postId, -1);
            }

            // If we were replying to the deleted comment, clear that state
            if (replyingTo?.id === comment.id || replyingTo?.parent_id === comment.id) {
              setReplyingTo(null);
            }
          } catch (e: unknown) {
            Alert.alert('Could not delete', e instanceof Error ? e.message : 'Unknown error');
          }
        },
      },
    ]);
  };

  const threads = buildCommentThreads(comments);
  const canSubmit = inputText.trim().length > 0 && !submitting;

  const composerProps: ComposerProps = {
    replyingTo,
    onClearReply: () => setReplyingTo(null),
    inputText,
    onChangeText: setInputText,
    onSubmit: handleSubmit,
    canSubmit,
    inputRef,
  };

  // ── scrollable=true: FlatList owns scroll (modal context) ─────────────────
  if (scrollable) {
    return (
      <View style={{ flex: 1 }}>
        {loading && comments.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#c9a84c" size="large" />
          </View>
        ) : (
          <FlatList<ThreadedComment>
            data={threads}
            keyExtractor={(t) => t.id}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 4,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text
                  style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#FFFFFF' }}
                >
                  No comments yet
                </Text>
                <Text
                  style={{
                    fontFamily: Fonts.body,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.55)',
                    marginTop: 4,
                  }}
                >
                  Be the first to comment.
                </Text>
              </View>
            }
            renderItem={({ item: thread }) => (
              <ThreadedItem
                thread={thread}
                currentUserId={user?.id}
                onReply={handleReply}
                onDelete={handleDeleteComment}
              />
            )}
          />
        )}
        <ComposerSection {...composerProps} />
      </View>
    );
  }

  // ── scrollable=false: plain Views, parent ScrollView handles scroll ─────────
  return (
    <View>
      {/* Section header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 12,
          borderTopWidth: 1,
          borderTopColor: 'rgba(201,168,76,0.12)',
        }}
      >
        <Text style={{ fontFamily: Fonts.heading, fontSize: 18, color: '#c9a84c' }}>
          Comments
        </Text>
      </View>

      {loading && comments.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <ActivityIndicator color="#c9a84c" size="large" />
        </View>
      ) : threads.length === 0 ? (
        <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingVertical: 32 }}>
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#FFFFFF' }}>
            No comments yet
          </Text>
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              marginTop: 4,
            }}
          >
            Be the first to comment.
          </Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20 }}>
          {threads.map((thread) => (
            <ThreadedItem
              key={thread.id}
              thread={thread}
              currentUserId={user?.id}
              onReply={handleReply}
              onDelete={handleDeleteComment}
            />
          ))}
        </View>
      )}

      <ComposerSection {...composerProps} />

      {/* Bottom breathing room */}
      <View style={{ height: 32 }} />
    </View>
  );
}
