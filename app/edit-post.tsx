import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { fetchPostById } from '../lib/posts';
import { pickAndUploadImage } from '../lib/upload';
import { findFirstYouTubeVideoId } from '../lib/youtube';
import { PostWithAuthor, Topic } from '../types/database';
import { Fonts } from '../constants/fonts';
import YouTubePreview from '../components/YouTubePreview';

export default function EditPostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  // Editable field state — initialized from post on load
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Topic selector — optional; prefilled from the post's current topic_id
  const [topics, setTopics] = useState<Array<Pick<Topic, 'id' | 'name' | 'icon'>>>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Fetch topics once on mount — fail silently so a missing selector never blocks saving
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('topics')
          .select('id, name, icon')
          .order('sort_order');
        if (data) setTopics(data as Array<Pick<Topic, 'id' | 'name' | 'icon'>>);
      } catch {
        // Topic selector is optional — do nothing on fetch failure
      }
    })();
  }, []);

  // ─── Fetch post on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!id) {
      setLoadingPost(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingPost(true);
      setLoadError(null);

      try {
        const { post: fetched, error } = await fetchPostById(id);

        if (cancelled) return;

        if (error) {
          setLoadError(error);
          return;
        }

        if (!fetched) {
          setLoadError('This post is no longer available.');
          return;
        }

        // Defense in depth: block the form if the current user isn't the owner
        if (fetched.user_id !== user?.id) {
          setUnauthorized(true);
          return;
        }

        setPost(fetched);
        setContent(fetched.content);
        setImageUrl(fetched.image_url);
        setSelectedTopicId(fetched.topic_id);
      } catch (e) {
        if (!cancelled) {
          setLoadError('Could not load this post.');
        }
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  // ─── Derived state ────────────────────────────────────────────────────────
  const trimmedContent = content.trim();
  const editVideoId = findFirstYouTubeVideoId(content);
  const canSave =
    trimmedContent.length > 0 &&
    trimmedContent.length <= 2000 &&
    !uploadingImage &&
    !submitting;

  // ─── Image picker ─────────────────────────────────────────────────────────
  const handlePickImage = async () => {
    if (!user?.id || uploadingImage) return;
    setUploadingImage(true);
    try {
      const result = await pickAndUploadImage(user.id, 'posts', { aspect: [4, 3] });
      if ('error' in result) {
        Alert.alert('Could not attach image', result.error);
      } else if ('url' in result) {
        setImageUrl(result.url);
      }
      // cancelled: no-op
    } finally {
      setUploadingImage(false);
    }
  };

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!post || !canSave) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content: trimmedContent,
          image_url: imageUrl,
          topic_id: selectedTopicId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (error) {
        Alert.alert('Could not update post', error.message);
        return;
      }

      // useFocusEffect in community.tsx and post.tsx will pick up fresh data
      router.back();
    } catch (e: unknown) {
      Alert.alert(
        'Could not update post',
        e instanceof Error ? e.message : 'Unknown error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Top bar (shared across all states) ──────────────────────────────────
  const topBar = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
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
        <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );

  // ─── Loading state ───────────────────────────────────────────────────────
  if (loadingPost) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
        {topBar}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#c9a84c" size="large" />
        </View>
      </View>
    );
  }

  // ─── Load error state ────────────────────────────────────────────────────
  if (loadError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
        {topBar}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 15,
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            {loadError}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              marginTop: 20,
              backgroundColor: '#c9a84c',
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: '#0a0900' }}>
              Go back
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Unauthorized state ──────────────────────────────────────────────────
  if (unauthorized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
        {topBar}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 15,
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            You don't have access to edit this post.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              marginTop: 20,
              backgroundColor: '#c9a84c',
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: '#0a0900' }}>
              Go back
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Edit form ───────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
      {topBar}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
        >
          {/* Header */}
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 24,
              color: '#c9a84c',
              marginBottom: 24,
            }}
          >
            Edit Post
          </Text>

          {/* Content textarea */}
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              marginBottom: 8,
            }}
          >
            Content
          </Text>
          <View
            style={{
              backgroundColor: '#1c1a14',
              borderWidth: 1,
              borderColor: 'rgba(201,168,76,0.22)',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="What's on your mind?"
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              maxLength={2000}
              textAlignVertical="top"
              style={{
                fontFamily: Fonts.body,
                fontSize: 15,
                color: '#FFFFFF',
                minHeight: 120,
              }}
            />
          </View>
          {/* Character counter */}
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 12,
              color: content.length > 1900 ? '#EF4444' : 'rgba(255,255,255,0.4)',
              textAlign: 'right',
              marginTop: 4,
            }}
          >
            {content.length}/2000
          </Text>

          {/* Live YouTube preview — shown when content contains a link and no image is attached */}
          {!imageUrl && editVideoId ? (
            <YouTubePreview videoId={editVideoId} size="compact" />
          ) : null}

          {/* Topic selector — horizontal pill row; "No Topic" resets to null */}
          {topics.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 16 }}
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
          ) : null}

          {/* Image section */}
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              marginTop: 20,
              marginBottom: 8,
            }}
          >
            Photo
          </Text>

          {imageUrl ? (
            // Image preview + change/remove controls
            <View>
              <View style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 8 }}
                  resizeMode="cover"
                />
                {/* Upload-in-progress overlay */}
                {uploadingImage && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      borderRadius: 8,
                    }}
                  >
                    <ActivityIndicator color="#c9a84c" size="large" />
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', marginTop: 10, gap: 16 }}>
                <Pressable
                  onPress={handlePickImage}
                  disabled={uploadingImage}
                  style={({ pressed }) => ({ opacity: pressed || uploadingImage ? 0.5 : 1 })}
                >
                  <Text
                    style={{
                      fontFamily: Fonts.bodySemiBold,
                      fontSize: 13,
                      color: '#c9a84c',
                    }}
                  >
                    Change Photo
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setImageUrl(null)}
                  disabled={uploadingImage}
                  style={({ pressed }) => ({ opacity: pressed || uploadingImage ? 0.5 : 1 })}
                >
                  <Text
                    style={{
                      fontFamily: Fonts.bodySemiBold,
                      fontSize: 13,
                      color: '#EF4444',
                    }}
                  >
                    Remove Photo
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            // No image — "Add Photo" button
            <View>
              {uploadingImage ? (
                <View style={{ alignItems: 'flex-start' }}>
                  <ActivityIndicator color="#c9a84c" size="small" />
                </View>
              ) : (
                <Pressable
                  onPress={handlePickImage}
                  disabled={uploadingImage}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Ionicons name="image-outline" size={20} color="#c9a84c" />
                  <Text
                    style={{
                      fontFamily: Fonts.bodySemiBold,
                      fontSize: 13,
                      color: '#c9a84c',
                    }}
                  >
                    Add Photo
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={{
              marginTop: 24,
              marginBottom: 8,
              backgroundColor: canSave ? '#c9a84c' : 'rgba(201,168,76,0.3)',
              borderRadius: 8,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            {({ pressed }) =>
              submitting ? (
                <ActivityIndicator color="#0a0900" size="small" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={canSave ? '#0a0900' : 'rgba(10,9,0,0.5)'}
                    style={{ marginRight: 6, opacity: pressed && canSave ? 0.85 : 1 }}
                  />
                  <Text
                    style={{
                      fontFamily: Fonts.bodyBold,
                      fontSize: 15,
                      color: canSave ? '#0a0900' : 'rgba(10,9,0,0.5)',
                      opacity: pressed && canSave ? 0.85 : 1,
                    }}
                  >
                    Save Changes
                  </Text>
                </View>
              )
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
