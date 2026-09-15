import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useAuth } from '../contexts/AuthContext';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useLanguage } from '../contexts/LanguageContext';
import { Fonts } from '../constants/fonts';

// ─── DrawerItem ──────────────────────────────────────────────────────────────
// All tappable rows use TouchableOpacity with static style (never Pressable with
// style={({pressed}) => (...)}).

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function DrawerItem({
  icon,
  label,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
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
        borderBottomColor: 'rgba(201,168,76,0.08)',
        gap: 14,
      }}
    >
      <Ionicons name={icon} size={20} color="rgba(255,255,255,0.65)" />
      <Text style={{ fontFamily: Fonts.body, fontSize: 15, color: '#FFFFFF' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontFamily: Fonts.bodySemiBold,
        fontSize: 10,
        color: '#c9a84c',
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

  // First name for the greeting — falls back to username or the generic 'there'
  const firstName =
    profile?.full_name?.split(' ')[0] ??
    profile?.username ??
    'there';

  const navigate = (path: string) => {
    navigation.closeDrawer();
    router.push(path as any);
  };

  const handleSignOut = () => {
    navigation.closeDrawer();
    signOut();
  };

  // Closes the drawer and navigates to the Education tab, signaling it to open
  // the Add Resource modal via the openModal search param.
  const handleManageEducation = () => {
    navigation.closeDrawer();
    router.push('/education?openModal=1' as any);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0a0900',
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
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.55)" />
          </TouchableOpacity>
        </View>

        {/* ── Brand mark: logo + greeting ──────────────────────────── */}
        <View
          style={{
            alignItems: 'center',
            paddingTop: 4,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(201,168,76,0.22)',
          }}
        >
          <Image
            source={require('../assets/legacy-logo.png')}
            style={{ width: 60, height: 60 }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 11,
              color: '#c9a84c',
              letterSpacing: 1.5,
              marginTop: 6,
            }}
            numberOfLines={1}
          >
            Welcome, {firstName}
          </Text>
        </View>

        {/* ── Sección: Community (admin only) ──────────────────────── */}
        {isAdmin ? (
          <View
            style={{
              paddingTop: 20,
              paddingHorizontal: 20,
              borderTopWidth: 1,
              borderTopColor: 'rgba(201,168,76,0.12)',
              marginTop: 16,
            }}
          >
            <SectionLabel title="Community" />
            <DrawerItem
              icon="calendar-outline"
              label="Create Event"
              onPress={() => navigate('/create-event')}
            />
            <DrawerItem
              icon="book-outline"
              label="Manage Education"
              onPress={handleManageEducation}
            />
          </View>
        ) : null}

        {/* ── Sección: App ─────────────────────────────────────────── */}
        <View
          style={{
            paddingTop: 20,
            paddingHorizontal: 20,
            borderTopWidth: 1,
            borderTopColor: 'rgba(201,168,76,0.12)',
            marginTop: 16,
          }}
        >
          <SectionLabel title="App" />
          <DrawerItem
            icon="people-outline"
            label="Invite Friends"
            onPress={() => navigate('/invite')}
          />
          <DrawerItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => navigate('/support')}
          />
          <DrawerItem
            icon="information-circle-outline"
            label="About"
            onPress={() => navigate('/about')}
          />

          {/* Language toggle — does NOT close the drawer; setLocale() only */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(201,168,76,0.08)',
              gap: 14,
            }}
          >
            <Ionicons name="language-outline" size={20} color="rgba(255,255,255,0.65)" />
            <Text style={{ fontFamily: Fonts.body, fontSize: 15, color: '#FFFFFF', flex: 1 }}>
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
                  backgroundColor: locale === 'en' ? '#c9a84c' : 'rgba(255,255,255,0.1)',
                }}
              >
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 12,
                    color: locale === 'en' ? '#0a0900' : 'rgba(255,255,255,0.6)',
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
                  backgroundColor: locale === 'es' ? '#c9a84c' : 'rgba(255,255,255,0.1)',
                }}
              >
                <Text
                  style={{
                    fontFamily: Fonts.bodySemiBold,
                    fontSize: 12,
                    color: locale === 'es' ? '#0a0900' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  ES
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
            borderTopColor: 'rgba(201,168,76,0.12)',
            paddingTop: 8,
          }}
        >
          <DrawerItem
            icon="log-out-outline"
            label="Log Out"
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </View>
  );
}
