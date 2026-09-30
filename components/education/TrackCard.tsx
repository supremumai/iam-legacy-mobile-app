import { Image, Pressable, Text, TouchableOpacity, View } from 'react-native';
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
  onEdit?: () => void;
  isDraft?: boolean;
}

export default function TrackCard({ track, onPress, onEdit, isDraft }: TrackCardProps) {
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
        overflow: 'hidden',
      }}
    >
      {/* Thumbnail band */}
      {track.thumbnail_url ? (
        <View style={{ width: '100%', height: 120 }}>
          <Image
            source={{ uri: track.thumbnail_url }}
            style={{ width: '100%', height: 120 }}
            resizeMode="cover"
          />
          {/* Subtle scrim at bottom so content below reads cleanly */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 40,
              backgroundColor: 'rgba(0,0,0,0.35)',
            }}
            pointerEvents="none"
          />
        </View>
      ) : (
        <View
          style={{
            width: '100%',
            height: 120,
            backgroundColor: colors.borderSubtle,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon as any} size={36} color={colors.gold} />
        </View>
      )}

      {/* Card body */}
      <View style={{ padding: 16 }}>
        {/* Admin controls row */}
        {(isDraft || !!onEdit || progress > 0) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isDraft && (
                <View style={{ borderWidth: 1, borderColor: colors.gold, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 10, color: colors.gold, letterSpacing: 0.5 }}>
                    {t('education.admin_draft_badge')}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {progress > 0 && (
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: '#5fa564' }}>
                  {progress}%
                </Text>
              )}
              {!!onEdit && (
                <Pressable onPress={onEdit} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                  <Ionicons name="pencil-outline" size={16} color={colors.textMuted} />
                </Pressable>
              )}
            </View>
          </View>
        )}

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.textTertiary }}>
            {t('education.track_modules_label', { count: totalModules })}
          </Text>
          {progress > 0 ? (
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.gold }}>
              {t('education.track_modules_done', { done, total: totalModules })}
            </Text>
          ) : (
            <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.textFaint }}>
              {t('education.track_not_started')}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
