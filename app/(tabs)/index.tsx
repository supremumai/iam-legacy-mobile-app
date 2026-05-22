import { ScrollView, View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts } from '../../constants/fonts';

const QUICK_ACTIONS = ['Community', 'Education', 'Events', 'Invest'];

const UPDATES = [
  { title: 'New course dropped', subtitle: 'Build Your Brand 101', tag: 'Education', accent: '#6366F1' },
  { title: 'Event this week', subtitle: 'Miami Networking Night', tag: 'Events', accent: '#F59E0B' },
  { title: 'Community post', subtitle: 'Legacy members share wins', tag: 'Community', accent: '#10B981' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0900' }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', paddingTop: 20, marginBottom: 4 }}>
          <Image
            source={{ uri: 'https://storage.googleapis.com/funnel-ai-production/chat/c5k59Y687kyeKfW4ERei/IAL-W.png' }}
            style={{ width: 120, height: 40 }}
            resizeMode="contain"
          />
        </View>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16 }}>
          <View>
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 22, color: '#FFFFFF' }}>
              Good morning, Legacy 👋
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              Welcome to I Am Legacy
            </Text>
          </View>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1c1a14', borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: '#FFFFFF' }}>JL</Text>
          </View>
        </View>

        {/* Featured Banner */}
        <View style={{ marginHorizontal: 20, marginTop: 24, borderRadius: 16, backgroundColor: '#1c1a14', borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', height: 180, overflow: 'hidden', justifyContent: 'flex-end', padding: 20 }}>
          {/* LIVE badge — gold */}
          <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#c9a84c', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: '#0a0900', letterSpacing: 1.5 }}>LIVE</Text>
          </View>
          <Text style={{ fontFamily: Fonts.headingHeavy, fontSize: 20, color: '#FFFFFF' }}>
            Featured: Community Summit 2026
          </Text>
          <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
            Join 500+ leaders this June
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={{ marginTop: 24 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {QUICK_ACTIONS.map((label, index) => (
              <View
                key={label}
                style={{
                  backgroundColor: index === 0 ? '#c9a84c' : '#1c1a14',
                  borderRadius: 999,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderWidth: index === 0 ? 0 : 1,
                  borderColor: 'rgba(201,168,76,0.22)',
                }}
              >
                <Text style={{
                  fontFamily: index === 0 ? Fonts.bodyBold : Fonts.bodySemiBold,
                  fontSize: 14,
                  color: index === 0 ? '#0a0900' : '#FFFFFF',
                }}>
                  {label}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Latest Updates */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 18, color: '#c9a84c' }}>
            Latest Updates
          </Text>
          <View style={{ marginTop: 12, gap: 10 }}>
            {UPDATES.map((item) => (
              <View
                key={item.title}
                style={{ flexDirection: 'row', backgroundColor: '#1c1a14', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(201,168,76,0.22)', overflow: 'hidden' }}
              >
                <View style={{ width: 4, backgroundColor: item.accent }} />
                <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12 }}>
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {item.tag}
                  </Text>
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#FFFFFF', marginTop: 2 }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
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
