import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useColors } from '../../../contexts/ThemeContext';
import { Fonts } from '../../../constants/fonts';

export default function DossierScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.gold} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Fonts.heading, fontSize: 20, color: colors.gold }}>
          {t('simulator.stage2_title')}
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Ionicons name="construct-outline" size={56} color={colors.gold} style={{ opacity: 0.3, marginBottom: 20 }} />
        <Text style={{ fontFamily: Fonts.heading, fontSize: 22, color: colors.textPrimary, textAlign: 'center', marginBottom: 8 }}>
          {t('simulator.stage2_coming_soon')}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.75}
          style={{ marginTop: 24, backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary }}>
            {t('simulator.stage2_back')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
