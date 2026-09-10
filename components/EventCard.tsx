import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EventItem } from '../types/database';
import { Fonts } from '../constants/fonts';

interface DateParts {
  month: string;
  day: string;
}

function parseDateParts(isoString: string | null): DateParts {
  if (!isoString) return { month: '—', day: '—' };
  // Parse as local date to avoid UTC offset shifting the day
  const parts = isoString.split('T')[0].split('-');
  if (parts.length < 3) return { month: '—', day: '—' };
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return {
    month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    day: String(day),
  };
}

interface Props {
  event: EventItem;
  isRegistered: boolean;
  isPast: boolean;
  onToggleRegister: (event: EventItem) => void;
}

export default function EventCard({ event, isRegistered, isPast, onToggleRegister }: Props) {
  const dateParts = parseDateParts(event.event_date);
  const attendees = event.attendees_count ?? 0;

  const isOnline = event.is_online === true;

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
        {/* Top row: date block + badge */}
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
              {isOnline ? 'Online' : 'In-Person'}
            </Text>
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

        {/* Bottom row: attendees + register button */}
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
            {attendees} going
          </Text>

          {!isPast ? (
            <Pressable
              onPress={() => onToggleRegister(event)}
              style={({ pressed }) =>
                isRegistered
                  ? {
                      backgroundColor: '#1c1a14',
                      borderWidth: 1,
                      borderColor: 'rgba(201,168,76,0.22)',
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      opacity: pressed ? 0.7 : 1,
                    }
                  : {
                      backgroundColor: '#c9a84c',
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      opacity: pressed ? 0.8 : 1,
                    }
              }
            >
              <Text
                style={
                  isRegistered
                    ? { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: '#FFFFFF' }
                    : { fontFamily: Fonts.bodyBold, fontSize: 13, color: '#0a0900' }
                }
              >
                {isRegistered ? 'Registered' : 'Register'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
