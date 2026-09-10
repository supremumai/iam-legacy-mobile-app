import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { supabase } from '../lib/supabase';
import { getInitials } from '../lib/avatar';
import { pickAndUploadImage } from '../lib/upload';
import { findFirstYouTubeVideoId } from '../lib/youtube';
import { Fonts } from '../constants/fonts';
import YouTubePreview from './YouTubePreview';

interface PostComposerProps {
  onPostCreated: () => void;
}

// Module-level counter for stable local option keys — never reset so
// keys are globally unique across renders and re-mounts.
let _seq = 0;
const genId = () => `o${++_seq}`;

interface OptionDraft {
  id: string;
  label: string;
}

export default function PostComposer({ onPostCreated }: PostComposerProps) {
  const { user, profile } = useAuth();
  const isAdmin = useIsAdmin();

  // ── Shared state ──────────────────────────────────────────────────────────
  const [composerMode, setComposerMode] = useState<'post' | 'poll'>('post');
  const [topics, setTopics] = useState<Array<{ id: string; name: string; icon: string | null }>>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // ── Post state ────────────────────────────────────────────────────────────
  const [content, setContent] = useState('');
  const [pickedImageUrl, setPickedImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Poll state ────────────────────────────────────────────────────────────
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<OptionDraft[]>([
    { id: genId(), label: '' },
    { id: genId(), label: '' },
  ]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [submittingPoll, setSubmittingPoll] = useState(false);

  // Fetch topics once on mount — fail silently so a missing selector never blocks posting
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('topics')
          .select('id, name, icon')
          .order('sort_order');
        if (data) setTopics(data as Array<{ id: string; name: string; icon: string | null }>);
      } catch {
        // Topic selector is optional — do nothing on fetch failure
      }
    })();
  }, []);

  // ── Post derived state ────────────────────────────────────────────────────
  const trimmed = content.trim();
  const isPostDisabled = trimmed.length === 0 || content.length > 2000 || submitting;
  const initials = getInitials(profile?.full_name, profile?.username);
  const composerVideoId = findFirstYouTubeVideoId(content);

  // ── Poll derived state ────────────────────────────────────────────────────
  // Both instances of a duplicated label are flagged.
  const optionDuplicateIds = (() => {
    const seen = new Map<string, string>(); // normalized label → first option id
    const dupes = new Set<string>();
    for (const o of pollOptions) {
      const norm = o.label.trim().toLowerCase();
      if (!norm) continue;
      if (seen.has(norm)) {
        dupes.add(o.id);
        dupes.add(seen.get(norm)!);
      } else {
        seen.set(norm, o.id);
      }
    }
    return dupes;
  })();

  const questionTrimmed = pollQuestion.trim();
  const filledOptions = pollOptions.filter((o) => o.label.trim().length > 0);
  const isPollValid =
    questionTrimmed.length > 0 &&
    questionTrimmed.length <= 200 &&
    filledOptions.length >= 2 &&
    optionDuplicateIds.size === 0 &&
    pollOptions.every((o) => o.label.length <= 80);

  // ── Post handler ──────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!user) return;
    if (trimmed.length === 0 || trimmed.length > 2000) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .insert({ user_id: user.id, content: trimmed, image_url: pickedImageUrl, topic_id: selectedTopicId });

      if (error) {
        Alert.alert('Could not post', error.message);
        return;
      }

      setContent('');
      setPickedImageUrl(null);
      setSelectedTopicId(null);
      onPostCreated();
    } catch (e: unknown) {
      Alert.alert('Could not post', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Poll handlers ─────────────────────────────────────────────────────────
  const handleAddOption = () => {
    if (pollOptions.length >= 6) return;
    setPollOptions((prev) => [...prev, { id: genId(), label: '' }]);
  };

  const handleRemoveOption = (id: string) => {
    if (pollOptions.length <= 2) return;
    setPollOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const handleOptionChange = (id: string, label: string) => {
    setPollOptions((prev) => prev.map((o) => (o.id === id ? { ...o, label } : o)));
  };

  const resetPollForm = () => {
    setPollQuestion('');
    setPollOptions([{ id: genId(), label: '' }, { id: genId(), label: '' }]);
    setAllowMultiple(false);
    setSelectedTopicId(null);
    setComposerMode('post');
  };

  const handlePollPost = async () => {
    if (!user || !isPollValid) return;
    setSubmittingPoll(true);

    const question = questionTrimmed;
    // Filter empty options and assign sort_order by visual index (0..N-1, no gaps)
    const validOptions = pollOptions
      .filter((o) => o.label.trim().length > 0)
      .map((o, idx) => ({ label: o.label.trim(), sort_order: idx }));

    let postId: string | null = null;

    try {
      // Step 1: Insert post with post_type='poll'
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: question,
          post_type: 'poll',
          topic_id: selectedTopicId,
        } as any)
        .select('id')
        .single();

      if (postError || !postData) throw postError ?? new Error('No post data returned');
      postId = (postData as any).id as string;

      // Step 2: Insert poll — if this fails, delete the post and stop
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .insert({ post_id: postId, question, allow_multiple: allowMultiple })
        .select('id')
        .single();

      if (pollError || !pollData) throw pollError ?? new Error('No poll data returned');
      const pollId = (pollData as any).id as string;

      // Step 3: Bulk insert all options in one insert (not N inserts)
      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(
          validOptions.map((o) => ({ poll_id: pollId, label: o.label, sort_order: o.sort_order })),
        );

      if (optionsError) throw optionsError;

      // Success: reset form and trigger feed refetch (same pattern as text posts)
      resetPollForm();
      onPostCreated();
    } catch (e) {
      // Rollback: deleting the post cascades to polls → poll_options automatically
      if (postId) {
        try { await supabase.from('posts').delete().eq('id', postId); } catch { /* best-effort */ }
      }
      Alert.alert(
        'Could not publish poll',
        e instanceof Error ? e.message : 'Unknown error',
      );
    } finally {
      setSubmittingPoll(false);
    }
  };

  // ── Topic selector (shared between post and poll modes) ───────────────────
  const topicSelector =
    topics.length > 0 ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 10 }}
        contentContainerStyle={{ gap: 8 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* "No Topic" pill */}
        <Pressable
          onPress={() => setSelectedTopicId(null)}
          style={{
            backgroundColor: selectedTopicId === null ? '#c9a84c' : '#1c1a14',
            borderWidth: 1,
            borderColor: selectedTopicId === null ? '#c9a84c' : 'rgba(201,168,76,0.22)',
            borderRadius: 100,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          {({ pressed }) => (
            <View style={{ opacity: pressed ? 0.7 : 1 }}>
              <Text
                style={{
                  fontFamily: Fonts.bodySemiBold,
                  fontSize: 12,
                  color: selectedTopicId === null ? '#0a0900' : '#FFFFFF',
                }}
              >
                No Topic
              </Text>
            </View>
          )}
        </Pressable>

        {topics.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setSelectedTopicId(t.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: selectedTopicId === t.id ? '#c9a84c' : '#1c1a14',
              borderWidth: 1,
              borderColor: selectedTopicId === t.id ? '#c9a84c' : 'rgba(201,168,76,0.22)',
              borderRadius: 100,
              paddingHorizontal: 12,
              paddingVertical: 6,
              gap: 4,
            }}
          >
            {({ pressed }) => (
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: pressed ? 0.7 : 1 }}
              >
                {t.icon ? (
                  <Ionicons
                    name={t.icon as any}
                    size={12}
                    color={selectedTopicId === t.id ? '#0a0900' : '#c9a84c'}
                  />
                ) : null}
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 12,
                    color: selectedTopicId === t.id ? '#0a0900' : '#FFFFFF',
                  }}
                >
                  {t.name}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    ) : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View
      style={{
        backgroundColor: '#1c1a14',
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.22)',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginTop: 16,
      }}
    >
      {/* ── Admin-only segmented control: Post / Poll ── */}
      {isAdmin ? (
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: 2,
            marginBottom: 14,
          }}
        >
          <TouchableOpacity
            onPress={() => setComposerMode('post')}
            activeOpacity={0.8}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: 6,
              alignItems: 'center',
              backgroundColor: composerMode === 'post' ? '#c9a84c' : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: composerMode === 'post' ? '#0a0900' : 'rgba(255,255,255,0.6)',
              }}
            >
              Post
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setComposerMode('poll')}
            activeOpacity={0.8}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: 6,
              alignItems: 'center',
              backgroundColor: composerMode === 'poll' ? '#c9a84c' : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: composerMode === 'poll' ? '#0a0900' : 'rgba(255,255,255,0.6)',
              }}
            >
              Poll
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ════════════════════════════════════════════════════════
          POST MODE — unchanged from original
          ════════════════════════════════════════════════════════ */}
      {composerMode === 'post' ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {/* Avatar */}
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#1c1a14',
                borderWidth: 1,
                borderColor: 'rgba(201,168,76,0.22)',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={{ width: 36, height: 36 }} />
              ) : (
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 12, color: '#FFFFFF' }}>
                  {initials}
                </Text>
              )}
            </View>

            {/* Input */}
            <TextInput
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 15,
                fontFamily: Fonts.body,
                color: '#FFFFFF',
                minHeight: 40,
                textAlignVertical: 'top',
              }}
              multiline
              maxLength={2000}
              value={content}
              onChangeText={setContent}
              placeholder="Share something with the community..."
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
          </View>

          {/* Picked image preview */}
          {pickedImageUrl ? (
            <View style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden' }}>
              <Image
                source={{ uri: pickedImageUrl }}
                style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 8 }}
                resizeMode="cover"
              />
              {/* Clear image button */}
              <Pressable
                onPress={() => setPickedImageUrl(null)}
                hitSlop={8}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close-circle" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : null}

          {/* Live YouTube preview — only when no image attached; image takes priority */}
          {!pickedImageUrl && composerVideoId ? (
            <YouTubePreview videoId={composerVideoId} size="compact" />
          ) : null}

          {/* Topic selector */}
          {topicSelector}

          {content.length > 0 && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text
                  style={{
                    fontFamily: Fonts.body,
                    fontSize: 12,
                    color: content.length > 1900 ? '#EF4444' : 'rgba(255,255,255,0.55)',
                  }}
                >
                  {content.length}/2000
                </Text>

                {/* Image attachment button */}
                <Pressable
                  disabled={uploadingImage}
                  onPress={async () => {
                    if (!user) return;
                    setUploadingImage(true);
                    const result = await pickAndUploadImage(user.id, 'posts', { aspect: [4, 3] });
                    setUploadingImage(false);
                    if ('error' in result) {
                      Alert.alert('Could not attach image', result.error);
                    } else if ('url' in result) {
                      setPickedImageUrl(result.url);
                    }
                    // cancelled: no-op
                  }}
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: pressed || uploadingImage ? 0.5 : 1 })}
                >
                  {uploadingImage ? (
                    <ActivityIndicator color="#c9a84c" size="small" />
                  ) : (
                    <Ionicons name="image-outline" size={20} color="#c9a84c" />
                  )}
                </Pressable>
              </View>

              <Pressable
                onPress={handlePost}
                disabled={isPostDisabled}
                style={{
                  backgroundColor: isPostDisabled ? 'rgba(201,168,76,0.3)' : '#c9a84c',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  minWidth: 60,
                  alignItems: 'center',
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="rgba(10,9,0,0.5)" size="small" />
                ) : (
                  <Text
                    style={{
                      fontFamily: Fonts.bodyBold,
                      fontSize: 13,
                      color: isPostDisabled ? 'rgba(10,9,0,0.5)' : '#0a0900',
                    }}
                  >
                    Post
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </>
      ) : (
        /* ════════════════════════════════════════════════════════
           POLL MODE — admin only
           ════════════════════════════════════════════════════════ */
        <View style={{ gap: 12 }}>
          {/* ── Question input ── */}
          <View>
            <TextInput
              multiline
              maxLength={200}
              value={pollQuestion}
              onChangeText={setPollQuestion}
              placeholder="What's your question?"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={{
                fontSize: 15,
                fontFamily: Fonts.body,
                color: '#FFFFFF',
                minHeight: 48,
                textAlignVertical: 'top',
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderWidth: 1,
                borderColor: 'rgba(201,168,76,0.22)',
                borderRadius: 8,
                padding: 10,
              }}
            />
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 11,
                color: pollQuestion.length > 180 ? '#EF4444' : 'rgba(255,255,255,0.4)',
                textAlign: 'right',
                marginTop: 3,
              }}
            >
              {pollQuestion.length}/200
            </Text>
          </View>

          {/* ── Option inputs ── */}
          {pollOptions.map((opt, idx) => {
            const isDup = optionDuplicateIds.has(opt.id) && opt.label.trim().length > 0;
            return (
              <View key={opt.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    maxLength={80}
                    value={opt.label}
                    onChangeText={(v) => handleOptionChange(opt.id, v)}
                    placeholder={`Option ${idx + 1}`}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontFamily: Fonts.body,
                      color: '#FFFFFF',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderWidth: 1,
                      borderColor: isDup ? '#EF4444' : 'rgba(201,168,76,0.22)',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 9,
                    }}
                  />
                  {/* Delete button — hidden when only 2 options remain */}
                  {pollOptions.length > 2 ? (
                    <TouchableOpacity
                      onPress={() => handleRemoveOption(opt.id)}
                      activeOpacity={0.7}
                      hitSlop={8}
                    >
                      <Ionicons name="close-circle" size={22} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: 22 }} />
                  )}
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: isDup ? 'space-between' : 'flex-end',
                    alignItems: 'center',
                    marginTop: 3,
                  }}
                >
                  {isDup ? (
                    <Text
                      style={{ fontFamily: Fonts.body, fontSize: 11, color: '#EF4444' }}
                    >
                      This option already exists
                    </Text>
                  ) : null}
                  <Text
                    style={{
                      fontFamily: Fonts.body,
                      fontSize: 11,
                      color: opt.label.length > 70 ? '#EF4444' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    {opt.label.length}/80
                  </Text>
                </View>
              </View>
            );
          })}

          {/* ── Add option — hidden at max 6 ── */}
          {pollOptions.length < 6 ? (
            <TouchableOpacity
              onPress={handleAddOption}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                alignSelf: 'flex-start',
                paddingVertical: 2,
              }}
            >
              <Ionicons name="add-circle-outline" size={18} color="#c9a84c" />
              <Text
                style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: '#c9a84c' }}
              >
                Add option
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* ── Allow-multiple toggle ── */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 4,
            }}
          >
            <Text
              style={{ fontFamily: Fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}
            >
              Allow multiple answers
            </Text>
            <Switch
              value={allowMultiple}
              onValueChange={setAllowMultiple}
              thumbColor={allowMultiple ? '#c9a84c' : 'rgba(255,255,255,0.6)'}
              trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(201,168,76,0.45)' }}
            />
          </View>

          {/* ── Topic selector (same component, same behavior) ── */}
          {topicSelector}

          {/* ── Submit ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 2 }}>
            <TouchableOpacity
              onPress={handlePollPost}
              disabled={!isPollValid || submittingPoll}
              activeOpacity={0.8}
              style={{
                backgroundColor:
                  isPollValid && !submittingPoll ? '#c9a84c' : 'rgba(201,168,76,0.3)',
                borderRadius: 8,
                paddingHorizontal: 20,
                paddingVertical: 9,
                minWidth: 80,
                alignItems: 'center',
              }}
            >
              {submittingPoll ? (
                <ActivityIndicator color="rgba(10,9,0,0.5)" size="small" />
              ) : (
                <Text
                  style={{
                    fontFamily: Fonts.bodyBold,
                    fontSize: 13,
                    color: isPollValid ? '#0a0900' : 'rgba(10,9,0,0.45)',
                  }}
                >
                  Publish
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
