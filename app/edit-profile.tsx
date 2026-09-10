import { useCallback, useEffect, useRef, useState } from 'react';
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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getInitials } from '../lib/avatar';
import { pickAndUploadImage } from '../lib/upload';
import { Fonts } from '../constants/fonts';

const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;

type UsernameStatus =
  | 'idle'          // empty or unchanged — show nothing
  | 'invalid'       // fails regex
  | 'checking'      // debounce in flight
  | 'taken'         // check complete, unavailable
  | 'available';    // check complete, free

function isUniqueViolation(err: { code?: string; message?: string }): boolean {
  if (err.code === '23505') return true;
  const msg = (err.message ?? '').toLowerCase();
  return msg.includes('username') && (msg.includes('duplicate') || msg.includes('unique'));
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  // ── Field state ─────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [role, setRole] = useState(profile?.role ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');

  // ── Touch tracking (inline errors only after field visited) ─────────────────
  const [fullNameTouched, setFullNameTouched] = useState(false);

  // ── Username availability ────────────────────────────────────────────────────
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUsername = profile?.username ?? '';

  // ── Photo upload state ───────────────────────────────────────────────────────
  const [pickedAvatarUrl, setPickedAvatarUrl] = useState<string | null>(null);
  const [pickedCoverUrl, setPickedCoverUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);

  // ── Username change handler ──────────────────────────────────────────────────
  const handleUsernameChange = useCallback(
    (raw: string) => {
      const val = raw.toLowerCase();
      setUsername(val);

      // Clear any pending debounced check
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }

      if (!val) {
        setUsernameStatus('idle');
        return;
      }

      if (!USERNAME_REGEX.test(val)) {
        setUsernameStatus('invalid');
        return;
      }

      // Unchanged from current profile — no check needed
      if (val === currentUsername) {
        setUsernameStatus('idle');
        return;
      }

      // New valid value — debounce the availability check
      setUsernameStatus('checking');
      debounceTimer.current = setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', val)
            .neq('id', user!.id)
            .maybeSingle();

          if (error) {
            console.warn('[EditProfile] username check error:', error.message);
            // Treat as unknown — don't block submission
            setUsernameStatus('idle');
            return;
          }

          setUsernameStatus(data ? 'taken' : 'available');
        } catch (e) {
          console.warn('[EditProfile] username check threw:', e);
          setUsernameStatus('idle');
        }
      }, 400);
    },
    [currentUsername, user],
  );

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // ── Derived validation ───────────────────────────────────────────────────────
  const fullNameTrimmed = fullName.trim();
  const fullNameError = fullNameTouched && fullNameTrimmed.length === 0
    ? 'Full name is required'
    : null;

  const canSave =
    fullNameTrimmed.length > 0 &&
    USERNAME_REGEX.test(username) &&
    usernameStatus !== 'taken' &&
    usernameStatus !== 'checking' &&
    !submitting &&
    !uploadingAvatar &&
    !uploadingCover;

  // ── Submit handler ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user || !canSave) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullNameTrimmed,
        username: username,
        role: role.trim() || null,
        location: location.trim() || null,
        bio: bio.trim() || null,
        avatar_url: pickedAvatarUrl ?? profile?.avatar_url ?? null,
        cover_url: pickedCoverUrl ?? profile?.cover_url ?? null,
      })
      .eq('id', user.id);
    setSubmitting(false);

    if (error) {
      if (isUniqueViolation(error)) {
        // Surface inline rather than showing a generic Alert
        setUsernameStatus('taken');
        return;
      }
      Alert.alert('Could not update profile', error.message);
      return;
    }

    // Await so profile data is fresh before the previous screen re-mounts
    await refreshProfile();
    router.back();
  };

  // ── Username feedback text / color ───────────────────────────────────────────
  let usernameHint: string | null = null;
  let usernameHintColor = 'rgba(255,255,255,0.55)';

  if (username.length > 0) {
    if (usernameStatus === 'invalid') {
      usernameHint = '3-30 characters: letters, numbers, _ or -';
      usernameHintColor = '#EF4444';
    } else if (usernameStatus === 'checking') {
      usernameHint = 'Checking availability...';
      usernameHintColor = 'rgba(255,255,255,0.55)';
    } else if (usernameStatus === 'taken') {
      usernameHint = 'Username already taken';
      usernameHintColor = '#EF4444';
    } else if (usernameStatus === 'available') {
      usernameHint = 'Username available';
      usernameHintColor = '#16A34A';
    }
    // 'idle' with content means either unchanged or check-error passthrough — no hint
  }

  // ── Input style ──────────────────────────────────────────────────────────────
  const inputStyle = {
    backgroundColor: '#1c1a14',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.22)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 14,
  } as const;

  const labelStyle = {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 8,
  } as const;

  const errorStyle = {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  } as const;

  // ── Render ───────────────────────────────────────────────────────────────────
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
              marginBottom: 20,
            }}
          >
            Edit Profile
          </Text>

          {/* ── Cover banner + Avatar ──────────────────────────────────────── */}
          {/*
            Negative horizontal margin escapes the ScrollView's px-5 padding.
            Avatar is in NORMAL DOCUMENT FLOW (not absolute) so its hit area
            is correctly computed by React Native. marginTop: -44 produces the
            visual overlap (44px of the 88px circle sits over the banner).
          */}
          <View style={{ marginHorizontal: -20, marginBottom: 24 }}>
            {/* Cover banner — full Pressable, disabled while uploading */}
            <Pressable
              disabled={uploadingCover}
              onPress={async () => {
                if (!user) return;
                setUploadingCover(true);
                const result = await pickAndUploadImage(user.id, 'cover', { aspect: [16, 9] });
                setUploadingCover(false);
                if ('error' in result) {
                  Alert.alert('Could not update photo', result.error);
                } else if ('url' in result) {
                  setPickedCoverUrl(result.url);
                }
                // cancelled: do nothing
              }}
              style={({ pressed }) => ({
                height: 140,
                backgroundColor: '#1c1a14',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(201,168,76,0.12)',
                overflow: 'hidden',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              {/* Cover image: picked → existing → placeholder */}
              {pickedCoverUrl || profile?.cover_url ? (
                <Image
                  source={{ uri: pickedCoverUrl ?? profile!.cover_url! }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="camera-outline" size={32} color="rgba(255,255,255,0.25)" />
              )}

              {/* Uploading overlay */}
              {uploadingCover && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActivityIndicator color="#c9a84c" size="large" />
                </View>
              )}

              {/* Cover edit badge — bottom-right */}
              {!uploadingCover && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 14,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: '#0a0900',
                    borderWidth: 1,
                    borderColor: 'rgba(201,168,76,0.35)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="pencil" size={12} color="#c9a84c" />
                </View>
              )}
            </Pressable>

            {/*
              Avatar — normal-flow Pressable with marginTop: -44 for visual overlap.
              alignSelf: 'flex-start' prevents it from stretching full width.
              React Native computes the hit rect correctly from the flow position;
              no overflow-clipping issue.
            */}
            <Pressable
              disabled={uploadingAvatar}
              onPress={async () => {
                if (!user) return;
                setUploadingAvatar(true);
                const result = await pickAndUploadImage(user.id, 'avatar', { aspect: [1, 1] });
                setUploadingAvatar(false);
                if ('error' in result) {
                  Alert.alert('Could not update photo', result.error);
                } else if ('url' in result) {
                  setPickedAvatarUrl(result.url);
                }
                // cancelled: do nothing
              }}
              style={({ pressed }) => ({
                marginTop: -44,
                marginLeft: 20,
                alignSelf: 'flex-start',
                width: 88,
                height: 88,
                opacity: pressed && !uploadingAvatar ? 0.85 : 1,
              })}
            >
              {/* Circle: picked → existing → initials */}
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: '#1c1a14',
                  borderWidth: 2,
                  borderColor: '#0a0900',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {pickedAvatarUrl || profile?.avatar_url ? (
                  <Image
                    source={{ uri: pickedAvatarUrl ?? profile!.avatar_url! }}
                    style={{ width: 88, height: 88 }}
                  />
                ) : (
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 28, color: '#FFFFFF' }}>
                    {getInitials(profile?.full_name, profile?.username)}
                  </Text>
                )}

                {/* Uploading overlay */}
                {uploadingAvatar && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.55)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ActivityIndicator color="#c9a84c" size="small" />
                  </View>
                )}
              </View>

              {/* Avatar edit badge — bottom-right of the circle */}
              {!uploadingAvatar && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: '#0a0900',
                    borderWidth: 1,
                    borderColor: 'rgba(201,168,76,0.35)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="pencil" size={10} color="#c9a84c" />
                </View>
              )}
            </Pressable>
          </View>

          {/* Full Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={labelStyle}>Full Name *</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              onBlur={() => setFullNameTouched(true)}
              placeholder="Your full name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              maxLength={100}
              style={inputStyle}
            />
            {fullNameError ? <Text style={errorStyle}>{fullNameError}</Text> : null}
          </View>

          {/* Username */}
          <View style={{ marginBottom: 16 }}>
            <Text style={labelStyle}>Username *</Text>
            <TextInput
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="your_handle"
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              style={inputStyle}
            />
            {usernameHint ? (
              <Text style={[{ fontFamily: Fonts.body, fontSize: 12, marginTop: 4 }, { color: usernameHintColor }]}>
                {usernameHint}
              </Text>
            ) : null}
          </View>

          {/* Role */}
          <View style={{ marginBottom: 16 }}>
            <Text style={labelStyle}>Role</Text>
            <TextInput
              value={role}
              onChangeText={setRole}
              placeholder="e.g. Entrepreneur, Investor, Mentor"
              placeholderTextColor="rgba(255,255,255,0.4)"
              maxLength={60}
              style={inputStyle}
            />
          </View>

          {/* Location */}
          <View style={{ marginBottom: 16 }}>
            <Text style={labelStyle}>Location</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Miami, FL"
              placeholderTextColor="rgba(255,255,255,0.4)"
              maxLength={100}
              style={inputStyle}
            />
          </View>

          {/* Bio */}
          <View style={{ marginBottom: 8 }}>
            <Text style={labelStyle}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell the community who you are..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              maxLength={300}
              style={[inputStyle, { minHeight: 90, textAlignVertical: 'top' }]}
            />
            {/* Character counter */}
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 12,
                color: bio.length > 280 ? '#EF4444' : 'rgba(255,255,255,0.55)',
                marginTop: 4,
                textAlign: 'right',
              }}
            >
              {bio.length}/300
            </Text>
          </View>

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={{
              backgroundColor: '#c9a84c',
              borderRadius: 8,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 24,
              marginBottom: 8,
              opacity: canSave ? 1 : 0.45,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#0a0900" size="small" />
            ) : (
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: '#0a0900' }}>
                Save
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
