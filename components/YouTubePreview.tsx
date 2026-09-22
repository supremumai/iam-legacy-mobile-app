import { Alert, Image, Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { youTubeThumbnailUrl, youTubeWatchUrl } from '../lib/youtube';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';

interface YouTubePreviewProps {
  videoId: string;
  size?: 'full' | 'compact';
}

export default function YouTubePreview({ videoId, size = 'full' }: YouTubePreviewProps) {
  const handlePress = async () => {
    try {
      await Linking.openURL(youTubeWatchUrl(videoId));
    } catch {
      Alert.alert('Could not open video', 'Please try again.');
    }
  };

  const iconSize = size === 'full' ? 44 : 32;

  return (
    // SAFE pattern: static style object carries all layout/appearance; pressed
    // opacity feedback is applied on an inner View via the children render-prop.
    <Pressable
      onPress={handlePress}
      style={{
        marginTop: size === 'full' ? 12 : 8,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
      }}
    >
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.85 : 1 }}>
          {/* Thumbnail */}
          <Image
            source={{ uri: youTubeThumbnailUrl(videoId) }}
            style={
              size === 'full'
                ? { width: '100%', aspectRatio: 16 / 9 }
                : { width: '100%', height: 140 }
            }
            resizeMode="cover"
          />

          {/* Play-circle overlay — centered over the thumbnail */}
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
            <Ionicons name="play-circle" size={iconSize} color={Colors.playIconColor} />
          </View>

          {/* YouTube label chip — top-left corner */}
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: Colors.overlay,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.textPrimary }}>
              YouTube
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}
