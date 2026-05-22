import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts } from '../../constants/fonts';

const CATEGORIES = ['All', 'Business', 'Investing', 'Mindset', 'Marketing'];

const COURSES = [
  { strip: '#6366F1', title: 'Build Your Brand 101', instructor: 'Marcus Reid', lessons: '12 lessons', rating: '4.9 ★', badge: 'Beginner', badgeBg: '#DCFCE7', badgeText: '#16A34A' },
  { strip: '#F59E0B', title: 'Investing Fundamentals', instructor: 'Ana Lopez', lessons: '8 lessons', rating: '4.7 ★', badge: 'Beginner', badgeBg: '#DCFCE7', badgeText: '#16A34A' },
  { strip: '#10B981', title: 'Leadership Mastery', instructor: 'James Wu', lessons: '15 lessons', rating: '4.8 ★', badge: 'Intermediate', badgeBg: '#FEF9C3', badgeText: '#CA8A04' },
  { strip: '#EF4444', title: 'Content Creation Pro', instructor: 'Sofia Park', lessons: '10 lessons', rating: '4.6 ★', badge: 'Advanced', badgeBg: '#FEE2E2', badgeText: '#DC2626' },
];

const PROGRESS_COURSES = [
  { title: 'Build Your Brand 101', percent: 65 },
  { title: 'Investing Fundamentals', percent: 30 },
];

export default function EducationScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0900' }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 24, color: '#c9a84c' }}>Education</Text>
          <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Learn and grow</Text>
        </View>

        {/* Featured Course Banner */}
        <View style={{ marginHorizontal: 20, marginTop: 24, borderRadius: 16, backgroundColor: '#1c1a14', borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', height: 160, overflow: 'hidden', justifyContent: 'space-between', padding: 20 }}>
          <View>
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: '#c9a84c', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Featured Course
            </Text>
            <Text style={{ fontFamily: Fonts.headingHeavy, fontSize: 20, color: '#FFFFFF', marginTop: 4 }}>
              Build Your Brand 101
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              with Marcus Reid
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: '#FFFFFF' }}>12 lessons</Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: '#FFFFFF' }}>4.9 ★</Text>
          </View>
        </View>

        {/* Categories */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ paddingHorizontal: 20, fontFamily: Fonts.heading, fontSize: 18, color: '#c9a84c' }}>Browse by Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, gap: 8 }}
          >
            {CATEGORIES.map((cat, index) => (
              <View
                key={cat}
                style={{
                  backgroundColor: index === 0 ? '#c9a84c' : '#1c1a14',
                  borderRadius: 999,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderWidth: index === 0 ? 0 : 1,
                  borderColor: 'rgba(201,168,76,0.22)',
                }}
              >
                <Text style={{ fontFamily: index === 0 ? Fonts.bodyBold : Fonts.bodySemiBold, fontSize: 14, color: index === 0 ? '#0a0900' : '#FFFFFF' }}>
                  {cat}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Course List */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 18, color: '#c9a84c' }}>All Courses</Text>
          <View style={{ marginTop: 12, gap: 12 }}>
            {COURSES.map((course) => (
              <View
                key={course.title}
                style={{ backgroundColor: '#1c1a14', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', overflow: 'hidden' }}
              >
                <View style={{ height: 8, backgroundColor: course.strip }} />
                <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: '#FFFFFF' }}>{course.title}</Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{course.instructor}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 }}>
                    <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{course.lessons}</Text>
                    <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{course.rating}</Text>
                    <View style={{ backgroundColor: course.badgeBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: course.badgeText }}>{course.badge}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Continue Learning */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 18, color: '#c9a84c' }}>Continue Learning</Text>
          <View style={{ marginTop: 12, gap: 12 }}>
            {PROGRESS_COURSES.map((item) => (
              <View
                key={item.title}
                style={{ backgroundColor: '#1c1a14', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', paddingHorizontal: 16, paddingVertical: 14 }}
              >
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: '#FFFFFF' }}>{item.title}</Text>
                <View style={{ marginTop: 10, height: 6, borderRadius: 999, backgroundColor: '#111008', overflow: 'hidden' }}>
                  <View style={{ width: `${item.percent}%`, height: '100%', backgroundColor: '#c9a84c', borderRadius: 999 }} />
                </View>
                <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>{item.percent}% complete</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
