import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { useEducationPreview } from '../../../contexts/EducationPreviewContext';
import {
  fetchTracks,
  fetchContinueLearning,
  EduTrack,
  ContinueLearningResult,
} from '../../../lib/education';
import { Fonts } from '../../../constants/fonts';
import { Colors } from '../../../constants/colors';
import GlobalHeader from '../../../components/GlobalHeader';
import TrackCard from '../../../components/education/TrackCard';
import ContinueLearningCard from '../../../components/education/ContinueLearningCard';

const GOLD = Colors.gold;

export default function EducationScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const { previewAsMember, togglePreview } = useEducationPreview();

  const [tracks, setTracks] = useState<EduTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [continueLearning, setContinueLearning] = useState<ContinueLearningResult | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const data = await fetchTracks(user?.id);
      setTracks(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      const result = await fetchContinueLearning(user?.id ?? null);
      setContinueLearning(result);
    })();
  }, [user?.id]);

  const handleTrackPress = (track: EduTrack) => {
    if (track.courses.length === 1) {
      router.push(`/education/course/${track.courses[0].id}` as any);
    } else {
      // Multiple courses per track — future: show course list.
      // For now navigate to the first course as a fallback.
      if (track.courses[0]) {
        router.push(`/education/course/${track.courses[0].id}` as any);
      }
    }
  };

  if (!loading && error) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <GlobalHeader />
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 24,
            color: Colors.gold,
            paddingHorizontal: 20,
            marginTop: 16,
          }}
        >
          {t('education.title')}
        </Text>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 16,
              color: Colors.textPrimary,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {t('education.could_not_load')}
          </Text>
          <Pressable
            onPress={() => { setLoading(true); load(); }}
            style={{
              backgroundColor: Colors.gold,
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.background }}>
              {t('events.retry')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <GlobalHeader />

        <View style={{ paddingHorizontal: 20, marginTop: 16, marginBottom: 20 }}>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 24, color: Colors.gold }}>
            {t('education.title')}
          </Text>
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 14,
              color: Colors.textMuted,
              marginTop: 4,
            }}
          >
            {t('education.lms_subtitle')}
          </Text>

          {/* Admin-only preview toggle */}
          {isAdmin && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 14,
                paddingVertical: 10,
                paddingHorizontal: 14,
                backgroundColor: previewAsMember ? Colors.borderSubtle : Colors.whiteOverlay4,
                borderWidth: 1,
                borderColor: previewAsMember ? Colors.borderStrong : Colors.whiteOverlay10,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: Fonts.bodySemiBold,
                  fontSize: 13,
                  color: previewAsMember ? GOLD : Colors.textMuted,
                }}
              >
                {previewAsMember
                  ? t('education.preview_mode_on')
                  : t('education.preview_view_as_member')}
              </Text>
              <Switch
                value={previewAsMember}
                onValueChange={togglePreview}
                trackColor={{ false: Colors.textFaint, true: Colors.borderStrong }}
                thumbColor={previewAsMember ? GOLD : Colors.textSecondary}
              />
            </View>
          )}
        </View>

        {/* Continue Learning strip — only shown when user has an in-progress module */}
        {continueLearning ? (
          <>
            <Text
              style={{
                fontFamily: Fonts.heading,
                fontSize: 18,
                color: Colors.gold,
                paddingHorizontal: 20,
                marginTop: 8,
                marginBottom: 12,
              }}
            >
              {t('education.continue_learning')}
            </Text>
            <ContinueLearningCard
              item={continueLearning}
              onPress={() => {
                if (continueLearning.videoWatched) {
                  router.push(
                    `/education/module/${continueLearning.moduleId}/quiz` as any,
                  );
                } else {
                  router.push(
                    `/education/module/${continueLearning.moduleId}` as any,
                  );
                }
              }}
            />
          </>
        ) : null}

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <ActivityIndicator color={Colors.gold} size="large" />
          </View>
        ) : tracks.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.textPrimary, textAlign: 'center' }}>
              {t('education.no_tracks_yet')}
            </Text>
          </View>
        ) : (
          tracks.map((track, index) => (
            <TrackCard
              key={track.id}
              track={track}
              index={index}
              onPress={() => handleTrackPress(track)}
            />
          ))
        )}

        <View style={{ paddingBottom: 32 }} />
      </ScrollView>
    </View>
  );
}
