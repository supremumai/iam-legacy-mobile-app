import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Fonts } from '../constants/fonts';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0900', paddingTop: insets.top }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(201,168,76,0.22)',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 20,
            color: '#c9a84c',
            marginLeft: 12,
          }}
        >
          About
        </Text>
      </View>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <Ionicons name="information-circle-outline" size={56} color="rgba(201,168,76,0.4)" />
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 26,
            color: '#c9a84c',
            marginTop: 20,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          Coming Soon
        </Text>
        <Text
          style={{
            fontFamily: Fonts.body,
            fontSize: 15,
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'center',
            lineHeight: 23,
          }}
        >
          Here you'll find the story, mission, and version details for the I Am Legacy app.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            marginTop: 36,
            backgroundColor: '#1c1a14',
            borderWidth: 1,
            borderColor: 'rgba(201,168,76,0.3)',
            borderRadius: 8,
            paddingHorizontal: 32,
            paddingVertical: 13,
          }}
        >
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#c9a84c' }}>
            Back
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
