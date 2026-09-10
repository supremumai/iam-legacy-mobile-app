import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Fonts } from '../constants/fonts';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
        >
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ fontFamily: Fonts.heading, fontSize: 24, color: '#c9a84c', marginBottom: 12 }}>
          Settings
        </Text>
        <Text style={{ fontFamily: Fonts.body, fontSize: 16, color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
          Coming soon
        </Text>
      </View>
    </View>
  );
}
