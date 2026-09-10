import { Alert, Image, Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResourceWithMeta } from '../types/database';
import { Fonts } from '../constants/fonts';
import { getInitials } from '../lib/avatar';
import { formatRelativeTime } from '../lib/time';
import { youTubeThumbnailUrl, youTubeWatchUrl } from '../lib/youtube';
import { supabase } from '../lib/supabase';

function formatCount(n: number): string {
  if (n >= 1000) {
    const formatted = (n / 1000).toFixed(1);
    return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'k' : formatted + 'k';
  }
  return n.toString();
}

interface Props {
  resource: ResourceWithMeta;
  isLiked: boolean;
  isSaved: boolean;
  currentUserId: string | undefined;
  onToggleLike: (r: ResourceWithMeta) => void;
  onToggleSave: (r: ResourceWithMeta) => void;
  onDeleted: (resourceId: string) => void;
}

export default function ResourceCard({
  resource,
  isLiked,
  isSaved,
  currentUserId,
  onToggleLike,
  onToggleSave,
  onDeleted,
}: Props) {
  const thumbnailUri =
    resource.thumbnail_url ?? youTubeThumbnailUrl(resource.youtube_video_id);

  const submitterName =
    resource.submitter?.full_name ??
    (resource.submitter?.username ? `@${resource.submitter.username}` : 'Legacy Member');

  const submitterInitials = getInitials(
    resource.submitter?.full_name ?? null,
    resource.submitter?.username ?? null,
  );

  function handleOpenVideo() {
    Linking.openURL(youTubeWatchUrl(resource.youtube_video_id)).catch(() => {
      Alert.alert('Could not open video');
    });
  }

  function handleDelete() {
    Alert.alert('Delete Video', "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('resources')
            .delete()
            .eq('id', resource.id);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            onDeleted(resource.id);
          }
        },
      },
    ]);
  }

  return (
    <View
      style={{
        backgroundColor: '#1c1a14',
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.22)',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      {/* Thumbnail */}
      <Pressable
        onPress={handleOpenVideo}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#0a0900' }}>
          <Image
            source={{ uri: thumbnailUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {/* Play icon overlay */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                backgroundColor: 'rgba(0,0,0,0.45)',
                borderRadius: 999,
                padding: 4,
              }}
            >
              <Ionicons name="play-circle" size={44} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
        </View>
      </Pressable>

      {/* Body */}
      <View style={{ padding: 16 }}>
        {/* Topic pill */}
        {resource.topic ? (
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: '#111008',
              borderRadius: 999,
              borderWidth: 1,
              borderColor: 'rgba(201,168,76,0.22)',
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{ fontFamily: Fonts.body, fontSize: 11, color: '#c9a84c' }}
            >
              {resource.topic.name}
            </Text>
          </View>
        ) : null}

        {/* Title */}
        <Text
          numberOfLines={2}
          style={{
            fontFamily: Fonts.bodySemiBold,
            fontSize: 15,
            color: '#FFFFFF',
            marginTop: 8,
          }}
        >
          {resource.title}
        </Text>

        {/* Channel */}
        {resource.channel_name ? (
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 12,
              color: 'rgba(255,255,255,0.55)',
              marginTop: 2,
            }}
          >
            {resource.channel_name}
          </Text>
        ) : null}

        {/* Description */}
        {resource.description ? (
          <Text
            numberOfLines={3}
            style={{
              fontFamily: Fonts.body,
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              marginTop: 6,
              lineHeight: 19,
            }}
          >
            {resource.description}
          </Text>
        ) : null}

        {/* Submitter + time */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 12,
          }}
        >
          {/* Mini avatar */}
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#1c1a14',
              borderWidth: 1,
              borderColor: 'rgba(201,168,76,0.22)',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {resource.submitter?.avatar_url ? (
              <Image
                source={{ uri: resource.submitter.avatar_url }}
                style={{ width: 24, height: 24 }}
              />
            ) : (
              <Text
                style={{
                  fontFamily: Fonts.bodyBold,
                  fontSize: 8,
                  color: '#FFFFFF',
                }}
              >
                {submitterInitials}
              </Text>
            )}
          </View>
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 12,
              color: 'rgba(255,255,255,0.55)',
              marginLeft: 8,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {submitterName} · {formatRelativeTime(resource.created_at)}
          </Text>
        </View>

        {/* Actions row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 12,
            gap: 20,
          }}
        >
          {/* Like */}
          <Pressable
            onPress={() => onToggleLike(resource)}
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={16}
              color={isLiked ? '#c9a84c' : 'rgba(255,255,255,0.45)'}
            />
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 13,
                color: isLiked ? '#c9a84c' : 'rgba(255,255,255,0.45)',
              }}
            >
              {formatCount(resource.likes_count)}
            </Text>
          </Pressable>

          {/* Save */}
          <Pressable
            onPress={() => onToggleSave(resource)}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={16}
              color={isSaved ? '#c9a84c' : 'rgba(255,255,255,0.45)'}
            />
          </Pressable>

          {/* Delete (own resource only) */}
          {resource.submitted_by === currentUserId ? (
            <Pressable
              onPress={handleDelete}
              hitSlop={8}
              style={({ pressed }) => ({
                marginLeft: 'auto',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color="rgba(255,255,255,0.45)"
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
