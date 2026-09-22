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
import { supabase } from '../lib/supabase';
import { getInitials } from '../lib/avatar';
import { pickAndUploadImage } from '../lib/upload';
import { findFirstYouTubeVideoId } from '../lib/youtube';
import { Fonts } from '../constants/fonts';
import { useColors } from '../contexts/ThemeContext';
import YouTubePreview from './YouTubePreview';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t } = useLanguage();
  const colors = useColors();

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
        Alert.alert(t('composer.could_not_post'), error.message);
        return;
      }

      setContent('');
      setPickedImageUrl(null);
      setSelectedTopicId(null);
      onPostCreated();
    } catch (e: unknown) {
      Alert.alert(t('composer.could_not_post'), e instanceof Error ? e.message : t('common.unknown_error'));
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
        t('composer.could_not_publish_poll'),
        e instanceof Error ? e.message : t('common.unknown_error'),
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
            backgroundColor: selectedTopicId === null ? colors.gold : colors.surface,
            borderWidth: 1,
            borderColor: selectedTopicId === null ? colors.gold : colors.border,
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
                  color: selectedTopicId === null ? colors.background : colors.textPrimary,
                }}
              >
                {t('composer.no_topic')}
              </Text>
            </View>
          )}
        </Pressable>

        {topics.map((topic) => (
          <Pressable
            key={topic.id}
            onPress={() => setSelectedTopicId(topic.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: selectedTopicId === topic.id ? colors.gold : colors.surface,
              borderWidth: 1,
              borderColor: selectedTopicId === topic.id ? colors.gold : colors.border,
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
                {topic.icon ? (
                  <Ionicons
                    name={topic.icon as any}
                    size={12}
                    color={selectedTopicId === topic.id ? colors.background : colors.gold}
                  />
                ) : null}
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 12,
                    color: selectedTopicId === topic.id ? colors.background : colors.textPrimary,
                  }}
                >
                  {topic.name}
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
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginTop: 16,
      }}
    >
      {/* ── Segmented control: Post / Poll ── */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.whiteOverlay10,
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
            backgroundColor: composerMode === 'post' ? colors.gold : 'transparent',
          }}
        >
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 13,
              color: composerMode === 'post' ? colors.background : colors.textSecondary,
            }}
          >
            {t('composer.tab_post')}
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
            backgroundColor: composerMode === 'poll' ? colors.gold : 'transparent',
          }}
        >
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 13,
              color: composerMode === 'poll' ? colors.background : colors.textSecondary,
            }}
          >
            {t('composer.tab_poll')}
          </Text>
        </TouchableOpacity>
      </View>

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
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={{ width: 36, height: 36 }} />
              ) : (
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 12, color: colors.textPrimary }}>
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
                color: colors.textPrimary,
                minHeight: 40,
                textAlignVertical: 'top',
              }}
              multiline
              maxLength={2000}
              value={content}
              onChangeText={setContent}
              placeholder={t('composer.post_placeholder')}
              placeholderTextColor={colors.textTertiary}
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
                  backgroundColor: colors.overlay,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close-circle" size={22} color={colors.textPrimary} />
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
                    color: content.length > 1900 ? colors.error : colors.textMuted,
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
                      Alert.alert(t('composer.could_not_attach_image'), result.error);
                    } else if ('url' in result) {
                      setPickedImageUrl(result.url);
                    }
                    // cancelled: no-op
                  }}
                  hitSlop={8}
                  style={({ pressed }) => ({ opacity: pressed || uploadingImage ? 0.5 : 1 })}
                >
                  {uploadingImage ? (
                    <ActivityIndicator color={colors.gold} size="small" />
                  ) : (
                    <Ionicons name="image-outline" size={20} color={colors.gold} />
                  )}
                </Pressable>
              </View>

              <Pressable
                onPress={handlePost}
                disabled={isPostDisabled}
                style={{
                  backgroundColor: isPostDisabled ? colors.borderStrong : colors.gold,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  minWidth: 60,
                  alignItems: 'center',
                }}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.overlay} size="small" />
                ) : (
                  <Text
                    style={{
                      fontFamily: Fonts.bodyBold,
                      fontSize: 13,
                      color: isPostDisabled ? colors.overlay : colors.background,
                    }}
                  >
                    {t('composer.submit_post')}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </>
      ) : (
        /* ════════════════════════════════════════════════════════
           POLL MODE
           ════════════════════════════════════════════════════════ */
        <View style={{ gap: 12 }}>
          {/* ── Question input ── */}
          <View>
            <TextInput
              multiline
              maxLength={200}
              value={pollQuestion}
              onChangeText={setPollQuestion}
              placeholder={t('composer.poll_question_placeholder')}
              placeholderTextColor={colors.textTertiary}
              style={{
                fontSize: 15,
                fontFamily: Fonts.body,
                color: colors.textPrimary,
                minHeight: 48,
                textAlignVertical: 'top',
                backgroundColor: colors.whiteOverlay4,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 10,
              }}
            />
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 11,
                color: pollQuestion.length > 180 ? colors.error : colors.textTertiary,
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
                    placeholder={t('composer.option_placeholder', { number: idx + 1 })}
                    placeholderTextColor={colors.textFaint}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontFamily: Fonts.body,
                      color: colors.textPrimary,
                      backgroundColor: colors.whiteOverlay4,
                      borderWidth: 1,
                      borderColor: isDup ? colors.error : colors.border,
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
                      <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
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
                      style={{ fontFamily: Fonts.body, fontSize: 11, color: colors.error }}
                    >
                      {t('composer.option_duplicate_error')}
                    </Text>
                  ) : null}
                  <Text
                    style={{
                      fontFamily: Fonts.body,
                      fontSize: 11,
                      color: opt.label.length > 70 ? colors.error : colors.textFaint,
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
              <Ionicons name="add-circle-outline" size={18} color={colors.gold} />
              <Text
                style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: colors.gold }}
              >
                {t('composer.add_option')}
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
              style={{ fontFamily: Fonts.body, fontSize: 14, color: colors.textPrimary }}
            >
              {t('composer.allow_multiple')}
            </Text>
            <Switch
              value={allowMultiple}
              onValueChange={setAllowMultiple}
              thumbColor={allowMultiple ? colors.gold : colors.textSecondary}
              trackColor={{ false: colors.textFaint, true: colors.borderStrong }}
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
                  isPollValid && !submittingPoll ? colors.gold : colors.borderStrong,
                borderRadius: 8,
                paddingHorizontal: 20,
                paddingVertical: 9,
                minWidth: 80,
                alignItems: 'center',
              }}
            >
              {submittingPoll ? (
                <ActivityIndicator color={colors.overlay} size="small" />
              ) : (
                <Text
                  style={{
                    fontFamily: Fonts.bodyBold,
                    fontSize: 13,
                    color: isPollValid ? colors.background : colors.overlay,
                  }}
                >
                  {t('composer.submit_poll')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
