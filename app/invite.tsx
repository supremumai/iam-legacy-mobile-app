import { Share, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '../contexts/ThemeContext';
import { Fonts } from '../constants/fonts';

const INVITE_MESSAGE =
  '¡Únete a I Am Legacy! La comunidad donde los emprendedores latinos construyen su legado. ' +
  'Descarga la app: https://iamlegacy.app/download';

export default function InviteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const handleShare = async () => {
    try {
      await Share.share({ message: INVITE_MESSAGE });
    } catch {
      // user dismissed
    }
  };

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
          Invitar Amigos
        </Text>
      </View>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Ionicons name="people-outline" size={40} color={colors.gold} />
        </View>

        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 26,
            color: colors.textPrimary,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Comparte el Legado
        </Text>
        <Text
          style={{
            fontFamily: Fonts.body,
            fontSize: 15,
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 36,
          }}
        >
          Invita a tus amigos y construyan juntos una comunidad de emprendedores latinos imparables.
        </Text>

        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: colors.gold,
            borderRadius: 10,
            paddingHorizontal: 32,
            paddingVertical: 14,
          }}
        >
          <Ionicons name="share-social-outline" size={20} color={colors.background} />
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 16, color: colors.background }}>
            Compartir Invitación
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
