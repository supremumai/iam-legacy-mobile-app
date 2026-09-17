import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
  fetchModuleDetail,
  upsertVideoWatched,
  ModuleDetailResult,
} from '../../../lib/education';
import { Fonts } from '../../../constants/fonts';

const GOLD = '#c9a84c';
const BG = '#0a0900';

export default function ModuleVideoScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [result, setResult] = useState<ModuleDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [localWatched, setLocalWatched] = useState(false);
  const upsertDone = useRef(false);

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

          {/* Key terms chips */}
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
