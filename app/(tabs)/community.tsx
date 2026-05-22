import { ScrollView, View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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
  {
    initials: 'MR',
    bg: '#6366F1',
    action: 'Marcus Reid posted in Entrepreneurship',
    time: '2m ago',
  },
  {
    initials: 'AL',
    bg: '#10B981',
    action: 'Ana Lopez shared an investment tip',
    time: '15m ago',
  },
  {
    initials: 'JW',
    bg: '#F59E0B',
    action: 'James Wu commented on your post',
    time: '1h ago',
  },
];

export default function CommunityScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ZONE 1: Header */}
        <View className="px-5 pt-6">
          <Text className="text-2xl font-bold text-[#1A1A1A]">Community</Text>
          <Text className="text-sm text-[#6B7280] mt-0.5">
            Connect with your people
          </Text>
        </View>

        {/* ZONE 2: Search Bar */}
        <View className="px-5 mt-4">
          <View className="flex-row items-center bg-[#F3F4F6] rounded-xl px-4 py-3">
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 text-sm text-[#1A1A1A]"
              placeholder="Search members, topics..."
              placeholderTextColor="#9CA3AF"
              editable={false}
            />
          </View>
        </View>

        {/* ZONE 3: Featured Members */}
        <View className="mt-6">
          <Text className="px-5 text-lg font-bold text-[#1A1A1A]">
            Featured Members
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, gap: 16 }}
          >
            {MEMBERS.map((member) => (
              <View key={member.initials} className="items-center" style={{ width: 72 }}>
                <View
                  className="rounded-full items-center justify-center"
                  style={{ width: 56, height: 56, backgroundColor: member.bg }}
                >
                  <Text className="text-white font-bold text-sm">
                    {member.initials}
                  </Text>
                </View>
                <Text
                  className="text-[#1A1A1A] text-xs font-medium mt-1.5 text-center"
                  numberOfLines={1}
                >
                  {member.name}
                </Text>
                <Text className="text-[#6B7280] text-center mt-0.5" style={{ fontSize: 11 }}>
                  {member.role}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ZONE 4: Trending Topics */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-bold text-[#1A1A1A]">Trending Topics</Text>
          <View className="mt-3" style={{ gap: 10 }}>
            {TOPICS.map((topic) => (
              <View
                key={topic.name}
                className="flex-row items-center justify-between bg-white rounded-xl px-4 py-3"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons name={topic.icon} size={20} color="#1A1A1A" />
                  <Text className="text-[#1A1A1A] font-semibold text-base ml-3">
                    {topic.name}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-[#1A1A1A] font-semibold text-sm">
                    {topic.count}
                  </Text>
                  <Text className="text-[#6B7280] text-xs">members</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ZONE 5: Recent Activity */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-bold text-[#1A1A1A]">Recent Activity</Text>
          <View className="mt-3" style={{ gap: 14 }}>
            {ACTIVITY.map((item, index) => (
              <View key={index} className="flex-row items-center">
                <View
                  className="rounded-full items-center justify-center"
                  style={{ width: 32, height: 32, backgroundColor: item.bg }}
                >
                  <Text className="text-white font-bold" style={{ fontSize: 11 }}>
                    {item.initials}
                  </Text>
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-[#1A1A1A] text-sm">{item.action}</Text>
                  <Text className="text-[#9CA3AF] text-xs mt-0.5">{item.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
