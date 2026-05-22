import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = ['All', 'Business', 'Investing', 'Mindset', 'Marketing'];

const COURSES = [
  {
    strip: '#6366F1',
    title: 'Build Your Brand 101',
    instructor: 'Marcus Reid',
    lessons: '12 lessons',
    rating: '4.9 ★',
    badge: 'Beginner',
    badgeBg: '#DCFCE7',
    badgeText: '#16A34A',
  },
  {
    strip: '#F59E0B',
    title: 'Investing Fundamentals',
    instructor: 'Ana Lopez',
    lessons: '8 lessons',
    rating: '4.7 ★',
    badge: 'Beginner',
    badgeBg: '#DCFCE7',
    badgeText: '#16A34A',
  },
  {
    strip: '#10B981',
    title: 'Leadership Mastery',
    instructor: 'James Wu',
    lessons: '15 lessons',
    rating: '4.8 ★',
    badge: 'Intermediate',
    badgeBg: '#FEF9C3',
    badgeText: '#CA8A04',
  },
  {
    strip: '#EF4444',
    title: 'Content Creation Pro',
    instructor: 'Sofia Park',
    lessons: '10 lessons',
    rating: '4.6 ★',
    badge: 'Advanced',
    badgeBg: '#FEE2E2',
    badgeText: '#DC2626',
  },
];

const PROGRESS_COURSES = [
  { title: 'Build Your Brand 101', percent: 65 },
  { title: 'Investing Fundamentals', percent: 30 },
];

export default function EducationScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ZONE 1: Header */}
        <View className="px-5 pt-6">
          <Text className="text-2xl font-bold text-[#1A1A1A]">Education</Text>
          <Text className="text-sm text-[#6B7280] mt-0.5">Learn and grow</Text>
        </View>

        {/* ZONE 2: Featured Course Banner */}
        <View
          className="mx-5 mt-6 rounded-2xl overflow-hidden justify-between"
          style={{ height: 160, backgroundColor: '#6366F1', padding: 20 }}
        >
          <View>
            <Text style={{ fontSize: 11, color: '#C7D2FE', fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Featured Course
            </Text>
            <Text className="text-white font-bold mt-1" style={{ fontSize: 20 }}>
              Build Your Brand 101
            </Text>
            <Text style={{ fontSize: 13, color: '#C7D2FE', marginTop: 2 }}>
              with Marcus Reid
            </Text>
          </View>
          <View className="flex-row" style={{ gap: 16 }}>
            <Text className="text-white text-xs">12 lessons</Text>
            <Text className="text-white text-xs">4.9 ★</Text>
          </View>
        </View>

        {/* ZONE 3: Categories */}
        <View className="mt-6">
          <Text className="px-5 text-lg font-bold text-[#1A1A1A]">Browse by Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, gap: 8 }}
          >
            {CATEGORIES.map((cat, index) => (
              <View
                key={cat}
                className="rounded-full px-4 py-2"
                style={{
                  backgroundColor: index === 0 ? '#1A1A1A' : '#F3F4F6',
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: index === 0 ? '#FFFFFF' : '#1A1A1A' }}
                >
                  {cat}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ZONE 4: Course List */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-bold text-[#1A1A1A]">All Courses</Text>
          <View className="mt-3" style={{ gap: 12 }}>
            {COURSES.map((course) => (
              <View
                key={course.title}
                className="bg-white rounded-xl overflow-hidden"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {/* Color strip */}
                <View style={{ height: 8, backgroundColor: course.strip }} />
                {/* Card body */}
                <View className="px-4 py-3">
                  <Text className="text-[#1A1A1A] font-bold text-base">
                    {course.title}
                  </Text>
                  <Text className="text-[#6B7280] mt-0.5" style={{ fontSize: 13 }}>
                    {course.instructor}
                  </Text>
                  <View className="flex-row items-center mt-2" style={{ gap: 10 }}>
                    <Text className="text-[#6B7280] text-xs">{course.lessons}</Text>
                    <Text className="text-[#6B7280] text-xs">{course.rating}</Text>
                    <View
                      className="rounded-full px-2 py-0.5"
                      style={{ backgroundColor: course.badgeBg }}
                    >
                      <Text style={{ fontSize: 11, color: course.badgeText, fontWeight: '600' }}>
                        {course.badge}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ZONE 5: Continue Learning */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-bold text-[#1A1A1A]">Continue Learning</Text>
          <View className="mt-3" style={{ gap: 12 }}>
            {PROGRESS_COURSES.map((item) => (
              <View
                key={item.title}
                className="bg-white rounded-xl px-4 py-4"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text className="text-[#1A1A1A] font-bold" style={{ fontSize: 15 }}>
                  {item.title}
                </Text>
                <View className="mt-3 rounded-full overflow-hidden bg-[#F3F4F6]" style={{ height: 6 }}>
                  <View
                    className="h-full rounded-full bg-[#6366F1]"
                    style={{ width: `${item.percent}%` }}
                  />
                </View>
                <Text className="text-[#6B7280] text-xs mt-1.5">
                  {item.percent}% complete
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
