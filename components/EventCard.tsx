import { Alert, Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { EventItem } from '../types/database';
import { Fonts } from '../constants/fonts';
import { useColors } from '../contexts/ThemeContext';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useLanguage } from '../contexts/LanguageContext';
import { formatIsoMonthUpper } from '../lib/dateFormat';

// BADGE_COLORS are intentionally static — Online/In-Person badge colors are
// fixed semantic colors (blue/green) that do not follow the app theme.
const BADGE_COLORS = {
  online:   { bg: '#dbeafe', text: '#1d4ed8' },
  inPerson: { bg: '#dcfce7', text: '#16a34a' },
} as const;

interface DateParts {
  month: string;
  day: string;
}

function parseDateParts(isoString: string | null, locale: string): DateParts {
  if (!isoString) return { month: '—', day: '—' };
  const parts = isoString.split('T')[0].split('-');
  if (parts.length < 3) return { month: '—', day: '—' };
  const day = parseInt(parts[2], 10);
  return {
    month: formatIsoMonthUpper(isoString, locale),
    day: String(day),
  };
}

interface Props {
  event: EventItem;
  isPast: boolean;
  isSaved?: boolean;
  onToggleSave?: (event: EventItem) => void;
  onDelete?: (event: EventItem) => void;
  onPress?: (event: EventItem) => void;
}

export default function EventCard({
  event,
  isPast,
  isSaved = false,
  onToggleSave,
  onDelete,
  onPress,
}: Props) {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { t, locale } = useLanguage();
  const colors = useColors();
  const dateParts = parseDateParts(event.event_date, locale);
  const attendees = event.attendees_count ?? 0;
  const goingLabel = attendees === 1
    ? t('events.one_going')
    : t('events.count_going', { count: attendees });

  const isOnline = event.is_online === true;

  // ── Delete confirmation (two-step, same pattern as PostCard) ──────────────
  const handleDeletePress = () => {
    Alert.alert(
      t('events.delete_confirm_title'),
      t('events.delete_confirm_body'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('events.delete'), style: 'destructive', onPress: () => onDelete?.(event) },
      ],
    );
  };

  // ── Kebab menu ────────────────────────────────────────────────────────────
  const handleOptionsPress = () => {
    Alert.alert(t('events.options_title'), undefined, [
      {
        text: t('events.edit_event'),
        onPress: () => router.push(`/create-event?id=${event.id}` as any),
      },
      { text: t('events.delete_event'), style: 'destructive', onPress: handleDeletePress },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress ? () => onPress(event) : undefined}
      disabled={!onPress}
    >
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        opacity: isPast ? 0.6 : 1,
      }}
    >
      {/* Image banner or placeholder */}
      {event.image_url ? (
        <Image
          source={{ uri: event.image_url }}
          style={{ width: '100%', aspectRatio: 16 / 9 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: '100%',
            aspectRatio: 16 / 9,
            backgroundColor: colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="calendar-outline" size={32} color={colors.textFaint} />
        </View>
      )}

      {/* Body */}
      <View style={{ padding: 16 }}>
        {/* Top row: date block + right group (badge + kebab) */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {/* Date block */}
          <View
            style={{
              width: 52,
              backgroundColor: colors.surfaceAlt,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              alignItems: 'center',
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 11,
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {dateParts.month}
            </Text>
            <Text
              style={{
                fontFamily: Fonts.bodyBold,
                fontSize: 20,
                color: colors.textPrimary,
                marginTop: 2,
              }}
            >
              {dateParts.day}
            </Text>
          </View>

          {/* Right group: badge + kebab (admin only) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Online / In-Person badge — uses BADGE_COLORS (static, intentional) */}
            <View
              style={{
                backgroundColor: isOnline ? BADGE_COLORS.online.bg : BADGE_COLORS.inPerson.bg,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: Fonts.bodySemiBold,
                  fontSize: 11,
                  color: isOnline ? BADGE_COLORS.online.text : BADGE_COLORS.inPerson.text,
                }}
              >
                {isOnline ? t('home.online') : t('events.in_person')}
              </Text>
            </View>

            {/* Kebab — visible to admins when parent provides onDelete.
                Static-style TouchableOpacity (bug-recurrence rule). */}
            {isAdmin && onDelete ? (
              <TouchableOpacity
                onPress={handleOptionsPress}
                activeOpacity={0.6}
                hitSlop={8}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Title */}
        {event.title ? (
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 17,
              color: colors.textPrimary,
              marginTop: 12,
            }}
          >
            {event.title}
          </Text>
        ) : null}

        {/* Location */}
        {event.location ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 13,
                color: colors.textMuted,
                marginLeft: 4,
              }}
            >
              {event.location}
            </Text>
          </View>
        ) : null}

        {/* Description */}
        {event.description ? (
          <Text
            numberOfLines={3}
            style={{
              fontFamily: Fonts.body,
              fontSize: 13,
              color: colors.textMuted,
              marginTop: 8,
              lineHeight: 19,
            }}
          >
            {event.description}
          </Text>
        ) : null}

        {/* Bottom row: attendees left, bookmark + register right */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
          }}
        >
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 13,
              color: colors.textMuted,
            }}
          >
            {goingLabel}
          </Text>

          {/* Right group: bookmark (always) + register button (upcoming + has URL only) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Bookmark — static-style TouchableOpacity (bug-recurrence rule) */}
            <TouchableOpacity
              onPress={() => onToggleSave?.(event)}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isSaved ? colors.gold : colors.textMuted}
              />
            </TouchableOpacity>

            {/* Register — only rendered when the event has a registration_url and is upcoming */}
            {!isPast && event.registration_url ? (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await Linking.openURL(event.registration_url!);
                  } catch {
                    Alert.alert(t('events.could_not_open_link'));
                  }
                }}
                activeOpacity={0.7}
                style={{
                  backgroundColor: colors.gold,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: colors.background }}>
                  {t('events.register')}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </View>
    </TouchableOpacity>
  );
}
