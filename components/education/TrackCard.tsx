import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../../constants/fonts';
import { useColors } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTrackIcon } from '../../lib/education';
import type { EduTrack } from '../../lib/education';

interface TrackCardProps {
  track: EduTrack;
  index: number;
  onPress: () => void;
}

export default function TrackCard({ track, onPress }: TrackCardProps) {
  const { t } = useLanguage();
  const colors = useColors();
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
        borderColor: colors.border,
        backgroundColor: colors.surface,
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
            backgroundColor: colors.borderSubtle,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon as any} size={22} color={colors.gold} />
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
          color: colors.textPrimary,
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
            color: colors.textTertiary,
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
          backgroundColor: colors.whiteOverlay10,
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
              backgroundColor: colors.gold,
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
            color: colors.textTertiary,
          }}
        >
          {t('education.track_modules_label', { count: totalModules })}
        </Text>
        {progress > 0 ? (
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 12,
              color: colors.gold,
            }}
          >
            {t('education.track_modules_done', { done, total: totalModules })}
          </Text>
        ) : (
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 12,
              color: colors.textFaint,
            }}
          >
            {t('education.track_not_started')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
