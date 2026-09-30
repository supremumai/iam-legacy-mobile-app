import { useRef, useState } from 'react';
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
import { useColors } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import SearchableSelect from '../components/SearchableSelect';
import { US_STATES, STATE_MAP } from '../constants/us-locations';


export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const colors = useColors();
  const { t } = useLanguage();

  // ── Original values (for dirty tracking) ────────────────────────────────────
  const originalRef = useRef({
    fullName: profile?.full_name ?? '',
    role: profile?.role ?? '',
    location: profile?.location ?? '',
    bio: profile?.bio ?? '',
  });

  // ── Parse existing location into state/city if it matches "City, ST" ─────────
  const parseLocation = (loc: string) => {
    const match = loc.match(/^(.+),\s*([A-Z]{2})$/);
    if (match) {
      const stateCode = match[2];
      const cityName = match[1].trim();
      if (STATE_MAP[stateCode]) return { state: stateCode, city: cityName };
    }
    return { state: '', city: '' };
  };

  const { state: initState, city: initCity } = parseLocation(profile?.location ?? '');

  // ── Field state ─────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [role, setRole] = useState(profile?.role ?? '');
  const [selectedState, setSelectedState] = useState(initState);
  const [selectedCity, setSelectedCity] = useState(initCity);
  const [bio, setBio] = useState(profile?.bio ?? '');

  const location = selectedState
    ? selectedCity
      ? `${selectedCity}, ${selectedState}`
      : selectedState
    : profile?.location ?? '';

  // ── Touch tracking (inline errors only after field visited) ─────────────────
  const [fullNameTouched, setFullNameTouched] = useState(false);

  // ── Photo upload state ───────────────────────────────────────────────────────
  const [pickedAvatarUrl, setPickedAvatarUrl] = useState<string | null>(null);
  const [pickedCoverUrl, setPickedCoverUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Derived validation ───────────────────────────────────────────────────────
  const fullNameTrimmed = fullName.trim();
  const fullNameError = fullNameTouched && fullNameTrimmed.length === 0
    ? t('edit_profile.full_name_required')
    : null;

  const isDirty =
    fullName !== originalRef.current.fullName ||
    role !== originalRef.current.role ||
    location !== originalRef.current.location ||
    bio !== originalRef.current.bio ||
    pickedAvatarUrl !== null ||
    pickedCoverUrl !== null;

  const canSave =
    isDirty &&
    fullNameTrimmed.length > 0 &&
    !submitting &&
    !uploadingAvatar &&
    !uploadingCover;

  // ── Submit handler ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user || !canSave) return;
    setSaveError(null);

    setSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullNameTrimmed,
        role: role.trim() || null,
        location: location.trim() || null,
        bio: bio.trim() || null,
        avatar_url: pickedAvatarUrl ?? profile?.avatar_url ?? null,
        cover_url: pickedCoverUrl ?? profile?.cover_url ?? null,
      })
      .eq('id', user.id);
    setSubmitting(false);

    if (error) {
      setSaveError(error.message);
      return;
    }

    await refreshProfile();
    router.back();
  };

  // ── Input style ──────────────────────────────────────────────────────────────
  const inputStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 14,
  } as const;

  const labelStyle = {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  } as const;

  const errorStyle = {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  } as const;

  // ── Render ───────────────────────────────────────────────────────────────────
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Page title */}
          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 24,
              color: colors.gold,
              marginTop: 8,
              marginBottom: 20,
            }}
          >
            {t('edit_profile.title')}
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
                  Alert.alert(t('edit_profile.photo_error'), result.error);
                } else if ('url' in result) {
                  setPickedCoverUrl(result.url);
                }
                // cancelled: do nothing
              }}
              style={({ pressed }) => ({
                height: 140,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
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
                <Ionicons name="camera-outline" size={32} color={colors.textFaint} />
              )}

              {/* Uploading overlay */}
              {uploadingCover && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: colors.overlay,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActivityIndicator color={colors.gold} size="large" />
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
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="pencil" size={12} color={colors.gold} />
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
                  Alert.alert(t('edit_profile.photo_error'), result.error);
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
                  backgroundColor: colors.surface,
                  borderWidth: 2,
                  borderColor: colors.background,
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
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 28, color: colors.textPrimary }}>
                    {getInitials(profile?.full_name)}
                  </Text>
                )}

                {/* Uploading overlay */}
                {uploadingAvatar && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: colors.overlay,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ActivityIndicator color={colors.gold} size="small" />
                  </View>
                )}
              </View>

              {/* Avatar edit badge — bottom-right of the circle */}
              {!uploadingAvatar && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#c9a84c',
                    borderWidth: 2,
                    borderColor: '#0a0900',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="camera" size={13} color="#0a0900" />
                </View>
              )}
            </Pressable>
          </View>

          {/* Full Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={labelStyle}>{t('edit_profile.label_full_name')}</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              onBlur={() => setFullNameTouched(true)}
              placeholder={t('edit_profile.placeholder_full_name')}
              placeholderTextColor={colors.textTertiary}
              maxLength={100}
              style={inputStyle}
            />
            {fullNameError ? <Text style={errorStyle}>{fullNameError}</Text> : null}
          </View>

          {/* Role */}
          <View style={{ marginBottom: 16 }}>
            <Text style={labelStyle}>{t('edit_profile.label_role')}</Text>
            <TextInput
              value={role}
              onChangeText={setRole}
              placeholder={t('edit_profile.placeholder_role')}
              placeholderTextColor={colors.textTertiary}
              maxLength={60}
              style={inputStyle}
            />
          </View>

          {/* Location — Estado + Ciudad */}
          <SearchableSelect
            label={t('edit_profile.label_state')}
            placeholder={t('edit_profile.placeholder_state')}
            value={selectedState ? (STATE_MAP[selectedState]?.name ?? selectedState) : ''}
            options={US_STATES.map((s) => s.name)}
            onChange={(name) => {
              const found = US_STATES.find((s) => s.name === name);
              setSelectedState(found?.code ?? '');
              setSelectedCity('');
            }}
          />
          <SearchableSelect
            label={t('edit_profile.label_city')}
            placeholder={t('edit_profile.placeholder_city')}
            value={selectedCity}
            options={selectedState ? (STATE_MAP[selectedState]?.cities ?? []) : []}
            disabled={!selectedState}
            onChange={setSelectedCity}
          />

          {/* Bio */}
          <View style={{ marginBottom: 8 }}>
            <Text style={labelStyle}>{t('edit_profile.label_bio')}</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder={t('edit_profile.placeholder_bio')}
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={300}
              style={[inputStyle, { minHeight: 90, textAlignVertical: 'top' }]}
            />
            {/* Character counter */}
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 12,
                color: bio.length > 280 ? colors.error : colors.textMuted,
                marginTop: 4,
                textAlign: 'right',
              }}
            >
              {bio.length}/300
            </Text>
          </View>

          {/* Inline save error */}
          {saveError ? (
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 13,
                color: colors.error,
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              {saveError}
            </Text>
          ) : null}

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={{
              backgroundColor: colors.gold,
              borderRadius: 8,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 24,
              marginBottom: 8,
              opacity: canSave ? 1 : 0.45,
            }}
          >
            {submitting ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: colors.background }}>
                {t('edit_profile.save')}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
