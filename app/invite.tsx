import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';
import { Fonts } from '../constants/fonts';
import { useColors } from '../contexts/ThemeContext';

export default function InviteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const colors = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 20,
            color: colors.gold,
            marginLeft: 12,
          }}
        >
          {t('drawer.invite_friends')}
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
        <Ionicons name="people-outline" size={56} color={colors.borderStrong} />
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 26,
            color: colors.gold,
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
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 23,
          }}
        >
          {t('invite.body')}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            marginTop: 36,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            borderRadius: 8,
            paddingHorizontal: 32,
            paddingVertical: 13,
          }}
        >
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.gold }}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
