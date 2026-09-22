import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';
import { Fonts } from '../constants/fonts';
import { Colors } from '../constants/colors';

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 20,
            color: Colors.gold,
            marginLeft: 12,
          }}
        >
          {t('drawer.help_support')}
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
        <Ionicons name="help-circle-outline" size={56} color={Colors.borderStrong} />
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 26,
            color: Colors.gold,
            marginTop: 20,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          {t('common.coming_soon')}
        </Text>
        <Text
          style={{
            fontFamily: Fonts.body,
            fontSize: 15,
            color: Colors.textMuted,
            textAlign: 'center',
            lineHeight: 23,
          }}
        >
          {t('support.body')}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            marginTop: 36,
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: Colors.borderStrong,
            borderRadius: 8,
            paddingHorizontal: 32,
            paddingVertical: 13,
          }}
        >
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.gold }}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
