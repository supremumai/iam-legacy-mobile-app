import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Topic } from '../types/database';
import { Fonts } from '../constants/fonts';
import {
  extractYouTubeVideoId,
  youTubeThumbnailUrl,
  youTubeWatchUrl,
} from '../lib/youtube';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface Props {
  visible: boolean;
  onClose: () => void;
  onResourceAdded: () => void;
}

type TopicPill = Pick<Topic, 'id' | 'name' | 'icon'>;

export default function AddResourceModal({ visible, onClose, onResourceAdded }: Props) {
  const { user } = useAuth();

  const [topics, setTopics] = useState<TopicPill[]>([]);
  const [topicsLoaded, setTopicsLoaded] = useState(false);

  const [urlInput, setUrlInput] = useState('');
  const [title, setTitle] = useState('');
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const parsedVideoId = extractYouTubeVideoId(urlInput);
  const urlTouched = urlInput.length > 0;
  const canSubmit =
    parsedVideoId !== null &&
    title.trim().length > 0 &&
    selectedTopicId !== null &&
    !submitting;

  useEffect(() => {
    if (!visible || topicsLoaded) return;
    supabase
      .from('topics')
      .select('id, name, icon')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setTopics((data ?? []) as TopicPill[]);
        setTopicsLoaded(true);
      });
  }, [visible, topicsLoaded]);

  function resetFields() {
    setUrlInput('');
    setTitle('');
    setChannelName('');
    setDescription('');
    setSelectedTopicId(null);
  }

  function handleClose() {
    resetFields();
    onClose();
  }

  async function handleSubmit() {
    if (!user || !canSubmit) return;
    const videoId = extractYouTubeVideoId(urlInput);
    if (!videoId) return;

    setSubmitting(true);
    const { error } = await supabase.from('resources').insert({
      submitted_by: user.id,
      topic_id: selectedTopicId,
      title: title.trim(),
      description: description.trim() || null,
      youtube_url: youTubeWatchUrl(videoId),
      youtube_video_id: videoId,
      thumbnail_url: youTubeThumbnailUrl(videoId),
      channel_name: channelName.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      if (error.code === '23505') {
        Alert.alert('Already added', 'This video is already in that topic.');
      } else {
        Alert.alert('Could not share', error.message);
      }
      return;
    }

    resetFields();
    onResourceAdded();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.65)',
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View
            style={{
              backgroundColor: '#111008',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: SCREEN_HEIGHT * 0.9,
            }}
          >
            {/* Handle bar */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }}
              />
            </View>

            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(201,168,76,0.12)',
              }}
            >
              <Text
                style={{
                  fontFamily: Fonts.heading,
                  fontSize: 18,
                  color: '#c9a84c',
                }}
              >
                Share a Video
              </Text>
              <Pressable
                onPress={handleClose}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.55)" />
              </Pressable>
            </View>

            <ScrollView
              style={{ flex: 0 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* YouTube URL */}
              <View style={{ marginTop: 20 }}>
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.55)',
                    marginBottom: 8,
                  }}
                >
                  YouTube URL *
                </Text>
                <TextInput
                  value={urlInput}
                  onChangeText={setUrlInput}
                  placeholder="Paste a YouTube link..."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  autoCapitalize="none"
                  keyboardType="url"
                  style={{
                    backgroundColor: '#1c1a14',
                    borderWidth: 1,
                    borderColor: 'rgba(201,168,76,0.22)',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: '#FFFFFF',
                    fontFamily: Fonts.body,
                    fontSize: 14,
                  }}
                />
                {urlTouched && parsedVideoId ? (
                  <View>
                    <Image
                      source={{ uri: youTubeThumbnailUrl(parsedVideoId) }}
                      style={{
                        width: '100%',
                        aspectRatio: 16 / 9,
                        borderRadius: 8,
                        marginTop: 8,
                        backgroundColor: '#1c1a14',
                      }}
                      resizeMode="cover"
                    />
                    <Text
                      style={{
                        fontFamily: Fonts.body,
                        fontSize: 12,
                        color: '#16A34A',
                        marginTop: 4,
                      }}
                    >
                      Valid YouTube link
                    </Text>
                  </View>
                ) : urlTouched && !parsedVideoId ? (
                  <Text
                    style={{
                      fontFamily: Fonts.body,
                      fontSize: 12,
                      color: '#EF4444',
                      marginTop: 4,
                    }}
                  >
                    Enter a valid YouTube link
                  </Text>
                ) : null}
              </View>

              {/* Title */}
              <View style={{ marginTop: 16 }}>
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.55)',
                    marginBottom: 8,
                  }}
                >
                  Title *
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Video title"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  maxLength={200}
                  style={{
                    backgroundColor: '#1c1a14',
                    borderWidth: 1,
                    borderColor: 'rgba(201,168,76,0.22)',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: '#FFFFFF',
                    fontFamily: Fonts.body,
                    fontSize: 14,
                  }}
                />
              </View>

              {/* Channel name */}
              <View style={{ marginTop: 16 }}>
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.55)',
                    marginBottom: 8,
                  }}
                >
                  Channel Name
                </Text>
                <TextInput
                  value={channelName}
                  onChangeText={setChannelName}
                  placeholder="Channel name (optional)"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  style={{
                    backgroundColor: '#1c1a14',
                    borderWidth: 1,
                    borderColor: 'rgba(201,168,76,0.22)',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: '#FFFFFF',
                    fontFamily: Fonts.body,
                    fontSize: 14,
                  }}
                />
              </View>

              {/* Description */}
              <View style={{ marginTop: 16 }}>
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.55)',
                    marginBottom: 8,
                  }}
                >
                  Description
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Why is this worth watching? (optional)"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  multiline
                  maxLength={2000}
                  style={{
                    backgroundColor: '#1c1a14',
                    borderWidth: 1,
                    borderColor: 'rgba(201,168,76,0.22)',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: '#FFFFFF',
                    fontFamily: Fonts.body,
                    fontSize: 14,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                />
              </View>

              {/* Topic picker */}
              <View style={{ marginTop: 16 }}>
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.55)',
                    marginBottom: 8,
                  }}
                >
                  Topic *
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {topics.map((topic) => {
                    const selected = selectedTopicId === topic.id;
                    return (
                      <Pressable
                        key={topic.id}
                        onPress={() => setSelectedTopicId(topic.id)}
                        style={{
                          backgroundColor: selected ? '#c9a84c' : '#1c1a14',
                          borderWidth: selected ? 0 : 1,
                          borderColor: 'rgba(201,168,76,0.22)',
                          borderRadius: 999,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: selected ? Fonts.bodyBold : Fonts.bodySemiBold,
                            fontSize: 13,
                            color: selected ? '#0a0900' : '#FFFFFF',
                          }}
                        >
                          {topic.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Submit */}
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={{
                  backgroundColor: '#c9a84c',
                  borderRadius: 8,
                  paddingVertical: 14,
                  alignItems: 'center',
                  marginTop: 24,
                  opacity: canSubmit ? 1 : 0.45,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#0a0900" size="small" />
                ) : (
                  <Text
                    style={{
                      fontFamily: Fonts.bodyBold,
                      fontSize: 15,
                      color: '#0a0900',
                    }}
                  >
                    Share
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
