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
import { pickAndUploadImage } from '../lib/upload';
import { Fonts } from '../constants/fonts';

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
            'Could not load event',
            error?.message ?? 'Event not found',
            [{ text: 'OK', onPress: () => router.back() }],
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
        setRegistrationUrl(data.registration_url ?? '');
      } catch (e) {
        if (!cancelled) {
          Alert.alert('Could not load event', 'Please try again.', [
            { text: 'OK', onPress: () => router.back() },
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
      return eventDate < new Date() ? "Event date can't be in the past" : null;
    }
    // Edit: original date unchanged → no error (even if the event is already past).
    if (
      originalEventDate !== null &&
      eventDate.getTime() === originalEventDate.getTime()
    ) {
      return null;
    }
    return eventDate < new Date() ? "Event date can't be in the past" : null;
  })();

  const registrationUrlTouched = registrationUrl.trim().length > 0;
  const registrationUrlError =
    registrationUrlTouched &&
    !registrationUrl.trim().startsWith('http://') &&
    !registrationUrl.trim().startsWith('https://')
      ? 'Enter a valid URL starting with http:// or https://'
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
      <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
        <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
          >
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
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
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            You don't have access to this page.
          </Text>
        </View>
      </View>
    );
  }

  // ── Loading state (edit mode only, while fetching the existing event) ─────
  if (loadingEvent) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
        <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
          >
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#c9a84c" size="large" />
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
        Alert.alert('Could not upload image', result.error);
      }
      // 'cancelled' → do nothing
    } catch {
      Alert.alert('Could not upload image', 'Please try again.');
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
        Alert.alert('Event updated', undefined, [{ text: 'OK', onPress: () => router.back() }]);
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
          'Event Created',
          `"${eventTitle.trim()}" has been added to the events list.`,
          [{ text: 'OK', onPress: () => router.back() }],
        );
      }
    } catch (e: unknown) {
      Alert.alert(
        isEditing ? 'Could not update event' : 'Could not create event',
        e instanceof Error ? e.message : 'Unknown error',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
      {/* Top bar */}
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'flex-start' })}
        >
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
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
              color: '#c9a84c',
              marginTop: 8,
            }}
          >
            {isEditing ? 'Edit Event' : 'Create Event'}
          </Text>

          {/* Title */}
          <View style={{ marginTop: 24 }}>
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 8,
              }}
            >
              Title *
            </Text>
            <TextInput
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder="Event title"
              placeholderTextColor="rgba(255,255,255,0.35)"
              maxLength={200}
              style={{
                backgroundColor: '#1c1a14',
                borderWidth: 1,
                borderColor: 'rgba(201,168,76,0.22)',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: '#FFFFFF',
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
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 8,
              }}
            >
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What's this event about?"
              placeholderTextColor="rgba(255,255,255,0.35)"
              multiline
              maxLength={2000}
              style={{
                backgroundColor: '#1c1a14',
                borderWidth: 1,
                borderColor: 'rgba(201,168,76,0.22)',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: '#FFFFFF',
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
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 8,
              }}
            >
              Location
            </Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Miami, FL or Online — Zoom"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={{
                backgroundColor: '#1c1a14',
                borderWidth: 1,
                borderColor: 'rgba(201,168,76,0.22)',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: '#FFFFFF',
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
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 8,
              }}
            >
              Event Type
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['in-person', 'online'] as EventType[]).map((type) => {
                const active = eventType === type;
                const label = type === 'in-person' ? 'In-Person' : 'Online';
                return (
                  <Pressable
                    key={type}
                    onPress={() => setEventType(type)}
                    style={{
                      backgroundColor: active ? '#c9a84c' : '#1c1a14',
                      borderWidth: active ? 0 : 1,
                      borderColor: 'rgba(201,168,76,0.22)',
                      borderRadius: 999,
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: active ? Fonts.bodyBold : Fonts.bodySemiBold,
                        fontSize: 14,
                        color: active ? '#0a0900' : '#FFFFFF',
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
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 8,
              }}
            >
              Date & Time *
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
                  backgroundColor: '#1c1a14',
                  borderWidth: 1,
                  borderColor: dateError ? '#EF4444' : 'rgba(201,168,76,0.22)',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                }}
              >
                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.55)" />
                <Text
                  style={{
                    fontFamily: Fonts.body,
                    fontSize: 13,
                    color: '#FFFFFF',
                    flexShrink: 1,
                  }}
                  numberOfLines={1}
                >
                  {eventDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
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
                  backgroundColor: '#1c1a14',
                  borderWidth: 1,
                  borderColor: 'rgba(201,168,76,0.22)',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                }}
              >
                <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.55)" />
                <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: '#FFFFFF' }}>
                  {eventDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {dateError ? (
              <Text
                style={{
                  fontFamily: Fonts.body,
                  fontSize: 12,
                  color: '#EF4444',
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
                    style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#c9a84c' }}
                  >
                    Done
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
                    style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#c9a84c' }}
                  >
                    Done
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
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 8,
              }}
            >
              Event Image
            </Text>
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={imageUploading}
              activeOpacity={0.7}
              style={{
                width: '100%',
                aspectRatio: 16 / 9,
                backgroundColor: '#1c1a14',
                borderWidth: 1,
                borderColor: 'rgba(201,168,76,0.22)',
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {imageUploading ? (
                <ActivityIndicator color="#c9a84c" size="large" />
              ) : imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <Ionicons name="image-outline" size={32} color="rgba(255,255,255,0.35)" />
                  <Text
                    style={{
                      fontFamily: Fonts.body,
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    Add event image
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
                    color: 'rgba(255,255,255,0.45)',
                  }}
                >
                  Remove
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
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 8,
              }}
            >
              Registration link (optional)
            </Text>
            <TextInput
              value={registrationUrl}
              onChangeText={setRegistrationUrl}
              placeholder="https://..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              autoCapitalize="none"
              keyboardType="url"
              style={{
                backgroundColor: '#1c1a14',
                borderWidth: 1,
                borderColor: registrationUrlError
                  ? '#EF4444'
                  : 'rgba(201,168,76,0.22)',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: '#FFFFFF',
                fontFamily: Fonts.body,
                fontSize: 14,
              }}
            />
            {registrationUrlError ? (
              <Text
                style={{
                  fontFamily: Fonts.body,
                  fontSize: 12,
                  color: '#EF4444',
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
              backgroundColor: '#c9a84c',
              borderRadius: 8,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 24,
              marginBottom: 8,
              opacity: canSubmit ? 1 : 0.45,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#0a0900" size="small" />
            ) : (
              <Text
                style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: '#0a0900' }}
              >
                {isEditing ? 'Save Changes' : 'Create Event'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
