import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../../constants/fonts';
import { useLanguage } from '../../contexts/LanguageContext';
import type { EduTrack } from '../../lib/education';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const ICON_MAP: Array<[string, IoniconsName]> = [
  ['wholesale', 'cash-outline'],
  ['investment', 'trending-up-outline'],
  ['financ', 'business-outline'],
];
const ICON_FALLBACK: IoniconsName = 'book-outline';

function getTrackIcon(title: string): IoniconsName {
  const lower = title.toLowerCase();
  for (const [key, icon] of ICON_MAP) {
    if (lower.includes(key)) return icon;
  }
  return ICON_FALLBACK;
}

interface TrackCardProps {
  track: EduTrack;
  index: number;
  onPress: () => void;
}

export default function TrackCard({ track, onPress }: TrackCardProps) {
  const { t } = useLanguage();
  const icon = getTrackIcon(track.title);
  const totalModules = track.courses.reduce((sum, c) => sum + (c.modules_count ?? 0), 0);
  const progress = track.progress_percent ?? 0;
  const done = track.modules_done ?? 0;
  const barWidth = `${Math.min(Math.max(progress, 0), 100)}%` as const;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: 'rgba(197,164,84,0.25)',
        backgroundColor: '#1c1a14',
        padding: 16,
      }}
    >
      {/* Top row: thematic icon + progress % */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: 'rgba(197,164,84,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={22} color="#c5a454" />
        </View>
        {progress > 0 && (
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 13,
              color: '#5fa564',
            }}
          >
            {progress}%
          </Text>
        )}
      </View>

      {/* Title */}
      <Text
        style={{
          fontFamily: Fonts.heading,
          fontSize: 17,
          color: '#e8e0cc',
          marginBottom: 4,
        }}
        numberOfLines={2}
      >
        {track.title}
      </Text>

      {/* Tagline */}
      {!!track.tagline && (
        <Text
          style={{
            fontFamily: Fonts.body,
            fontSize: 12,
            color: 'rgba(255,255,255,0.45)',
            marginBottom: 12,
          }}
          numberOfLines={1}
        >
          {track.tagline}
        </Text>
      )}

      {/* Progress bar */}
      <View
        style={{
          height: 5,
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.08)',
          marginBottom: 10,
          overflow: 'hidden',
        }}
      >
        {progress > 0 && (
          <View
            style={{
              height: '100%',
              width: barWidth,
              borderRadius: 3,
              backgroundColor: '#c5a454',
            }}
          />
        )}
      </View>

      {/* Footer row: total modules (left) + done count (right) */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: Fonts.body,
            fontSize: 12,
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          {t('education.track_modules_label', { count: totalModules })}
        </Text>
        {progress > 0 ? (
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 12,
              color: '#c5a454',
            }}
          >
            {t('education.track_modules_done', { done, total: totalModules })}
          </Text>
        ) : (
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 12,
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            {t('education.track_not_started')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
