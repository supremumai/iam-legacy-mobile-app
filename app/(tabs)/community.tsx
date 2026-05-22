import { ScrollView, View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../../constants/fonts';

const MEMBERS = [
  { initials: 'MR', name: 'Marcus Reid', role: 'Entrepreneur', bg: '#6366F1' },
  { initials: 'AL', name: 'Ana Lopez', role: 'Investor', bg: '#10B981' },
  { initials: 'JW', name: 'James Wu', role: 'Mentor', bg: '#F59E0B' },
  { initials: 'SP', name: 'Sofia Park', role: 'Creator', bg: '#EF4444' },
];

const TOPICS = [
  { icon: 'flame-outline' as const, name: 'Entrepreneurship', count: '1.2k' },
  { icon: 'trending-up-outline' as const, name: 'Investing', count: '890' },
  { icon: 'bulb-outline' as const, name: 'Personal Growth', count: '2.1k' },
];

const ACTIVITY = [
  { initials: 'MR', bg: '#6366F1', action: 'Marcus Reid posted in Entrepreneurship', time: '2m ago' },
  { initials: 'AL', bg: '#10B981', action: 'Ana Lopez shared an investment tip', time: '15m ago' },
  { initials: 'JW', bg: '#F59E0B', action: 'James Wu commented on your post', time: '1h ago' },
];

export default function CommunityScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0900' }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 24, color: '#c9a84c' }}>Community</Text>
          <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Connect with your people</Text>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1a14', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', paddingHorizontal: 14, paddingVertical: 12 }}>
            <Ionicons name="search-outline" size={18} color="#c9a84c" />
            <TextInput
              style={{ flex: 1, marginLeft: 8, fontSize: 14, color: '#FFFFFF', fontFamily: Fonts.body }}
              placeholder="Search members, topics..."
              placeholderTextColor="rgba(255,255,255,0.55)"
              editable={false}
            />
          </View>
        </View>

        {/* Featured Members */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ paddingHorizontal: 20, fontFamily: Fonts.heading, fontSize: 18, color: '#c9a84c' }}>Featured Members</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, gap: 16 }}
          >
            {MEMBERS.map((member) => (
              <View key={member.initials} style={{ alignItems: 'center', width: 72 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: member.bg, borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: '#FFFFFF' }}>{member.initials}</Text>
                </View>
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: '#FFFFFF', marginTop: 6, textAlign: 'center' }} numberOfLines={1}>{member.name}</Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 1 }}>{member.role}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Trending Topics */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 18, color: '#c9a84c' }}>Trending Topics</Text>
          <View style={{ marginTop: 12, gap: 10 }}>
            {TOPICS.map((topic) => (
              <View key={topic.name} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1c1a14', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', paddingHorizontal: 16, paddingVertical: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name={topic.icon} size={20} color="#c9a84c" />
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 16, color: '#FFFFFF' }}>{topic.name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: '#FFFFFF' }}>{topic.count}</Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>members</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 18, color: '#c9a84c' }}>Recent Activity</Text>
          <View style={{ marginTop: 12, gap: 10 }}>
            {ACTIVITY.map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1a14', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', paddingHorizontal: 14, paddingVertical: 12, gap: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: '#FFFFFF' }}>{item.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: '#FFFFFF' }}>{item.action}</Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{item.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
