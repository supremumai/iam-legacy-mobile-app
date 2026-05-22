import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const QUICK_ACTIONS = ['Community', 'Education', 'Events', 'Invest'];

const UPDATES = [
  {
    title: 'New course dropped',
    subtitle: 'Build Your Brand 101',
    tag: 'Education',
    accent: '#6366F1',
  },
  {
    title: 'Event this week',
    subtitle: 'Miami Networking Night',
    tag: 'Events',
    accent: '#F59E0B',
  },
  {
    title: 'Community post',
    subtitle: 'Legacy members share wins',
    tag: 'Community',
    accent: '#10B981',
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ZONE 1: Header */}
        <View className="flex-row items-center justify-between px-5 pt-6">
          <View>
            <Text className="text-2xl font-bold text-[#1A1A1A]">
              Good morning, Legacy 👋
            </Text>
            <Text className="text-sm text-[#6B7280] mt-0.5">
              Welcome to I Am Legacy
            </Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-[#E5E7EB] items-center justify-center">
            <Text className="text-sm font-semibold text-[#1A1A1A]">JL</Text>
          </View>
        </View>

        {/* ZONE 2: Featured Banner */}
        <View className="mx-5 mt-6 rounded-2xl bg-[#1A1A1A] overflow-hidden" style={{ height: 180 }}>
          {/* LIVE badge */}
          <View className="absolute top-3 right-3 z-10 bg-[#EF4444] px-2 py-0.5 rounded-md">
            <Text className="text-white text-xs font-bold tracking-widest">LIVE</Text>
          </View>
          {/* Content */}
          <View className="flex-1 justify-end px-5 pb-5">
            <Text className="text-white text-lg font-bold">
              Featured: Community Summit 2026
            </Text>
            <Text className="text-[#9CA3AF] text-sm mt-1">
              Join 500+ leaders this June
            </Text>
          </View>
        </View>

        {/* ZONE 3: Quick Actions */}
        <View className="mt-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {QUICK_ACTIONS.map((label) => (
              <TouchableOpacity
                key={label}
                className="bg-[#F3F4F6] rounded-full px-4 py-2"
              >
                <Text className="text-[#1A1A1A] text-sm font-medium">{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ZONE 4: Latest Updates */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-bold text-[#1A1A1A]">Latest Updates</Text>

          <View className="mt-3 gap-3">
            {UPDATES.map((item) => (
              <View
                key={item.title}
                className="flex-row bg-white rounded-xl overflow-hidden"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {/* Accent bar */}
                <View
                  style={{ width: 4, backgroundColor: item.accent }}
                />
                {/* Card content */}
                <View className="flex-1 px-4 py-3">
                  <Text className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                    {item.tag}
                  </Text>
                  <Text className="text-[#1A1A1A] font-semibold text-sm mt-0.5">
                    {item.title}
                  </Text>
                  <Text className="text-[#6B7280] text-xs mt-0.5">
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
