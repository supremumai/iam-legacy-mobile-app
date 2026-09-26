import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useAuth } from '../contexts/AuthContext';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useLanguage } from '../contexts/LanguageContext';
import { useColors, useTheme } from '../contexts/ThemeContext';
import { Fonts } from '../constants/fonts';

// ─── DrawerItem ──────────────────────────────────────────────────────────────
// All tappable rows use TouchableOpacity with static style (never Pressable with
// style={({pressed}) => (...)}).

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function DrawerItem({
  icon,
  label,
  onPress,
  colors,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
        gap: 14,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <Text style={{ fontFamily: Fonts.body, fontSize: 15, color: colors.textPrimary }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
function SectionLabel({ title, colors }: { title: string; colors: ReturnType<typeof useColors> }) {
  return (
    <Text
      style={{
        fontFamily: Fonts.bodySemiBold,
        fontSize: 10,
        color: colors.gold,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 4,
        marginTop: 4,
      }}
    >
      {title}
    </Text>
  );
}

// ─── DrawerContent ────────────────────────────────────────────────────────────
export default function DrawerContent({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const { locale, setLocale, t } = useLanguage();
  const colors = useColors();
  const { theme, setTheme } = useTheme();

  const firstName =
    profile?.full_name?.split(' ')[0] ??
    profile?.username ??
    t('drawer.greeting_fallback');

  const navigate = (path: string) => {
    navigation.closeDrawer();
    router.push(path as any);
  };

  const handleSignOut = () => {
    navigation.closeDrawer();
    signOut();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* ── Close button ─────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 4,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.closeDrawer()}
            activeOpacity={0.65}
            hitSlop={12}
          >
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Brand mark: logo + greeting ──────────────────────────── */}
        <View
          style={{
            alignItems: 'center',
            paddingTop: 20,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Image
            source={
              theme === 'dark'
                ? require('../assets/legacy-logo.png')
                : require('../assets/legacy-logo-dark.png')
            }
            style={{ width: 220, height: 74 }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 18,
              color: colors.textPrimary,
              marginTop: 10,
            }}
            numberOfLines={1}
          >
            {t('drawer.greeting_prefix')}
            <Text style={{ color: colors.gold }}>{firstName}</Text>
          </Text>
        </View>

        {/* ── Sección: Community (admin only) ──────────────────────── */}
        {isAdmin ? (
          <View
            style={{
              paddingTop: 20,
              paddingHorizontal: 20,
              borderTopWidth: 1,
              borderTopColor: colors.borderSubtle,
              marginTop: 16,
            }}
          >
            <SectionLabel title={t('drawer.community_section')} colors={colors} />
            <DrawerItem
              icon="calendar-outline"
              label={t('drawer.create_event')}
              onPress={() => navigate('/create-event')}
              colors={colors}
            />
          </View>
        ) : null}

        {/* ── Sección: App ─────────────────────────────────────────── */}
        <View
          style={{
            paddingTop: 20,
            paddingHorizontal: 20,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
            marginTop: 16,
          }}
        >
          <SectionLabel title={t('drawer.app_section')} colors={colors} />
          <DrawerItem
            icon="people-outline"
            label={t('drawer.invite_friends')}
            onPress={() => navigate('/invite')}
            colors={colors}
          />
          <DrawerItem
            icon="help-circle-outline"
            label={t('drawer.help_support')}
            onPress={() => navigate('/support')}
            colors={colors}
          />
          <DrawerItem
            icon="information-circle-outline"
            label={t('drawer.about')}
            onPress={() => navigate('/about')}
            colors={colors}
          />

          {/* Language toggle — does NOT close the drawer; setLocale() only */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
              gap: 14,
            }}
          >
            <Ionicons name="language-outline" size={20} color={colors.textSecondary} />
            <Text style={{ fontFamily: Fonts.body, fontSize: 15, color: colors.textPrimary, flex: 1 }}>
              {t('settings.language')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                onPress={() => setLocale('en')}
                activeOpacity={0.75}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 6,
                  backgroundColor: locale === 'en' ? colors.gold : colors.whiteOverlay10,
                }}
              >
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 12,
                    color: locale === 'en' ? colors.background : colors.textSecondary,
                  }}
                >
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLocale('es')}
                activeOpacity={0.75}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 6,
                  backgroundColor: locale === 'es' ? colors.gold : colors.whiteOverlay10,
                }}
              >
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 12,
                    color: locale === 'es' ? colors.background : colors.textSecondary,
                  }}
                >
                  ES
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Theme toggle — does NOT close the drawer; setTheme() only */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
              gap: 14,
            }}
          >
            <Ionicons
              name={theme === 'dark' ? 'moon-outline' : 'sunny-outline'}
              size={20}
              color={colors.textSecondary}
            />
            <Text style={{ fontFamily: Fonts.body, fontSize: 15, color: colors.textPrimary, flex: 1 }}>
              {t('settings.theme')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                onPress={() => setTheme('dark')}
                activeOpacity={0.75}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 6,
                  backgroundColor: theme === 'dark' ? colors.gold : colors.whiteOverlay10,
                }}
              >
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 12,
                    color: theme === 'dark' ? colors.background : colors.textSecondary,
                  }}
                >
                  {t('settings.theme_dark')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTheme('light')}
                activeOpacity={0.75}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 6,
                  backgroundColor: theme === 'light' ? colors.gold : colors.whiteOverlay10,
                }}
              >
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 12,
                    color: theme === 'light' ? colors.background : colors.textSecondary,
                  }}
                >
                  {t('settings.theme_light')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Log Out — standalone at bottom after divider ──────────── */}
        <View
          style={{
            marginTop: 16,
            paddingHorizontal: 20,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
            paddingTop: 8,
          }}
        >
          <DrawerItem
            icon="log-out-outline"
            label={t('drawer.log_out')}
            onPress={handleSignOut}
            colors={colors}
          />
        </View>
      </ScrollView>
    </View>
  );
}
