import { useState } from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '../contexts/ThemeContext';
import { Fonts } from '../constants/fonts';

const FAQ = [
  {
    q: '¿Cómo edito mi perfil?',
    a: 'Ve al menú lateral y toca "Editar Perfil". Allí puedes cambiar tu foto, nombre, bio, ubicación e intereses.',
  },
  {
    q: '¿Cómo publico contenido?',
    a: 'Toca el botón "+" en la barra principal. Puedes crear posts de texto, subir fotos o compartir reflexiones con la comunidad.',
  },
  {
    q: '¿Cómo funciona el sistema de puntos?',
    a: 'Ganas puntos por participar activamente: publicar, comentar, conectar con otros miembros y asistir a eventos. Los puntos reflejan tu contribución al legado.',
  },
  {
    q: '¿Puedo cambiar el idioma de la app?',
    a: 'Sí. Abre el menú lateral y usa el selector EN / ES en la sección de ajustes del menú para cambiar entre inglés y español.',
  },
];

function FaqItem({ q, a, colors }: { q: string; a: string; colors: any }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => setOpen((v) => !v)}
      activeOpacity={0.75}
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
        paddingVertical: 16,
        paddingHorizontal: 20,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text
          style={{
            fontFamily: Fonts.bodySemiBold,
            fontSize: 15,
            color: colors.textPrimary,
            flex: 1,
          }}
        >
          {q}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </View>
      {open && (
        <Text
          style={{
            fontFamily: Fonts.body,
            fontSize: 14,
            color: colors.textMuted,
            lineHeight: 22,
            marginTop: 10,
          }}
        >
          {a}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function SupportScreen() {
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
          Ayuda y Soporte
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* ── FAQ section ──────────────────────────────────────── */}
        <Text
          style={{
            fontFamily: Fonts.bodySemiBold,
            fontSize: 10,
            color: colors.gold,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            paddingHorizontal: 20,
            marginTop: 24,
            marginBottom: 4,
          }}
        >
          Preguntas Frecuentes
        </Text>

        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {FAQ.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} colors={colors} />
          ))}
        </View>

        {/* ── Contact section ──────────────────────────────────── */}
        <Text
          style={{
            fontFamily: Fonts.bodySemiBold,
            fontSize: 10,
            color: colors.gold,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            paddingHorizontal: 20,
            marginTop: 28,
            marginBottom: 4,
          }}
        >
          Contacto
        </Text>

        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:soporte@iamlegacy.app')}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 20,
              gap: 14,
            }}
          >
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary }}>
                Escríbenos
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                soporte@iamlegacy.app
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
