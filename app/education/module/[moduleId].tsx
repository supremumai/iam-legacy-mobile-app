import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import {
  fetchModuleDetail,
  setModuleVideoUrl,
  upsertVideoWatched,
  ModuleDetailResult,
} from '../../../lib/education';
import { uploadModuleVideo } from '../../../lib/upload';
import { Fonts } from '../../../constants/fonts';

const GOLD = '#c9a84c';
const BG = '#0a0900';
const RED = '#e53935';

const DIRECT_VIDEO_EXTS = ['.mp4', '.mov', '.m4v', '.webm'];

function isDirectVideoUrl(url: string): boolean {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  const lower = url.toLowerCase().split('?')[0].split('#')[0];
  return DIRECT_VIDEO_EXTS.some((ext) => lower.endsWith(ext));
}

export default function ModuleVideoScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const isAdmin = useIsAdmin();

  const [result, setResult] = useState<ModuleDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [localWatched, setLocalWatched] = useState(false);
  const upsertDone = useRef(false);

  // Admin panel state
  const [adminUploading, setAdminUploading] = useState(false);
  const [adminUrlInput, setAdminUrlInput] = useState('');
  const [adminUrlError, setAdminUrlError] = useState<string | null>(null);
  const [adminUrlSaving, setAdminUrlSaving] = useState(false);

  const load = useCallback(async () => {
    if (!moduleId) return;
    setError(false);
    try {
      const data = await fetchModuleDetail(moduleId, user?.id ?? null);
      setResult(data);
      if (!data.module) setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [moduleId, user?.id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const hasVideo = !!result?.module?.video_url;
  const dbDuration = result?.module?.video_duration_seconds ?? 0;
  const prevWatched = result?.progress?.video_watched ?? false;
  const quizPassed = result?.progress?.quiz_passed ?? false;
  const videoWatched = prevWatched || localWatched;
  const canTakeQuiz = hasVideo && videoWatched;

  // useVideoPlayer must be called unconditionally (hook rules).
  // Passing null when no video_url keeps the player idle; VideoView is not rendered in that case.
  // timeUpdateEventInterval defaults to 0 (no events) — set to 1 s to enable tracking.
  const player = useVideoPlayer(result?.module?.video_url ?? null, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 1;
  });

  useEffect(() => {
    // Skip tracking if no video, no user, already marked watched (DB or local), or upsert done.
    if (!hasVideo || !user?.id || prevWatched || upsertDone.current) return;

    const sub = player.addListener('timeUpdate', ({ currentTime }) => {
      if (upsertDone.current) return;
      // Prefer live player.duration; fall back to DB duration from module metadata.
      const dur = player.duration > 0 ? player.duration : dbDuration;
      if (dur <= 0) return;
      if (currentTime >= dur * 0.9) {
        upsertDone.current = true;
        setLocalWatched(true);
        if (user?.id) {
          upsertVideoWatched(moduleId!, user.id);
        }
      }
    });

    return () => sub.remove();
  }, [hasVideo, user?.id, prevWatched, player, dbDuration, moduleId]);

  // ── Admin handlers ─────────────────────────────────────────────────────────

  async function handlePickVideo() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('education.admin_permission_required'),
        t('education.admin_permission_body'),
      );
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'] as any,
    });
    if (picked.canceled) return;

    const asset = picked.assets[0];
    setAdminUploading(true);
    try {
      const outcome = await uploadModuleVideo(
        moduleId!,
        asset.uri,
        asset.mimeType ?? 'video/mp4',
      );
      if ('error' in outcome) {
        if (outcome.error === 'too_large') {
          Alert.alert(
            t('education.admin_video_too_large_title'),
            t('education.admin_video_too_large_body'),
          );
        } else {
          Alert.alert(t('education.admin_upload_failed'), outcome.error);
        }
      } else {
        setLoading(true);
        load();
      }
    } finally {
      setAdminUploading(false);
    }
  }

  async function handleSaveUrl() {
    const url = adminUrlInput.trim();
    if (!isDirectVideoUrl(url)) {
      setAdminUrlError(t('education.admin_url_invalid'));
      return;
    }
    setAdminUrlError(null);
    setAdminUrlSaving(true);
    try {
      const err = await setModuleVideoUrl(moduleId!, url);
      if (err) {
        setAdminUrlError(err.error);
      } else {
        setAdminUrlInput('');
        setLoading(true);
        load();
      }
    } finally {
      setAdminUrlSaving(false);
    }
  }

  function handleRemoveVideo() {
    Alert.alert(
      t('education.admin_remove_title'),
      t('education.admin_remove_body'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('education.admin_remove_confirm'),
          style: 'destructive',
          onPress: async () => {
            const err = await setModuleVideoUrl(moduleId!, null);
            if (err) {
              Alert.alert(t('common.error_title'), err.error);
            } else {
              setLoading(true);
              load();
            }
          },
        },
      ],
    );
  }

  const handleQuizPress = () => {
    router.push(`/education/module/${moduleId}/quiz` as any);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    );
  }

  if (error || !result?.module) {
    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 }}
        >
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 16, color: '#FFFFFF', marginBottom: 16, textAlign: 'center' }}>
            {t('education.could_not_load_course')}
          </Text>
          <Pressable
            onPress={() => { setLoading(true); load(); }}
            style={{ backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: BG }}>
              {t('events.retry')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { module } = result;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </TouchableOpacity>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 22, color: GOLD, lineHeight: 28, marginBottom: 8 }}>
            {module.title}
          </Text>

          {!!module.summary && (
            <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 20, marginBottom: 12 }}>
              {module.summary}
            </Text>
          )}

          {module.key_terms && module.key_terms.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {module.key_terms.map((term) => (
                <View
                  key={term}
                  style={{
                    borderWidth: 1,
                    borderColor: 'rgba(201,168,76,0.35)',
                    borderRadius: 99,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: 'rgba(201,168,76,0.85)' }}>
                    {term}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Video or placeholder */}
        {hasVideo ? (
          <VideoView
            player={player}
            style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }}
            nativeControls
            allowsFullscreen
            contentFit="contain"
          />
        ) : (
          <View
            style={{
              marginHorizontal: 20,
              borderRadius: 12,
              backgroundColor: '#1a1600',
              borderWidth: 1,
              borderColor: 'rgba(201,168,76,0.15)',
              aspectRatio: 16 / 9,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <Ionicons name="videocam-outline" size={40} color="rgba(201,168,76,0.4)" />
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>
              {t('education.video_coming_soon')}
            </Text>
          </View>
        )}

        {/* Admin panel — invisible to members */}
        {isAdmin && (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 16,
              borderTopWidth: 1,
              borderTopColor: 'rgba(201,168,76,0.2)',
              paddingTop: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 }}>
              <Ionicons name="settings-outline" size={13} color="rgba(201,168,76,0.6)" />
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: 'rgba(201,168,76,0.6)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {t('education.admin_panel')}
              </Text>
            </View>

            {!hasVideo ? (
              <>
                {/* Upload button */}
                <TouchableOpacity
                  onPress={adminUploading ? undefined : handlePickVideo}
                  activeOpacity={adminUploading ? 1 : 0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: '#1a1600',
                    borderWidth: 1,
                    borderColor: 'rgba(201,168,76,0.35)',
                    borderRadius: 8,
                    paddingVertical: 12,
                    marginBottom: 12,
                    opacity: adminUploading ? 0.6 : 1,
                  }}
                >
                  {adminUploading ? (
                    <>
                      <ActivityIndicator size="small" color={GOLD} />
                      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: GOLD }}>
                        {t('education.admin_uploading')}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={18} color={GOLD} />
                      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: GOLD }}>
                        {t('education.admin_upload_video')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.28)', textAlign: 'center', marginBottom: 12 }}>
                  {t('education.admin_or')}
                </Text>

                {/* URL input */}
                <TextInput
                  value={adminUrlInput}
                  onChangeText={(text) => { setAdminUrlInput(text); setAdminUrlError(null); }}
                  placeholder={t('education.admin_url_placeholder')}
                  placeholderTextColor="rgba(255,255,255,0.22)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={{
                    backgroundColor: '#1a1600',
                    borderWidth: 1,
                    borderColor: adminUrlError ? RED : 'rgba(201,168,76,0.25)',
                    borderRadius: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontFamily: Fonts.body,
                    fontSize: 14,
                    color: '#FFFFFF',
                    marginBottom: adminUrlError ? 6 : 8,
                  }}
                />

                {!!adminUrlError && (
                  <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: RED, marginBottom: 8 }}>
                    {adminUrlError}
                  </Text>
                )}

                <TouchableOpacity
                  onPress={adminUrlSaving ? undefined : handleSaveUrl}
                  activeOpacity={adminUrlSaving ? 1 : 0.8}
                  style={{
                    backgroundColor: 'rgba(201,168,76,0.12)',
                    borderWidth: 1,
                    borderColor: 'rgba(201,168,76,0.35)',
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                    opacity: adminUrlSaving ? 0.6 : 1,
                  }}
                >
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: GOLD }}>
                    {adminUrlSaving ? t('education.admin_saving') : t('education.admin_save_url')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Module already has video — Replace / Remove */
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={adminUploading ? undefined : handlePickVideo}
                  activeOpacity={adminUploading ? 1 : 0.8}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: '#1a1600',
                    borderWidth: 1,
                    borderColor: 'rgba(201,168,76,0.35)',
                    borderRadius: 8,
                    paddingVertical: 11,
                    opacity: adminUploading ? 0.6 : 1,
                  }}
                >
                  {adminUploading ? (
                    <ActivityIndicator size="small" color={GOLD} />
                  ) : (
                    <Ionicons name="repeat-outline" size={15} color={GOLD} />
                  )}
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: GOLD }}>
                    {adminUploading ? t('education.admin_uploading') : t('education.admin_replace_video')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRemoveVideo}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: '#1a0000',
                    borderWidth: 1,
                    borderColor: 'rgba(229,57,53,0.35)',
                    borderRadius: 8,
                    paddingVertical: 11,
                  }}
                >
                  <Ionicons name="trash-outline" size={15} color={RED} />
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: RED }}>
                    {t('education.admin_remove_video')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Quiz button */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 }}>
          <TouchableOpacity
            onPress={canTakeQuiz ? handleQuizPress : undefined}
            activeOpacity={canTakeQuiz ? 0.8 : 1}
            style={{
              backgroundColor: GOLD,
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: 'center',
              opacity: canTakeQuiz ? 1 : 0.4,
            }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: BG }}>
              {quizPassed ? t('education.review_quiz') : t('education.take_quiz')}
            </Text>
          </TouchableOpacity>

          {!hasVideo && (
            <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 8 }}>
              {t('education.video_not_available')}
            </Text>
          )}

          {hasVideo && !canTakeQuiz && (
            <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 8 }}>
              {t('education.watch_to_unlock')}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
