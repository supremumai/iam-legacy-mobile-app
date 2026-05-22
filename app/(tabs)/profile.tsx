import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../../constants/fonts';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0900' }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Zone 1: Hero */}
        <View style={{ backgroundColor: '#111008', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, alignItems: 'center', paddingTop: 32, paddingBottom: 28 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#1c1a14', borderWidth: 2, borderColor: 'rgba(201,168,76,0.22)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: Fonts.inter700, fontSize: 28, color: '#FFFFFF' }}>JL</Text>
          </View>
          <Text style={{ fontFamily: Fonts.playfair700, fontSize: 22, color: '#FFFFFF', marginTop: 12 }}>Julio Legacy</Text>
          <Text style={{ fontFamily: Fonts.inter400, fontSize: 14, color: '#6B7280', marginTop: 4 }}>Entrepreneur · Investor</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="location-outline" size={13} color="#6B7280" />
            <Text style={{ fontFamily: Fonts.inter400, fontSize: 13, color: '#6B7280' }}>Miami, FL</Text>
          </View>
          {/* Stats */}
          <View style={{ flexDirection: 'row', marginTop: 20, gap: 40 }}>
            {[{ value: '1.2k', label: 'Followers' }, { value: '348', label: 'Following' }, { value: '12', label: 'Courses' }].map((stat) => (
              <View key={stat.label} style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily: Fonts.inter700, fontSize: 20, color: '#c9a84c' }}>{stat.value}</Text>
                <Text style={{ fontFamily: Fonts.inter400, fontSize: 12, color: '#6B7280', marginTop: 2 }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Zone 2: Quick Actions */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 12 }}>
          {QUICK_ACTIONS.map((action) => (
            <View
              key={action.label}
              style={{ flex: 1, backgroundColor: '#1c1a14', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', alignItems: 'center', paddingVertical: 12 }}
            >
              <Ionicons name={action.icon} size={22} color="#c9a84c" />
              <Text style={{ fontFamily: Fonts.inter400, fontSize: 12, color: '#FFFFFF', marginTop: 4 }}>{action.label}</Text>
            </View>
          ))}
        </View>

        {/* Zone 3: About */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontFamily: Fonts.playfair700, fontSize: 18, color: '#c9a84c' }}>About</Text>
          <View style={{ marginTop: 10, backgroundColor: '#1c1a14', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', padding: 16 }}>
            <Text style={{ fontFamily: Fonts.inter400, fontSize: 14, color: '#FFFFFF', lineHeight: 22 }}>
              Building communities that create generational wealth.{'\n'}Founder of Legacy Fusion. Speaker. Mentor.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 }}>
              {TAGS.map((tag) => (
                <View key={tag} style={{ backgroundColor: '#111008', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', paddingHorizontal: 12, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: Fonts.inter400, fontSize: 13, color: '#c9a84c' }}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Zone 4: My Courses */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ paddingHorizontal: 20, fontFamily: Fonts.playfair700, fontSize: 18, color: '#c9a84c' }}>My Courses</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, gap: 12 }}
          >
            {MY_COURSES.map((course) => (
              <View
                key={course.title}
                style={{ width: 200, backgroundColor: '#1c1a14', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', overflow: 'hidden' }}
              >
                <View style={{ height: 6, backgroundColor: course.strip }} />
                <View style={{ padding: 14 }}>
                  <Text style={{ fontFamily: Fonts.inter700, fontSize: 14, color: '#FFFFFF' }}>{course.title}</Text>
                  <View style={{ marginTop: 10, height: 6, borderRadius: 999, backgroundColor: '#111008', overflow: 'hidden' }}>
                    <View style={{ width: `${course.percent}%`, height: '100%', backgroundColor: '#c9a84c', borderRadius: 999 }} />
                  </View>
                  <Text style={{ fontFamily: Fonts.inter400, fontSize: 12, color: '#6B7280', marginTop: 6 }}>{course.percent}% complete</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Zone 5: Settings */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontFamily: Fonts.playfair700, fontSize: 18, color: '#c9a84c' }}>Settings</Text>
          <View style={{ marginTop: 10, backgroundColor: '#1c1a14', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', overflow: 'hidden' }}>
            {SETTINGS.map((item, index) => (
              <View key={item.label}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Ionicons name={item.icon} size={20} color={item.danger ? '#EF4444' : '#c9a84c'} />
                    <Text style={{ fontFamily: Fonts.inter400, fontSize: 15, color: item.danger ? '#EF4444' : '#FFFFFF' }}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={16} color="#6B7280" />
                </View>
                {index < SETTINGS.length - 1 && (
                  <View style={{ height: 1, backgroundColor: 'rgba(201,168,76,0.12)', marginHorizontal: 16 }} />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
