import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const FILTERS = ['All', 'This Week', 'Online', 'In-Person'];

const EVENTS = [
  {
    month: 'Jun',
    day: '14',
    name: 'Community Summit 2026',
    location: 'Miami, FL',
    attendees: '500+ attending',
    badge: 'In-Person',
    badgeBg: '#DCFCE7',
    badgeText: '#16A34A',
  },
  {
    month: 'Jun',
    day: '22',
    name: 'Investor Mixer',
    location: 'Online — Zoom',
    attendees: '120 attending',
    badge: 'Online',
    badgeBg: '#DBEAFE',
    badgeText: '#1D4ED8',
  },
  {
    month: 'Jul',
    day: '5',
    name: 'Brand Building Workshop',
    location: 'Atlanta, GA',
    attendees: '85 attending',
    badge: 'In-Person',
    badgeBg: '#DCFCE7',
    badgeText: '#16A34A',
  },
  {
    month: 'Jul',
    day: '19',
    name: 'Legacy Youth Summit',
    location: 'Online — Zoom',
    attendees: '300+ attending',
    badge: 'Online',
    badgeBg: '#DBEAFE',
    badgeText: '#1D4ED8',
  },
];

const PAST_EVENTS = [
  { name: 'Legacy Kickoff 2025', detail: 'May 3, 2025 · Miami, FL' },
  { name: 'Entrepreneurship Bootcamp', detail: 'Mar 18, 2025 · Atlanta, GA' },
];

export default function EventsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ZONE 1: Header */}
        <View className="px-5 pt-6">
          <Text className="text-2xl font-bold text-[#1A1A1A]">Events</Text>
          <Text className="text-sm text-[#6B7280] mt-0.5">
            What's happening near you
          </Text>
        </View>

        {/* ZONE 2: Featured Event Banner */}
        <View
          className="mx-5 mt-6 rounded-2xl overflow-hidden justify-between"
          style={{ height: 180, backgroundColor: '#F59E0B', padding: 20 }}
        >
          <View>
            <Text
              style={{
                fontSize: 11,
                color: '#FEF3C7',
                fontWeight: '600',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Upcoming
            </Text>
            <Text className="text-white font-bold mt-1" style={{ fontSize: 22 }}>
              Community Summit 2026
            </Text>
            <View className="flex-row items-center mt-2" style={{ gap: 6 }}>
              <Ionicons name="calendar-outline" size={14} color="white" />
              <Text style={{ fontSize: 13, color: 'white' }}>June 14, 2026</Text>
            </View>
            <View className="flex-row items-center mt-1" style={{ gap: 6 }}>
              <Ionicons name="location-outline" size={14} color="white" />
              <Text style={{ fontSize: 13, color: 'white' }}>Miami, FL</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-xs">500+ attending</Text>
            <View className="bg-white rounded-full px-4 py-1">
              <Text style={{ fontSize: 12, color: '#F59E0B', fontWeight: '700' }}>
                Register
              </Text>
            </View>
          </View>
        </View>

        {/* ZONE 3: Filter Tabs */}
        <View className="mt-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {FILTERS.map((filter, index) => (
              <View
                key={filter}
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: index === 0 ? '#1A1A1A' : '#F3F4F6' }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: index === 0 ? '#FFFFFF' : '#1A1A1A' }}
                >
                  {filter}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ZONE 4: Upcoming Events */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-bold text-[#1A1A1A]">Upcoming Events</Text>
          <View className="mt-3" style={{ gap: 12 }}>
            {EVENTS.map((event) => (
              <View
                key={event.name}
                className="flex-row bg-white rounded-xl p-3"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                  gap: 12,
                }}
              >
                {/* Date block */}
                <View
                  className="rounded-xl items-center justify-center bg-[#F3F4F6]"
                  style={{ width: 52, paddingVertical: 10 }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: '#6B7280',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {event.month}
                  </Text>
                  <Text className="text-[#1A1A1A] font-bold" style={{ fontSize: 22 }}>
                    {event.day}
                  </Text>
                </View>

                {/* Event details */}
                <View className="flex-1 justify-center" style={{ gap: 4 }}>
                  <Text className="text-[#1A1A1A] font-bold" style={{ fontSize: 15 }}>
                    {event.name}
                  </Text>
                  <View className="flex-row items-center" style={{ gap: 4 }}>
                    <Ionicons name="location-outline" size={13} color="#6B7280" />
                    <Text style={{ fontSize: 13, color: '#6B7280' }}>{event.location}</Text>
                  </View>
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{event.attendees}</Text>
                    <View
                      className="rounded-full px-2 py-0.5"
                      style={{ backgroundColor: event.badgeBg }}
                    >
                      <Text style={{ fontSize: 11, color: event.badgeText, fontWeight: '600' }}>
                        {event.badge}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ZONE 5: Past Events */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-bold text-[#1A1A1A]">Past Events</Text>
          <View className="mt-3" style={{ gap: 10 }}>
            {PAST_EVENTS.map((event) => (
              <View
                key={event.name}
                className="flex-row items-center justify-between bg-[#F9FAFB] rounded-xl px-4 py-3"
              >
                <View style={{ gap: 2 }}>
                  <Text className="font-bold text-[#6B7280]" style={{ fontSize: 15 }}>
                    {event.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{event.detail}</Text>
                </View>
                <Text style={{ fontSize: 13, color: '#6366F1', fontWeight: '600' }}>
                  View Recap
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
