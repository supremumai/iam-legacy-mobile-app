import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../../constants/fonts';
import type { EduTrack } from '../../lib/education';

// Track gradient bands when no thumbnail_url — each track gets a unique color.
const TRACK_GRADIENTS = [
  ['#1a1200', '#2e1f00'],
  ['#0d1a1a', '#001f2e'],
  ['#1a0d1a', '#2e0033'],
];

interface TrackCardProps {
  track: EduTrack;
  index: number;
  onPress: () => void;
}

export default function TrackCard({ track, index, onPress }: TrackCardProps) {
  const gradient = TRACK_GRADIENTS[index % TRACK_GRADIENTS.length];
  const totalModules = track.courses.reduce((sum, c) => sum + (c.modules_count ?? 0), 0);
  const meta =
    track.courses.length === 1
      ? `${totalModules} modules`
      : `${track.courses.length} courses · ${totalModules} modules`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.18)',
      }}
    >
      {/* Thumbnail band */}
      <View
        style={{
          height: 80,
          backgroundColor: gradient[0],
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(201,168,76,0.12)',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: 12,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(201,168,76,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="book-outline" size={18} color="rgba(201,168,76,0.6)" />
        </View>
      </View>

      {/* Body */}
      <View
        style={{
          backgroundColor: '#110f09',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 17,
              color: '#c9a84c',
              marginBottom: 2,
            }}
            numberOfLines={2}
          >
            {track.title}
          </Text>
          {!!track.tagline && (
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 13,
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {track.tagline}
            </Text>
          )}
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 12,
              color: 'rgba(201,168,76,0.7)',
            }}
          >
            {meta}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(201,168,76,0.5)" />
      </View>
    </TouchableOpacity>
  );
}
