import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const TAGS = ['#Entrepreneurship', '#Investing', '#Legacy'];

const MY_COURSES = [
  { strip: '#6366F1', title: 'Build Your Brand 101', percent: 65 },
  { strip: '#F59E0B', title: 'Investing Fundamentals', percent: 30 },
];

const SETTINGS = [
  { icon: 'person-outline' as const, label: 'Edit Profile', danger: false },
  { icon: 'notifications-outline' as const, label: 'Notifications', danger: false },
  { icon: 'lock-closed-outline' as const, label: 'Privacy & Security', danger: false },
  { icon: 'help-circle-outline' as const, label: 'Help & Support', danger: false },
  { icon: 'log-out-outline' as const, label: 'Sign Out', danger: true },
];

const QUICK_ACTIONS = [
  { icon: 'person-add-outline' as const, label: 'Connect' },
  { icon: 'chatbubble-outline' as const, label: 'Message' },
  { icon: 'share-social-outline' as const, label: 'Share' },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ZONE 1: Profile Hero */}
        <View
          className="rounded-b-3xl items-center"
          style={{ backgroundColor: '#1A1A1A', paddingTop: 32, paddingBottom: 28 }}
        >
          {/* Avatar */}
          <View
            className="rounded-full items-center justify-center"
            style={{ width: 80, height: 80, backgroundColor: '#6366F1' }}
          >
            <Text className="text-white font-bold" style={{ fontSize: 28 }}>JL</Text>
          </View>

          {/* Name + role */}
          <Text className="text-white font-bold text-center mt-3" style={{ fontSize: 22 }}>
            Julio Legacy
          </Text>
          <Text className="text-center mt-1" style={{ fontSize: 14, color: '#9CA3AF' }}>
            Entrepreneur · Investor
          </Text>

          {/* Location */}
          <View className="flex-row items-center mt-1" style={{ gap: 4 }}>
            <Ionicons name="location-outline" size={13} color="#9CA3AF" />
            <Text style={{ fontSize: 13, color: '#9CA3AF' }}>Miami, FL</Text>
          </View>

          {/* Stats row */}
          <View className="flex-row mt-5 mb-2" style={{ gap: 40 }}>
            {[
              { value: '1.2k', label: 'Followers' },
              { value: '348', label: 'Following' },
              { value: '12', label: 'Courses' },
            ].map((stat) => (
              <View key={stat.label} className="items-center">
                <Text className="text-white font-bold" style={{ fontSize: 20 }}>
                  {stat.value}
                </Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ZONE 2: Quick Actions */}
        <View className="px-5 mt-5 flex-row" style={{ gap: 12 }}>
          {QUICK_ACTIONS.map((action) => (
            <View
              key={action.label}
              className="flex-1 bg-[#F3F4F6] rounded-xl items-center py-3"
            >
              <Ionicons name={action.icon} size={22} color="#1A1A1A" />
              <Text className="text-[#1A1A1A] text-center mt-1" style={{ fontSize: 12 }}>
                {action.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ZONE 3: About */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-bold text-[#1A1A1A]">About</Text>
          <Text
            className="text-[#4B5563] mt-2"
            style={{ fontSize: 14, lineHeight: 22 }}
          >
            Building communities that create generational wealth.{'\n'}
            Founder of Legacy Fusion. Speaker. Mentor.
          </Text>
          <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
            {TAGS.map((tag) => (
              <View key={tag} className="bg-[#F3F4F6] rounded-full px-3 py-1">
                <Text style={{ fontSize: 13, color: '#1A1A1A' }}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ZONE 4: My Courses */}
        <View className="mt-6">
          <Text className="px-5 text-lg font-bold text-[#1A1A1A]">My Courses</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, gap: 12 }}
          >
            {MY_COURSES.map((course) => (
              <View
                key={course.title}
                className="bg-white rounded-xl overflow-hidden"
                style={{
                  width: 200,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {/* Color strip */}
                <View style={{ height: 6, backgroundColor: course.strip }} />
                <View className="px-4 py-3">
                  <Text className="text-[#1A1A1A] font-bold" style={{ fontSize: 14 }}>
                    {course.title}
                  </Text>
                  <View
                    className="mt-3 rounded-full overflow-hidden bg-[#F3F4F6]"
                    style={{ height: 6 }}
                  >
                    <View
                      className="h-full rounded-full bg-[#6366F1]"
                      style={{ width: `${course.percent}%` }}
                    />
                  </View>
                  <Text className="text-[#6B7280] text-xs mt-1.5">
                    {course.percent}% complete
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ZONE 5: Settings */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-bold text-[#1A1A1A]">Settings</Text>
          <View
            className="mt-3 bg-white rounded-xl overflow-hidden"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            {SETTINGS.map((item, index) => (
              <View key={item.label}>
                <View className="flex-row items-center justify-between px-4 py-4">
                  <View className="flex-row items-center" style={{ gap: 12 }}>
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.danger ? '#EF4444' : '#1A1A1A'}
                    />
                    <Text
                      style={{
                        fontSize: 15,
                        color: item.danger ? '#EF4444' : '#1A1A1A',
                      }}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={16} color="#9CA3AF" />
                </View>
                {index < SETTINGS.length - 1 && (
                  <View className="mx-4 bg-[#F3F4F6]" style={{ height: 1 }} />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
