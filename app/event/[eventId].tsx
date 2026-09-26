import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useColors } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { toggleSave, fetchSavedIds } from '../../lib/saves';
import { deleteEventImageIfOwned } from '../../lib/upload';
import { EventItem } from '../../types/database';
import { Fonts } from '../../constants/fonts';
import { formatMonthDayLabel } from '../../lib/dateFormat';

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const colors = useColors();
  const { t, locale } = useLanguage();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const { data, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (fetchError || !data) {
          setError(true);
          setLoading(false);
          return;
        }

        setEvent(data as EventItem);

        if (user?.id) {
          const saved = await fetchSavedIds('event', [data.id], user.id);
          setIsSaved(saved.has(data.id));
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, user?.id]);

  const handleToggleSave = async () => {
    if (!event || !user?.id) return;
    const wasSaved = isSaved;
    setIsSaved(!wasSaved);
    try {
      await toggleSave('event', event.id, user.id, wasSaved);
    } catch {
      setIsSaved(wasSaved);
      Alert.alert(t('common.error_title'), t('event_detail.could_not_save'));
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    setDeleting(true);
    await deleteEventImageIfOwned(event.image_url);
    try {
      const { error: deleteError } = await supabase.from('events').delete().eq('id', event.id);
      if (deleteError) throw deleteError;
      router.back();
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
      Alert.alert(t('common.error_title'), t('event_detail.could_not_delete'));
    }
  };

  const handleRegister = async () => {
    if (!event?.registration_url) return;
    try {
      await Linking.openURL(event.registration_url);
    } catch {
      Alert.alert(t('common.error_title'), t('event_detail.could_not_open_link'));
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 16, color: colors.textPrimary, textAlign: 'center', marginBottom: 20 }}>
          {error ? t('event_detail.could_not_load') : t('event_detail.not_found')}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={{ backgroundColor: colors.gold, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 }}
        >
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: colors.background }}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dateLabel = event.event_date
    ? formatMonthDayLabel(new Date(event.event_date), locale)
    : null;

  const attendeesLabel =
    (event.attendees_count ?? 0) === 1
      ? t('event_detail.attendees_one')
      : t('event_detail.attendees_count', { count: event.attendees_count ?? 0 });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
      >
        {/* ── Hero image with gradient + floating back button ─────── */}
        <View style={{ height: 260 }}>
          {event.image_url ? (
            <Image
              source={{ uri: event.image_url }}
              style={{ width: '100%', height: 260 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: '100%',
                height: 260,
                backgroundColor: colors.warningBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="calendar-outline" size={64} color={colors.warning} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', colors.background]}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 }}
          />

          {/* Floating back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            hitSlop={8}
            style={{
              position: 'absolute',
              top: insets.top + 8,
              left: 16,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(0,0,0,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Floating actions (save + admin) */}
          <View
            style={{
              position: 'absolute',
              top: insets.top + 8,
              right: 16,
              flexDirection: 'row',
              gap: 8,
            }}
          >
            {user && (
              <TouchableOpacity
                onPress={handleToggleSave}
                activeOpacity={0.8}
                hitSlop={8}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={isSaved ? colors.gold : '#fff'}
                />
              </TouchableOpacity>
            )}
            {isAdmin && (
              <TouchableOpacity
                onPress={() => setShowOptions(true)}
                activeOpacity={0.8}
                hitSlop={8}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Title ────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 26,
              color: colors.textPrimary,
              lineHeight: 34,
            }}
          >
            {event.title ?? ''}
          </Text>
        </View>

        {/* ── Info rows ────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginTop: 20, gap: 14 }}>
          {/* Date */}
          {dateLabel ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="calendar-outline" size={20} color={colors.gold} />
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary }}>
                {dateLabel}
              </Text>
            </View>
          ) : null}

          {/* Location */}
          {event.is_online ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="globe-outline" size={20} color={colors.gold} />
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.gold }}>
                {t('event_detail.online')}
              </Text>
            </View>
          ) : event.location ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                const q = encodeURIComponent(event.location!);
                Linking.openURL(`https://maps.apple.com/?q=${q}`).catch(() =>
                  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`)
                );
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <Ionicons name="location-outline" size={20} color={colors.gold} />
              <Text
                style={{
                  fontFamily: Fonts.bodySemiBold,
                  fontSize: 14,
                  color: colors.gold,
                  textDecorationLine: 'underline',
                  flex: 1,
                }}
                numberOfLines={2}
              >
                {event.location}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Attendees */}
          {(event.attendees_count ?? 0) > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="people-outline" size={20} color={colors.gold} />
              <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: colors.textSecondary }}>
                {attendeesLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Register button ──────────────────────────────────────── */}
        {event.registration_url ? (
          <TouchableOpacity
            onPress={handleRegister}
            activeOpacity={0.85}
            style={{
              marginHorizontal: 20,
              marginTop: 24,
              backgroundColor: colors.gold,
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: colors.background }}>
              {t('event_detail.register')}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* ── Description ──────────────────────────────────────────── */}
        {event.description ? (
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
              {t('event_detail.description')}
            </Text>
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 15,
                color: colors.textSecondary,
                lineHeight: 24,
              }}
            >
              {event.description}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* ── Admin options modal ───────────────────────────────────── */}
      <Modal
        visible={showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowOptions(false)}
        >
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: insets.bottom + 16,
              paddingTop: 20,
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: colors.textMuted,
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              {t('event_detail.options_title')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowOptions(false);
                router.push(`/create-event?id=${event.id}` as any);
              }}
              activeOpacity={0.7}
              style={{ paddingVertical: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <Ionicons name="pencil-outline" size={20} color={colors.textSecondary} />
              <Text style={{ fontFamily: Fonts.body, fontSize: 16, color: colors.textPrimary }}>
                {t('event_detail.edit')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowOptions(false);
                setShowDeleteConfirm(true);
              }}
              activeOpacity={0.7}
              style={{ paddingVertical: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 14 }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={{ fontFamily: Fonts.body, fontSize: 16, color: colors.error }}>
                {t('event_detail.delete')}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ── Delete confirm modal ──────────────────────────────────── */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setShowDeleteConfirm(false)}
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
            <Text
              style={{
                fontFamily: Fonts.heading,
                fontSize: 20,
                color: colors.textPrimary,
                textAlign: 'center',
                marginBottom: 10,
              }}
            >
              {t('event_detail.delete_confirm_title')}
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
              {t('event_detail.delete_confirm_body')}
            </Text>
            <TouchableOpacity
              onPress={handleDelete}
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
              {deleting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#fff' }}>
                  {t('event_detail.delete_confirm')}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDeleteConfirm(false)}
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
                {t('event_detail.delete_cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
