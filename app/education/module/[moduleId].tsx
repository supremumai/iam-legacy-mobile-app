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
import { useAdminInEducation } from '../../../hooks/useAdminInEducation';
import {
  fetchModuleDetail,
  fetchQuizQuestions,
  setModuleVideoUrl,
  updateQuizQuestion,
  upsertVideoWatched,
  ModuleDetailResult,
} from '../../../lib/education';
import { uploadModuleVideo } from '../../../lib/upload';
import { Fonts } from '../../../constants/fonts';
import { Colors } from '../../../constants/colors';

const GOLD = Colors.gold;
const BG = Colors.background;
const RED = Colors.error;

const DIRECT_VIDEO_EXTS = ['.mp4', '.mov', '.m4v', '.webm'];

type QuizOptionKey = 'A' | 'B' | 'C' | 'D';
const QUIZ_OPTIONS: QuizOptionKey[] = ['A', 'B', 'C', 'D'];
const QUIZ_OPT_KEYS = [
  { key: 'option_a' as const, label: 'A' },
  { key: 'option_b' as const, label: 'B' },
  { key: 'option_c' as const, label: 'C' },
  { key: 'option_d' as const, label: 'D' },
] as const;

interface QuizQEdit {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: QuizOptionKey;
  saving: boolean;
  error: string | null;
}

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
  const isAdmin = useAdminInEducation();

  const [result, setResult] = useState<ModuleDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [localWatched, setLocalWatched] = useState(false);
  const upsertDone = useRef(false);

  // Admin panel state — video
  const [adminUploading, setAdminUploading] = useState(false);
  const [adminUrlInput, setAdminUrlInput] = useState('');
  const [adminUrlError, setAdminUrlError] = useState<string | null>(null);
  const [adminUrlSaving, setAdminUrlSaving] = useState(false);

  // Admin panel state — quiz questions
  const [quizEdits, setQuizEdits] = useState<QuizQEdit[]>([]);

  const load = useCallback(async () => {
    if (!moduleId) return;
    setError(false);
    try {
      const data = await fetchModuleDetail(moduleId, user?.id ?? null);
      setResult(data);
      if (!data.module) setError(true);
      if (isAdmin) {
        const qs = await fetchQuizQuestions(moduleId);
        setQuizEdits(qs.map((q) => ({
          id: q.id,
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option.toUpperCase() as QuizOptionKey,
          saving: false,
          error: null,
        })));
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [moduleId, user?.id, isAdmin]);

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

  function updateQuizEdit(idx: number, patch: Partial<QuizQEdit>) {
    setQuizEdits((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  async function handleSaveQuestion(idx: number) {
    const edit = quizEdits[idx];
    if (
      !edit.question.trim() ||
      !edit.option_a.trim() ||
      !edit.option_b.trim() ||
      !edit.option_c.trim() ||
      !edit.option_d.trim()
    ) {
      updateQuizEdit(idx, { error: t('education.admin_question_empty') });
      return;
    }
    updateQuizEdit(idx, { saving: true, error: null });
    let errMsg: string | null = null;
    try {
      errMsg = await updateQuizQuestion(edit.id, {
        question: edit.question.trim(),
        option_a: edit.option_a.trim(),
        option_b: edit.option_b.trim(),
        option_c: edit.option_c.trim(),
        option_d: edit.option_d.trim(),
        correct_option: edit.correct_option,
      });
    } catch (e: any) {
      errMsg = e?.message ?? t('education.admin_question_save_error');
    } finally {
      updateQuizEdit(idx, { saving: false, error: errMsg });
    }
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
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.textPrimary, marginBottom: 16, textAlign: 'center' }}>
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
  const totalModules = result.totalModules ?? 0;
  const moduleNumber = module.order_index + 1;

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

        {/* ── VIDEO / PLACEHOLDER — full width, first ── */}
        <View style={{ position: 'relative' }}>
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
                width: '100%',
                aspectRatio: 16 / 9,
                backgroundColor: Colors.surfacePanel,
                borderBottomWidth: 1,
                borderBottomColor: Colors.borderSubtle,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <Ionicons name="videocam-outline" size={40} color={Colors.borderStrong} />
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.textTertiary }}>
                {t('education.video_coming_soon')}
              </Text>
            </View>
          )}

          {/* Badge: Module N of M */}
          <View
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: Colors.overlay,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: GOLD }}>
              {totalModules > 0
                ? t('education.module_badge', { n: moduleNumber, total: totalModules })
                : `Module ${moduleNumber}`}
            </Text>
          </View>
        </View>

        {/* ── CONTEXT — title, description, key terms ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 22, color: Colors.textPrimary, lineHeight: 28, marginBottom: 8 }}>
            {module.title}
          </Text>

          {!!module.summary && (
            <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 12 }}>
              {module.summary}
            </Text>
          )}

          {module.key_terms && module.key_terms.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {module.key_terms.map((term) => (
                <View
                  key={term}
                  style={{
                    backgroundColor: Colors.borderSubtle,
                    borderRadius: 99,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.goldStrong }}>
                    {term}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── QUIZ BUTTON ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }}>
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
            <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: Colors.textTertiary, textAlign: 'center', marginTop: 8 }}>
              {t('education.video_not_available')}
            </Text>
          )}

          {hasVideo && !canTakeQuiz && (
            <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: Colors.textTertiary, textAlign: 'center', marginTop: 8 }}>
              {t('education.watch_to_unlock')}
            </Text>
          )}
        </View>

        {/* ── ADMIN SECTION — video panel + quiz panel, grouped at bottom ── */}
        {isAdmin && (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 4,
              borderTopWidth: 1,
              borderTopColor: Colors.border,
              paddingTop: 16,
              paddingBottom: 48,
            }}
          >
            {/* ADMIN header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <Ionicons name="settings-outline" size={13} color={Colors.borderStrong} />
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.borderStrong, letterSpacing: 1, textTransform: 'uppercase' }}>
                {t('education.admin_panel')}
              </Text>
            </View>

            {/* Video management sub-panel */}
            {!hasVideo ? (
              <>
                <TouchableOpacity
                  onPress={adminUploading ? undefined : handlePickVideo}
                  activeOpacity={adminUploading ? 1 : 0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: Colors.surfacePanel,
                    borderWidth: 1,
                    borderColor: Colors.borderStrong,
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

                <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: Colors.textFaint, textAlign: 'center', marginBottom: 12 }}>
                  {t('education.admin_or')}
                </Text>

                <TextInput
                  value={adminUrlInput}
                  onChangeText={(text) => { setAdminUrlInput(text); setAdminUrlError(null); }}
                  placeholder={t('education.admin_url_placeholder')}
                  placeholderTextColor={Colors.textPlaceholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={{
                    backgroundColor: Colors.surfacePanel,
                    borderWidth: 1,
                    borderColor: adminUrlError ? RED : Colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontFamily: Fonts.body,
                    fontSize: 14,
                    color: Colors.textPrimary,
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
                    backgroundColor: Colors.borderSubtle,
                    borderWidth: 1,
                    borderColor: Colors.borderStrong,
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
                    backgroundColor: Colors.surfacePanel,
                    borderWidth: 1,
                    borderColor: Colors.borderStrong,
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
                    backgroundColor: Colors.errorSurface,
                    borderWidth: 1,
                    borderColor: Colors.errorBorder,
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

            {/* Quiz questions sub-panel */}
            <View style={{ marginTop: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 16 }}>
                <Ionicons name="help-circle-outline" size={13} color={Colors.borderStrong} />
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.borderStrong, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  {t('education.admin_quiz_questions')}
                </Text>
              </View>

              {quizEdits.length === 0 ? (
                <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: Colors.textFaint, textAlign: 'center', paddingVertical: 12 }}>
                  {t('education.admin_no_questions')}
                </Text>
              ) : (
                quizEdits.map((edit, idx) => (
                  <View
                    key={edit.id}
                    style={{
                      backgroundColor: Colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: Colors.borderSubtle,
                      borderRadius: 10,
                      padding: 14,
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.borderStrong, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
                      {t('education.admin_question')} {idx + 1}
                    </Text>

                    <TextInput
                      value={edit.question}
                      onChangeText={(v) => updateQuizEdit(idx, { question: v, error: null })}
                      multiline
                      placeholder={t('education.admin_question')}
                      placeholderTextColor={Colors.textPlaceholder}
                      style={{
                        backgroundColor: BG,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        fontFamily: Fonts.body,
                        fontSize: 14,
                        color: Colors.textPrimary,
                        marginBottom: 10,
                        minHeight: 60,
                        textAlignVertical: 'top',
                      }}
                    />

                    {QUIZ_OPT_KEYS.map(({ key, label }) => (
                      <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.borderStrong, width: 20, textAlign: 'center' }}>
                          {label}
                        </Text>
                        <TextInput
                          value={edit[key]}
                          onChangeText={(v) => updateQuizEdit(idx, { [key]: v, error: null } as Partial<QuizQEdit>)}
                          placeholder={`${t('education.admin_option')} ${label}`}
                          placeholderTextColor={Colors.textPlaceholder}
                          style={{
                            flex: 1,
                            backgroundColor: BG,
                            borderWidth: 1,
                            borderColor: Colors.border,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            fontFamily: Fonts.body,
                            fontSize: 14,
                            color: Colors.textPrimary,
                          }}
                        />
                      </View>
                    ))}

                    <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.textTertiary, marginBottom: 8, marginTop: 2 }}>
                      {t('education.admin_correct_answer')}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                      {QUIZ_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          onPress={() => updateQuizEdit(idx, { correct_option: opt, error: null })}
                          activeOpacity={0.75}
                          style={{
                            backgroundColor: edit.correct_option === opt ? Colors.border : BG,
                            borderWidth: 1.5,
                            borderColor: edit.correct_option === opt ? GOLD : Colors.border,
                            borderRadius: 8,
                            paddingVertical: 8,
                            paddingHorizontal: 14,
                          }}
                        >
                          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: edit.correct_option === opt ? GOLD : Colors.textTertiary }}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {!!edit.error && (
                      <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: RED, marginBottom: 8 }}>
                        {edit.error}
                      </Text>
                    )}

                    <TouchableOpacity
                      onPress={edit.saving ? undefined : () => handleSaveQuestion(idx)}
                      activeOpacity={edit.saving ? 1 : 0.8}
                      style={{
                        backgroundColor: Colors.borderSubtle,
                        borderWidth: 1,
                        borderColor: Colors.borderStrong,
                        borderRadius: 8,
                        paddingVertical: 10,
                        alignItems: 'center',
                        opacity: edit.saving ? 0.6 : 1,
                      }}
                    >
                      {edit.saving ? (
                        <ActivityIndicator size="small" color={GOLD} />
                      ) : (
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: GOLD }}>
                          {t('education.admin_save_question')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {!isAdmin && <View style={{ paddingBottom: 48 }} />}

      </ScrollView>
    </View>
  );
}
