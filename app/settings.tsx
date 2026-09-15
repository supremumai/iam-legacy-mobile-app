import { View, Text, Pressable, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Fonts } from '../constants/fonts';
import { useLanguage } from '../contexts/LanguageContext';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { locale, setLocale, t } = useLanguage();

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ opacity: 1, alignSelf: 'flex-start' }}
        >
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
        <Text
          style={{
            fontFamily: Fonts.bodySemiBold,
            fontSize: 13,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            marginBottom: 12,
          }}
        >
          {t('settings.language')}
        </Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={() => setLocale('en')}
            activeOpacity={0.75}
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: locale === 'en' ? '#c9a84c' : 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: locale === 'en' ? '#c9a84c' : 'rgba(255,255,255,0.15)',
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 15,
                color: locale === 'en' ? '#0a0900' : '#FFFFFF',
              }}
            >
              {t('settings.language_english')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setLocale('es')}
            activeOpacity={0.75}
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: locale === 'es' ? '#c9a84c' : 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: locale === 'es' ? '#c9a84c' : 'rgba(255,255,255,0.15)',
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 15,
                color: locale === 'es' ? '#0a0900' : '#FFFFFF',
              }}
            >
              {t('settings.language_spanish')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
