import { View, Text, Image, Pressable, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getInitials } from '../lib/avatar';
import { Fonts } from '../constants/fonts';
import AccessBar from './AccessBar';

/** Shared header used by all 4 tabs. Takes no props — fully self-contained. */
export default function GlobalHeader() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();

  const initials = getInitials(profile?.full_name, profile?.username);

  return (
    <View
      style={{
        paddingTop: insets.top + 10,
        paddingHorizontal: 20,
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0a0900',
      }}
    >
      {/* Logo lockup: hamburger trigger + "I AM LEGACY" wordmark */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Hamburger — opens the drawer. TouchableOpacity with static style. */}
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu-outline" size={24} color="#c9a84c" />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 15,
            color: '#c9a84c',
            letterSpacing: 0.5,
          }}
          numberOfLines={1}
        >
          I AM LEGACY
        </Text>
      </View>

      {/* Right: AccessBar icons + avatar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AccessBar compact />

        {/* Avatar — navigates directly to Ver perfil. Static-style Pressable. */}
        <Pressable
          onPress={() => router.push('/profile' as any)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#1c1a14',
            borderWidth: 1,
            borderColor: 'rgba(201,168,76,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {({ pressed }) => (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              }}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
              ) : (
                <Text
                  style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: '#FFFFFF' }}
                >
                  {initials}
                </Text>
              )}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
