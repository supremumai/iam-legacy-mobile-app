import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '../contexts/ThemeContext';
import { Fonts } from '../constants/fonts';

const PILLARS = [
  {
    icon: 'flame-outline' as const,
    title: 'Propósito',
    desc: 'Construye una vida con intención. Cada decisión que tomas deja una huella para los que vienen después.',
  },
  {
    icon: 'people-outline' as const,
    title: 'Comunidad',
    desc: 'No construyes solo. La tribu que eliges define el legado que dejas. Aquí todos se elevan juntos.',
  },
  {
    icon: 'trending-up-outline' as const,
    title: 'Crecimiento',
    desc: 'El legado no es un destino, es un camino de mejora continua. Aprende, comparte, evoluciona.',
  },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

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
          Acerca de
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
            I Am Legacy
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
            Una comunidad para emprendedores latinos que construyen algo que trasciende. No solo negocios — legados.
          </Text>
        </View>

        {/* ── Misión y Visión ─────────────────────────────────── */}
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
            Misión
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
            Empoderar a emprendedores latinos para que construyan negocios, relaciones y estilos de vida que dejen una huella duradera en sus familias y comunidades.
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
            Visión
          </Text>
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 15,
              color: colors.textSecondary,
              lineHeight: 24,
            }}
          >
            Un mundo donde cada latino vive con propósito, lidera con integridad y construye un legado que inspira a las generaciones futuras.
          </Text>
        </View>

        {/* ── Los 3 Pilares ───────────────────────────────────── */}
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
          Los 3 Pilares
        </Text>

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {PILLARS.map((p) => (
            <View
              key={p.title}
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
                  {p.title}
                </Text>
                <Text
                  style={{
                    fontFamily: Fonts.body,
                    fontSize: 14,
                    color: colors.textMuted,
                    lineHeight: 22,
                  }}
                >
                  {p.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Fundador ─────────────────────────────────────────── */}
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
          Fundador
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
              Julio Solís
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
              Emprendedor, mentor y constructor de comunidades latinas. Fundó I Am Legacy para dar a cada latino las herramientas para trascender.
            </Text>
          </View>
        </View>

        {/* ── CTA Comunidad ────────────────────────────────────── */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 36,
            backgroundColor: 'rgba(201,168,76,0.08)',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(201,168,76,0.3)',
            padding: 24,
            alignItems: 'center',
          }}
        >
          <Ionicons name="globe-outline" size={32} color={colors.gold} style={{ marginBottom: 12 }} />
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 20,
              color: colors.textPrimary,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Únete a la Comunidad
          </Text>
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 14,
              color: colors.textMuted,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 20,
            }}
          >
            Síguenos, comparte tu historia y sé parte del movimiento que está cambiando la narrativa latina.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://iamlegacy.app')}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.gold,
              borderRadius: 8,
              paddingHorizontal: 28,
              paddingVertical: 12,
            }}
          >
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.background }}>
              iamlegacy.app
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
