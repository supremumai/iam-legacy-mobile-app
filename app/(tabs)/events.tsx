import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../../constants/fonts';

const FILTERS = ['All', 'This Week', 'Online', 'In-Person'];

const EVENTS = [
  { month: 'Jun', day: '14', name: 'Community Summit 2026', location: 'Miami, FL', attendees: '500+ attending', badge: 'In-Person', badgeBg: '#DCFCE7', badgeText: '#16A34A' },
  { month: 'Jun', day: '22', name: 'Investor Mixer', location: 'Online — Zoom', attendees: '120 attending', badge: 'Online', badgeBg: '#DBEAFE', badgeText: '#1D4ED8' },
  { month: 'Jul', day: '5', name: 'Brand Building Workshop', location: 'Atlanta, GA', attendees: '85 attending', badge: 'In-Person', badgeBg: '#DCFCE7', badgeText: '#16A34A' },
  { month: 'Jul', day: '19', name: 'Legacy Youth Summit', location: 'Online — Zoom', attendees: '300+ attending', badge: 'Online', badgeBg: '#DBEAFE', badgeText: '#1D4ED8' },
];

const PAST_EVENTS = [
  { name: 'Legacy Kickoff 2025', detail: 'May 3, 2025 · Miami, FL' },
  { name: 'Entrepreneurship Bootcamp', detail: 'Mar 18, 2025 · Atlanta, GA' },
];

export default function EventsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0900' }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text style={{ fontFamily: Fonts.playfair700, fontSize: 24, color: '#c9a84c' }}>Events</Text>
          <Text style={{ fontFamily: Fonts.inter400, fontSize: 14, color: '#6B7280', marginTop: 2 }}>What's happening near you</Text>
        </View>

        {/* Featured Event Banner */}
        <View style={{ marginHorizontal: 20, marginTop: 24, borderRadius: 16, backgroundColor: '#1c1a14', borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', height: 180, overflow: 'hidden', justifyContent: 'space-between', padding: 20 }}>
          <View>
            <Text style={{ fontFamily: Fonts.inter600, fontSize: 11, color: '#c9a84c', letterSpacing: 1.5, textTransform: 'uppercase' }}>Upcoming</Text>
            <Text style={{ fontFamily: Fonts.playfair900, fontSize: 22, color: '#FFFFFF', marginTop: 6 }}>Community Summit 2026</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
              <Ionicons name="calendar-outline" size={14} color="#c9a84c" />
              <Text style={{ fontFamily: Fonts.inter400, fontSize: 13, color: '#FFFFFF' }}>June 14, 2026</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
              <Ionicons name="location-outline" size={14} color="#c9a84c" />
              <Text style={{ fontFamily: Fonts.inter400, fontSize: 13, color: '#FFFFFF' }}>Miami, FL</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: Fonts.inter400, fontSize: 12, color: '#6B7280' }}>500+ attending</Text>
            <View style={{ backgroundColor: '#c9a84c', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 6 }}>
              <Text style={{ fontFamily: Fonts.inter700, fontSize: 12, color: '#0a0900' }}>Register</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={{ marginTop: 24 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {FILTERS.map((filter, index) => (
              <View
                key={filter}
                style={{
                  backgroundColor: index === 0 ? '#c9a84c' : '#1c1a14',
                  borderRadius: 999,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderWidth: index === 0 ? 0 : 1,
                  borderColor: 'rgba(201,168,76,0.22)',
                }}
              >
                <Text style={{ fontFamily: Fonts.inter500, fontSize: 14, color: index === 0 ? '#0a0900' : '#6B7280' }}>
                  {filter}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Upcoming Events */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontFamily: Fonts.playfair700, fontSize: 18, color: '#c9a84c' }}>Upcoming Events</Text>
          <View style={{ marginTop: 12, gap: 12 }}>
            {EVENTS.map((event) => (
              <View
                key={event.name}
                style={{ flexDirection: 'row', backgroundColor: '#1c1a14', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', padding: 12, gap: 12 }}
              >
                {/* Date block */}
                <View style={{ width: 52, backgroundColor: '#111008', borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 }}>
                  <Text style={{ fontFamily: Fonts.inter600, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{event.month}</Text>
                  <Text style={{ fontFamily: Fonts.inter700, fontSize: 22, color: '#FFFFFF' }}>{event.day}</Text>
                </View>
                {/* Details */}
                <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
                  <Text style={{ fontFamily: Fonts.inter700, fontSize: 15, color: '#FFFFFF' }}>{event.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="location-outline" size={13} color="#6B7280" />
                    <Text style={{ fontFamily: Fonts.inter400, fontSize: 13, color: '#6B7280' }}>{event.location}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontFamily: Fonts.inter400, fontSize: 12, color: '#6B7280' }}>{event.attendees}</Text>
                    <View style={{ backgroundColor: event.badgeBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontFamily: Fonts.inter600, fontSize: 11, color: event.badgeText }}>{event.badge}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Past Events */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontFamily: Fonts.playfair700, fontSize: 18, color: '#c9a84c' }}>Past Events</Text>
          <View style={{ marginTop: 12, gap: 10 }}>
            {PAST_EVENTS.map((event) => (
              <View
                key={event.name}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111008', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', paddingHorizontal: 16, paddingVertical: 12 }}
              >
                <View style={{ gap: 2 }}>
                  <Text style={{ fontFamily: Fonts.inter600, fontSize: 15, color: '#6B7280' }}>{event.name}</Text>
                  <Text style={{ fontFamily: Fonts.inter400, fontSize: 13, color: '#6B7280' }}>{event.detail}</Text>
                </View>
                <Text style={{ fontFamily: Fonts.inter600, fontSize: 13, color: '#c9a84c' }}>View Recap</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
