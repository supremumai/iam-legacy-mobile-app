import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Fonts } from '../constants/fonts';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const { t } = useLanguage();

  const PILLARS: { icon: IoniconName; titleKey: string; descKey: string }[] = [
    { icon: 'flame-outline', titleKey: 'about.pillar_purpose_title', descKey: 'about.pillar_purpose_desc' },
    { icon: 'people-outline', titleKey: 'about.pillar_community_title', descKey: 'about.pillar_community_desc' },
    { icon: 'trending-up-outline', titleKey: 'about.pillar_growth_title', descKey: 'about.pillar_growth_desc' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Fonts.heading, fontSize: 22, color: colors.gold }}>
          {t('about.title')}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
      >
        {/* ── Hero ─────────────────────────────────────────────── */}
        <View
          style={{
            alignItems: 'center',
            paddingVertical: 40,
            paddingHorizontal: 32,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
          }}
        >
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 34,
              color: colors.gold,
              textAlign: 'center',
              letterSpacing: 1,
              marginBottom: 16,
            }}
          >
            {t('about.hero_title')}
          </Text>
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 16,
              color: colors.textMuted,
              textAlign: 'center',
              lineHeight: 26,
            }}
          >
            {t('about.hero_subtitle')}
          </Text>
        </View>

        {/* ── Mission & Vision ─────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 10,
              color: colors.gold,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            {t('about.section_mission')}
          </Text>
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 15,
              color: colors.textSecondary,
              lineHeight: 24,
              marginBottom: 28,
            }}
          >
            {t('about.mission_text')}
          </Text>

          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 10,
              color: colors.gold,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            {t('about.section_vision')}
          </Text>
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 15,
              color: colors.textSecondary,
              lineHeight: 24,
            }}
          >
            {t('about.vision_text')}
          </Text>
        </View>

        {/* ── The 3 Pillars ────────────────────────────────────── */}
        <Text
          style={{
            fontFamily: Fonts.bodySemiBold,
            fontSize: 10,
            color: colors.gold,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            paddingHorizontal: 20,
            marginTop: 36,
            marginBottom: 12,
          }}
        >
          {t('about.section_pillars')}
        </Text>

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {PILLARS.map((p) => (
            <View
              key={p.titleKey}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 20,
                flexDirection: 'row',
                gap: 16,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(201,168,76,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Ionicons name={p.icon} size={22} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 16,
                    color: colors.textPrimary,
                    marginBottom: 6,
                  }}
                >
                  {t(p.titleKey)}
                </Text>
                <Text
                  style={{
                    fontFamily: Fonts.body,
                    fontSize: 14,
                    color: colors.textMuted,
                    lineHeight: 22,
                  }}
                >
                  {t(p.descKey)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Founder ──────────────────────────────────────────── */}
        <Text
          style={{
            fontFamily: Fonts.bodySemiBold,
            fontSize: 10,
            color: colors.gold,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            paddingHorizontal: 20,
            marginTop: 36,
            marginBottom: 12,
          }}
        >
          {t('about.section_founder')}
        </Text>

        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: 'rgba(201,168,76,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.gold,
            }}
          >
            <Text style={{ fontFamily: Fonts.heading, fontSize: 22, color: colors.gold }}>J</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontFamily: Fonts.bodySemiBold, fontSize: 16, color: colors.textPrimary }}
            >
              {t('about.founder_name')}
            </Text>
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 13,
                color: colors.textMuted,
                marginTop: 2,
                lineHeight: 20,
              }}
            >
              {t('about.founder_bio')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
