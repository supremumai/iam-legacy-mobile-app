import { Alert, Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { EventItem } from '../types/database';
import { Fonts } from '../constants/fonts';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useLanguage } from '../contexts/LanguageContext';
import { formatIsoMonthUpper } from '../lib/dateFormat';

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
  /** Whether this event is saved by the current user. Default: false. */
  isSaved?: boolean;
  /** Called when the user taps the bookmark icon. Parent manages optimistic state. */
  onToggleSave?: (event: EventItem) => void;
  /**
   * Called after the user confirms deletion via the kebab menu.
   * Parent is responsible for the optimistic remove + DB delete + rollback.
   * When omitted the kebab menu is hidden (even for admins).
   */
  onDelete?: (event: EventItem) => void;
}

export default function EventCard({
  event,
  isPast,
  isSaved = false,
  onToggleSave,
  onDelete,
}: Props) {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { t, locale } = useLanguage();
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
    <View
      style={{
        backgroundColor: '#1c1a14',
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.22)',
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
            backgroundColor: '#111008',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="calendar-outline" size={32} color="rgba(255,255,255,0.35)" />
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
              backgroundColor: '#111008',
              borderWidth: 1,
              borderColor: 'rgba(201,168,76,0.22)',
              borderRadius: 8,
              alignItems: 'center',
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 11,
                color: 'rgba(255,255,255,0.55)',
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
                color: '#FFFFFF',
                marginTop: 2,
              }}
            >
              {dateParts.day}
            </Text>
          </View>

          {/* Right group: badge + kebab (admin only) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Online / In-Person badge */}
            <View
              style={{
                backgroundColor: isOnline ? '#DBEAFE' : '#DCFCE7',
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: Fonts.bodySemiBold,
                  fontSize: 11,
                  color: isOnline ? '#1D4ED8' : '#16A34A',
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
                  color="rgba(255,255,255,0.55)"
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
              color: '#FFFFFF',
              marginTop: 12,
            }}
          >
            {event.title}
          </Text>
        ) : null}

        {/* Location */}
        {event.location ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.55)" />
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 13,
                color: 'rgba(255,255,255,0.55)',
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
              color: 'rgba(255,255,255,0.55)',
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
              color: 'rgba(255,255,255,0.55)',
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
                color={isSaved ? '#c9a84c' : 'rgba(255,255,255,0.55)'}
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
                  backgroundColor: '#c9a84c',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: '#0a0900' }}>
                  {t('events.register')}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}
