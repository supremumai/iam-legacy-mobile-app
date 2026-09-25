import { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useColors } from '../contexts/ThemeContext';
import { Fonts } from '../constants/fonts';
import { supabase } from '../lib/supabase';

const NOTIF_KEY = 'push_notifications_enabled';

// ─── Sub-components ────────────────────────────────────────────────────────

function SectionLabel({ title, colors }: { title: string; colors: any }) {
  return (
    <Text
      style={{
        fontFamily: Fonts.bodySemiBold,
        fontSize: 10,
        color: colors.gold,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 4,
        marginTop: 20,
        paddingHorizontal: 20,
      }}
    >
      {title}
    </Text>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  danger,
  right,
  colors,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
        gap: 14,
      }}
    >
      <Ionicons name={icon as any} size={20} color={danger ? '#ef4444' : colors.textSecondary} />
      <Text
        style={{
          fontFamily: Fonts.body,
          fontSize: 15,
          color: danger ? '#ef4444' : colors.textPrimary,
          flex: 1,
        }}
      >
        {label}
      </Text>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null)}
    </TouchableOpacity>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const colors = useColors();

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(true);
  const [resetSent, setResetSent] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load persisted notification preference
  useState(() => {
    AsyncStorage.getItem(NOTIF_KEY).then((val) => {
      setNotifEnabled(val === 'true');
      setNotifLoading(false);
    });
  });

  const handleToggleNotif = async (value: boolean) => {
    setNotifEnabled(value);
    await AsyncStorage.setItem(NOTIF_KEY, value ? 'true' : 'false');
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: 'iam-legacy-mobile-app://reset-password',
      });
      setResetSent(true);
    } catch {
      Alert.alert('Error', 'No se pudo enviar el correo. Intenta de nuevo.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await supabase.from('profiles').delete().eq('id', user.id);
      await signOut();
    } catch {
      setDeleting(false);
      setShowDeleteModal(false);
      Alert.alert('Error', 'No se pudo eliminar la cuenta. Intenta de nuevo.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Fonts.heading, fontSize: 22, color: colors.gold }}>
          Configuración
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* ── CUENTA ─────────────────────────────────────────────── */}
        <SectionLabel title="Cuenta" colors={colors} />
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
          <SettingsRow
            icon="person-outline"
            label="Editar Perfil"
            onPress={() => router.push('/edit-profile')}
            colors={colors}
          />
          <SettingsRow
            icon="lock-closed-outline"
            label={resetSent ? '✓ Correo enviado — revisa tu bandeja' : 'Cambiar Contraseña'}
            onPress={resetSent ? undefined : handleChangePassword}
            colors={colors}
            right={
              resetSent ? (
                <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.gold }}>
                  Enviado
                </Text>
              ) : undefined
            }
          />
        </View>

        {/* ── NOTIFICACIONES ─────────────────────────────────────── */}
        <SectionLabel title="Notificaciones" colors={colors} />
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
          <SettingsRow
            icon="notifications-outline"
            label="Notificaciones Push"
            colors={colors}
            right={
              !notifLoading ? (
                <Switch
                  value={notifEnabled}
                  onValueChange={handleToggleNotif}
                  trackColor={{ false: colors.borderSubtle, true: colors.gold }}
                  thumbColor={colors.background}
                />
              ) : null
            }
          />
        </View>

        {/* ── LEGAL ──────────────────────────────────────────────── */}
        <SectionLabel title="Legal" colors={colors} />
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
          <SettingsRow
            icon="document-text-outline"
            label="Términos de Servicio"
            onPress={() => Linking.openURL('https://iamlegacy.app/terms')}
            colors={colors}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Política de Privacidad"
            onPress={() => Linking.openURL('https://iamlegacy.app/privacy')}
            colors={colors}
          />
        </View>

        {/* ── ZONA DE PELIGRO ────────────────────────────────────── */}
        <SectionLabel title="Zona de Peligro" colors={colors} />
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(239,68,68,0.3)',
          }}
        >
          <SettingsRow
            icon="trash-outline"
            label="Eliminar Cuenta"
            onPress={() => setShowDeleteModal(true)}
            danger
            colors={colors}
          />
          <SettingsRow
            icon="log-out-outline"
            label="Cerrar Sesión"
            onPress={signOut}
            colors={colors}
          />
        </View>
      </ScrollView>

      {/* ── Delete Account Modal ────────────────────────────────── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setShowDeleteModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 28,
              width: '100%',
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.4)',
            }}
          >
            <Ionicons name="warning-outline" size={36} color="#ef4444" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text
              style={{
                fontFamily: Fonts.heading,
                fontSize: 20,
                color: colors.textPrimary,
                textAlign: 'center',
                marginBottom: 10,
              }}
            >
              ¿Eliminar cuenta?
            </Text>
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 14,
                color: colors.textMuted,
                textAlign: 'center',
                lineHeight: 21,
                marginBottom: 24,
              }}
            >
              Esta acción es permanente e irreversible. Se eliminarán todos tus datos, publicaciones y conexiones.
            </Text>
            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={deleting}
              activeOpacity={0.75}
              style={{
                backgroundColor: '#ef4444',
                borderRadius: 8,
                paddingVertical: 13,
                alignItems: 'center',
                marginBottom: 12,
                opacity: deleting ? 0.6 : 1,
              }}
            >
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#fff' }}>
                {deleting ? 'Eliminando…' : 'Sí, eliminar mi cuenta'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDeleteModal(false)}
              disabled={deleting}
              activeOpacity={0.7}
              style={{
                borderRadius: 8,
                paddingVertical: 13,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textSecondary }}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
