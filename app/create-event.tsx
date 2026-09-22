import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { pickAndUploadImage, deleteEventImageIfOwned } from '../lib/upload';
import { Fonts } from '../constants/fonts';
import { useColors } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDateFull, formatTime } from '../lib/dateFormat';

type EventType = 'in-person' | 'online';

/** Round up to the next full hour so the default date is always in the future. */
function getDefaultEventDate(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t, locale } = useLanguage();
  const colors = useColors();

  // Optional `id` param — present in edit mode, absent in create mode.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  // ── Form state ────────────────────────────────────────────────────────────
  const [eventTitle, setEventTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState<EventType>('in-person');

  // Single Date object; date picker updates year/month/day, time picker updates h/m.
  const [eventDate, setEventDate] = useState<Date>(getDefaultEventDate);
  // Tracks the original event_date fetched in edit mode for the past-date guard.
  const [originalEventDate, setOriginalEventDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  // Captures the image_url at load time in edit mode; never mutated by user actions.
  // Used to detect whether the admin changed the image so the old file can be deleted.
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const [registrationUrl, setRegistrationUrl] = useState('');

  // Loading state only applies while fetching an existing event in edit mode.
  const [loadingEvent, setLoadingEvent] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch existing event in edit mode ─────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (cancelled) return;
        if (error || !data) {
          Alert.alert(
            t('create_event.could_not_load'),
            error?.message ?? t('create_event.event_not_found'),
            [{ text: t('common.ok'), onPress: () => router.back() }],
          );
          return;
        }

        setEventTitle(data.title ?? '');
        setDescription(data.description ?? '');
        setLocation(data.location ?? '');
        setEventType(data.is_online ? 'online' : 'in-person');
        if (data.event_date) {
          const d = new Date(data.event_date);
          setEventDate(d);
          setOriginalEventDate(d);
        }
        setImageUrl(data.image_url ?? null);
        setOriginalImageUrl(data.image_url ?? null);
        setRegistrationUrl(data.registration_url ?? '');
      } catch (e) {
        if (!cancelled) {
          Alert.alert(t('create_event.could_not_load'), t('create_event.please_try_again'), [
            { text: t('common.ok'), onPress: () => router.back() },
          ]);
        }
      } finally {
        if (!cancelled) setLoadingEvent(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ── Validation ────────────────────────────────────────────────────────────
  // Past-date guard:
  //   Create mode — always check: the chosen date must be in the future.
  //   Edit mode   — only check if the admin changed the date from its original value.
  //                 Editing a past event (e.g. to fix its description) must not be blocked.
  const dateError = (() => {
    if (!isEditing) {
      return eventDate < new Date() ? t('create_event.date_past_error') : null;
    }
    // Edit: original date unchanged → no error (even if the event is already past).
    if (
      originalEventDate !== null &&
      eventDate.getTime() === originalEventDate.getTime()
    ) {
      return null;
    }
    return eventDate < new Date() ? t('create_event.date_past_error') : null;
  })();

  const registrationUrlTouched = registrationUrl.trim().length > 0;
  const registrationUrlError =
    registrationUrlTouched &&
    !registrationUrl.trim().startsWith('http://') &&
    !registrationUrl.trim().startsWith('https://')
      ? t('create_event.url_invalid_error')
      : null;

  const canSubmit =
    eventTitle.trim().length > 0 &&
    !dateError &&
    !registrationUrlError &&
    !imageUploading &&
    !submitting;

  // ── Non-admin guard ───────────────────────────────────────────────────────
  if (profile?.is_admin !== true) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
          >
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 15,
              color: colors.textPrimary,
              textAlign: 'center',
            }}
          >
            {t('create_event.no_access')}
          </Text>
        </View>
      </View>
    );
  }

  // ── Loading state (edit mode only, while fetching the existing event) ─────
  if (loadingEvent) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
          >
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      </View>
    );
  }

  // ── Date / time picker handlers ───────────────────────────────────────────
  // Android: system dialog closes automatically; iOS: spinner stays open until Done tapped.
  // On 'dismissed' (Android cancel) no state update.

  const onDateChange = (_evt: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (_evt.type === 'set' && selectedDate) {
      setEventDate((prev) => {
        const next = new Date(prev);
        next.setFullYear(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
        );
        return next;
      });
    }
  };

  const onTimeChange = (_evt: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (_evt.type === 'set' && selectedDate) {
      setEventDate((prev) => {
        const next = new Date(prev);
        next.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
        return next;
      });
    }
  };

  // ── Image upload ──────────────────────────────────────────────────────────
  const handlePickImage = async () => {
    if (!user?.id) return;
    setImageUploading(true);
    try {
      const result = await pickAndUploadImage(user.id, 'events', { aspect: [16, 9] });
      if ('url' in result) {
        setImageUrl(result.url);
      } else if ('error' in result) {
        Alert.alert(t('create_event.could_not_upload_image'), result.error);
      }
      // 'cancelled' → do nothing
    } catch {
      Alert.alert(t('create_event.could_not_upload_image'), t('create_event.please_try_again'));
    } finally {
      setImageUploading(false);
    }
  };

  // ── Submit (INSERT in create mode, UPDATE in edit mode) ───────────────────
  async function handleSubmit() {
    if (!user || !canSubmit) return;
    setSubmitting(true);
    try {
      if (isEditing && id) {
        // Edit mode — UPDATE existing event
        const { error } = await supabase
          .from('events')
          .update({
            title: eventTitle.trim(),
            description: description.trim() || null,
            location: location.trim() || null,
            event_date: eventDate.toISOString(),
            is_online: eventType === 'online',
            image_url: imageUrl,
            registration_url: registrationUrl.trim() || null,
          })
          .eq('id', id);
        if (error) throw error;
        // UPDATE succeeded — clean up the old image if the admin replaced or removed it.
        // Fire-and-forget: cleanup failure must never block or revert the successful save.
        if (originalImageUrl !== imageUrl) {
          void deleteEventImageIfOwned(originalImageUrl);
        }
        Alert.alert(t('create_event.event_updated'), undefined, [{ text: t('common.ok'), onPress: () => router.back() }]);
      } else {
        // Create mode — INSERT new event
        const { error } = await supabase.from('events').insert({
          title: eventTitle.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          event_date: eventDate.toISOString(),
          is_online: eventType === 'online',
          image_url: imageUrl,
          registration_url: registrationUrl.trim() || null,
          created_by: user.id,
        });
        if (error) throw error;
        Alert.alert(
          t('create_event.event_created'),
          t('create_event.event_created_body', { title: eventTitle.trim() }),
          [{ text: t('common.ok'), onPress: () => router.back() }],
        );
      }
    } catch (e: unknown) {
      Alert.alert(
        isEditing ? t('create_event.could_not_update') : t('create_event.could_not_create'),
        e instanceof Error ? e.message : t('common.unknown_error'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Top bar */}
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Page title — changes per mode */}
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 24,
              color: colors.gold,
              marginTop: 8,
            }}
          >
            {isEditing ? t('create_event.title_edit') : t('create_event.title_create')}
          </Text>

          {/* Title */}
          <View style={{ marginTop: 24 }}>
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: colors.textMuted,
                marginBottom: 8,
              }}
            >
              {t('create_event.label_title')}
            </Text>
            <TextInput
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder={t('create_event.placeholder_title')}
              placeholderTextColor={colors.textFaint}
              maxLength={200}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: colors.textPrimary,
                fontFamily: Fonts.body,
                fontSize: 14,
              }}
            />
          </View>

          {/* Description */}
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: colors.textMuted,
                marginBottom: 8,
              }}
            >
              {t('create_event.label_description')}
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t('create_event.placeholder_description')}
              placeholderTextColor={colors.textFaint}
              multiline
              maxLength={2000}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: colors.textPrimary,
                fontFamily: Fonts.body,
                fontSize: 14,
                minHeight: 88,
                textAlignVertical: 'top',
              }}
            />
          </View>

          {/* Location */}
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: colors.textMuted,
                marginBottom: 8,
              }}
            >
              {t('create_event.label_location')}
            </Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder={t('create_event.placeholder_location')}
              placeholderTextColor={colors.textFaint}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: colors.textPrimary,
                fontFamily: Fonts.body,
                fontSize: 14,
              }}
            />
          </View>

          {/* Event type pills */}
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: colors.textMuted,
                marginBottom: 8,
              }}
            >
              {t('create_event.label_event_type')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['in-person', 'online'] as EventType[]).map((type) => {
                const active = eventType === type;
                const label = type === 'in-person' ? t('events.in_person') : t('home.online');
                return (
                  <Pressable
                    key={type}
                    onPress={() => setEventType(type)}
                    style={{
                      backgroundColor: active ? colors.gold : colors.surface,
                      borderWidth: active ? 0 : 1,
                      borderColor: colors.border,
                      borderRadius: 999,
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: active ? Fonts.bodyBold : Fonts.bodySemiBold,
                        fontSize: 14,
                        color: active ? colors.background : colors.textPrimary,
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Date & Time — two tappable fields side by side */}
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: colors.textMuted,
                marginBottom: 8,
              }}
            >
              {t('create_event.label_date_time')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Date field */}
              <TouchableOpacity
                onPress={() => {
                  setShowTimePicker(false);
                  setShowDatePicker((v) => !v);
                }}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: dateError ? colors.error : colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                }}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                <Text
                  style={{
                    fontFamily: Fonts.body,
                    fontSize: 13,
                    color: colors.textPrimary,
                    flexShrink: 1,
                  }}
                  numberOfLines={1}
                >
                  {formatDateFull(eventDate, locale)}
                </Text>
              </TouchableOpacity>

              {/* Time field */}
              <TouchableOpacity
                onPress={() => {
                  setShowDatePicker(false);
                  setShowTimePicker((v) => !v);
                }}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                }}
              >
                <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textPrimary }}>
                  {formatTime(eventDate, locale)}
                </Text>
              </TouchableOpacity>
            </View>

            {dateError ? (
              <Text
                style={{
                  fontFamily: Fonts.body,
                  fontSize: 12,
                  color: colors.error,
                  marginTop: 4,
                }}
              >
                {dateError}
              </Text>
            ) : null}
          </View>

          {/* DateTimePicker — date
              Android: system dialog, closes itself on confirm/dismiss.
              iOS: spinner inline; Done button hides it. */}
          {showDatePicker ? (
            <>
              {Platform.OS === 'ios' ? (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  activeOpacity={0.7}
                  style={{ alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4 }}
                >
                  <Text
                    style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.gold }}
                  >
                    {t('create_event.done')}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <DateTimePicker
                value={eventDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={isEditing ? undefined : new Date()}
                onChange={onDateChange}
              />
            </>
          ) : null}

          {/* DateTimePicker — time */}
          {showTimePicker ? (
            <>
              {Platform.OS === 'ios' ? (
                <TouchableOpacity
                  onPress={() => setShowTimePicker(false)}
                  activeOpacity={0.7}
                  style={{ alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4 }}
                >
                  <Text
                    style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.gold }}
                  >
                    {t('create_event.done')}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <DateTimePicker
                value={eventDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                is24Hour={false}
                onChange={onTimeChange}
              />
            </>
          ) : null}

          {/* Event Image — upload area (shows existing preview in edit mode) */}
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: colors.textMuted,
                marginBottom: 8,
              }}
            >
              {t('create_event.label_image')}
            </Text>
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={imageUploading}
              activeOpacity={0.7}
              style={{
                width: '100%',
                aspectRatio: 16 / 9,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {imageUploading ? (
                <ActivityIndicator color={colors.gold} size="large" />
              ) : imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <Ionicons name="image-outline" size={32} color={colors.textFaint} />
                  <Text
                    style={{
                      fontFamily: Fonts.body,
                      fontSize: 13,
                      color: colors.textFaint,
                    }}
                  >
                    {t('create_event.add_image')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {imageUrl ? (
              <TouchableOpacity
                onPress={() => setImageUrl(null)}
                activeOpacity={0.7}
                style={{ alignSelf: 'flex-end', marginTop: 6 }}
              >
                <Text
                  style={{
                    fontFamily: Fonts.body,
                    fontSize: 12,
                    color: colors.textTertiary,
                  }}
                >
                  {t('create_event.remove_image')}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Registration link */}
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: colors.textMuted,
                marginBottom: 8,
              }}
            >
              {t('create_event.label_registration_link')}
            </Text>
            <TextInput
              value={registrationUrl}
              onChangeText={setRegistrationUrl}
              placeholder="https://..."
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              keyboardType="url"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: registrationUrlError
                  ? colors.error
                  : colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: colors.textPrimary,
                fontFamily: Fonts.body,
                fontSize: 14,
              }}
            />
            {registrationUrlError ? (
              <Text
                style={{
                  fontFamily: Fonts.body,
                  fontSize: 12,
                  color: colors.error,
                  marginTop: 4,
                }}
              >
                {registrationUrlError}
              </Text>
            ) : null}
          </View>

          {/* Submit — label changes per mode */}
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={{
              backgroundColor: colors.gold,
              borderRadius: 8,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 24,
              marginBottom: 8,
              opacity: canSubmit ? 1 : 0.45,
            }}
          >
            {submitting ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text
                style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: colors.background }}
              >
                {isEditing ? t('create_event.submit_save') : t('create_event.submit_create')}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
