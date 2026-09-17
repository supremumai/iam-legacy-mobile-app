import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { fetchTracks, EduTrack } from '../../../lib/education';
import { Fonts } from '../../../constants/fonts';
import GlobalHeader from '../../../components/GlobalHeader';
import TrackCard from '../../../components/education/TrackCard';

export default function EducationScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  useAuth(); // keep auth context alive

  const [tracks, setTracks] = useState<EduTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const data = await fetchTracks();
      setTracks(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

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
      <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
        <GlobalHeader />
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 24,
            color: '#c9a84c',
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
              color: '#FFFFFF',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {t('education.could_not_load')}
          </Text>
          <Pressable
            onPress={() => { setLoading(true); load(); }}
            style={{
              backgroundColor: '#c9a84c',
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: '#0a0900' }}>
              {t('events.retry')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <GlobalHeader />

        <View style={{ paddingHorizontal: 20, marginTop: 16, marginBottom: 20 }}>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 24, color: '#c9a84c' }}>
            {t('education.title')}
          </Text>
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
              marginTop: 4,
            }}
          >
            {t('education.lms_subtitle')}
          </Text>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <ActivityIndicator color="#c9a84c" size="large" />
          </View>
        ) : tracks.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#FFFFFF', textAlign: 'center' }}>
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
