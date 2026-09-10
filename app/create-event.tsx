import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Fonts } from '../constants/fonts';

type EventType = 'in-person' | 'online';

// Returns a Date built from YYYY-MM-DD parts (local), or null if invalid.
// Rejects non-existent calendar dates (e.g. 2026-02-30) by checking for rollover.
function parseCalendarDate(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, mo - 1, d);
  // Rollover check: if JS auto-corrected the date (e.g. Feb 30 → Mar 2),
  // the year/month/day won't match what we supplied
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

// Returns { h, m } for a valid 24h HH:MM string, { h:0, m:0 } for an empty
// string (field is optional), or null for an invalid/malformed string.
function parseTime24(s: string): { h: number; m: number } | null {
  if (!s.trim()) return { h: 0, m: 0 };
  const tm = s.match(/^(\d{2}):(\d{2})$/);
  if (!tm) return null;
  const h = parseInt(tm[1], 10);
  const m = parseInt(tm[2], 10);
  if (h > 23 || m > 59) return null;
  return { h, m };
}

function formatScheduled(d: Date): string {
  return d.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [eventTitle, setEventTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState<EventType>('in-person');
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Validation ────────────────────────────────────────────────────────────
  const dateTouched = dateInput.trim().length > 0;
  const timeTouched = timeInput.trim().length > 0;

  const parsedDate = dateTouched ? parseCalendarDate(dateInput) : null;
  const parsedTime = parseTime24(timeInput); // null = invalid, {0,0} = empty/OK

  const dateError = dateTouched && parsedDate === null ? 'Enter a valid date' : null;
  const timeError = timeTouched && parsedTime === null ? 'Enter a valid time' : null;

  let scheduledDate: Date | null = null;
  if (parsedDate && parsedTime) {
    scheduledDate = new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
      parsedTime.h,
      parsedTime.m,
    );
  }

  const canSubmit =
    eventTitle.trim().length > 0 &&
    parsedDate !== null &&
    parsedTime !== null &&
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

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!user || !canSubmit || !scheduledDate) return;

    setSubmitting(true);
    const { error } = await supabase.from('events').insert({
      title: eventTitle.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      event_date: scheduledDate.toISOString(),
      is_online: eventType === 'online',
      image_url: imageUrl.trim() || null,
      created_by: user.id,
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Could not create event', error.message);
      return;
    }

    Alert.alert('Event Created', `"${eventTitle.trim()}" has been added to the events list.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
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
          {/* Page title */}
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 24,
              color: '#c9a84c',
              marginTop: 8,
            }}
          >
            Create Event
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

          {/* Date */}
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 8,
              }}
            >
              Date *
            </Text>
            <TextInput
              value={dateInput}
              onChangeText={setDateInput}
              placeholder="YYYY-MM-DD  (e.g. 2026-10-10)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              maxLength={10}
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

          {/* Time */}
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 8,
              }}
            >
              Time
            </Text>
            <TextInput
              value={timeInput}
              onChangeText={setTimeInput}
              placeholder="HH:MM  (24h, e.g. 18:00)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              maxLength={5}
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
            {timeError ? (
              <Text
                style={{
                  fontFamily: Fonts.body,
                  fontSize: 12,
                  color: '#EF4444',
                  marginTop: 4,
                }}
              >
                {timeError}
              </Text>
            ) : null}
          </View>

          {/* Scheduled confirmation */}
          {scheduledDate && !dateError && !timeError ? (
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 12,
                color: 'rgba(255,255,255,0.55)',
                marginTop: 6,
              }}
            >
              Scheduled for {formatScheduled(scheduledDate)}
            </Text>
          ) : null}

          {/* Image URL */}
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontFamily: Fonts.bodySemiBold,
                fontSize: 13,
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 8,
              }}
            >
              Image URL
            </Text>
            <TextInput
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://... (optional)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              autoCapitalize="none"
              keyboardType="url"
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

          {/* Submit */}
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
                Create Event
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
