import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
import { fetchDeals, fetchCompletedPlays, SimDeal } from '../../../lib/simulator';
import { Fonts } from '../../../constants/fonts';
import { useColors } from '../../../contexts/ThemeContext';
import GlobalHeader from '../../../components/GlobalHeader';
import TrackCard from '../../../components/education/TrackCard';
import ContinueLearningCard from '../../../components/education/ContinueLearningCard';

export default function EducationScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const { previewAsMember } = useEducationPreview();
  const colors = useColors();

  const [activeTab, setActiveTab] = useState<'courses' | 'simulator'>('courses');
  const [tracks, setTracks] = useState<EduTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [continueLearning, setContinueLearning] = useState<ContinueLearningResult | null>(null);
  const [deals, setDeals] = useState<SimDeal[]>([]);
  const [hasCompletedPlay, setHasCompletedPlay] = useState(false);

  const showAdminContent = isAdmin && !previewAsMember;

  const load = useCallback(async () => {
    setError(false);
    try {
      const data = await fetchTracks(user?.id, { includeUnpublished: showAdminContent });
      setTracks(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id, showAdminContent]);

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

  useEffect(() => {
    fetchDeals({ includeUnpublished: showAdminContent })
      .then(setDeals)
      .catch((e) => console.warn('[Education] fetchDeals failed:', e?.message ?? e));
  }, [showAdminContent]);

  useEffect(() => {
    if (!user?.id) return;
    fetchCompletedPlays(user.id)
      .then((plays) => setHasCompletedPlay(plays.length > 0))
      .catch(() => {});
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
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GlobalHeader />
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 24,
            color: colors.gold,
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
              color: colors.textPrimary,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {t('education.could_not_load')}
          </Text>
          <Pressable
            onPress={() => { setLoading(true); load(); }}
            style={{
              backgroundColor: colors.gold,
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: colors.background }}>
              {t('events.retry')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const tabs: { key: 'courses' | 'simulator'; label: string }[] = [
    { key: 'courses', label: t('education.tab_courses') },
    { key: 'simulator', label: t('education.tab_simulator') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <GlobalHeader />

        <View style={{ paddingHorizontal: 20, marginTop: 16, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: Fonts.heading, fontSize: 24, color: colors.gold }}>
              {t('education.title')}
            </Text>
            {activeTab === 'courses' && showAdminContent && (
              <TouchableOpacity
                onPress={() => router.push('/education/admin/track-form' as any)}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.gold} />
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: colors.gold }}>
                  {t('education.admin_new_track')}
                </Text>
              </TouchableOpacity>
            )}
            {activeTab === 'simulator' && showAdminContent && (
              <TouchableOpacity
                onPress={() => router.push('/simulator/admin/deal-form' as any)}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.gold} />
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: colors.gold }}>
                  {t('simulator.admin_new_deal')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: colors.textMuted, marginTop: 4 }}>
            {t('education.lms_subtitle')}
          </Text>

          {/* Pill segmented control */}
          <View style={{ flexDirection: 'row', marginTop: 16, backgroundColor: colors.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.border }}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  alignItems: 'center',
                  borderRadius: 9,
                  backgroundColor: activeTab === tab.key ? colors.gold : 'transparent',
                }}
              >
                <Text style={{
                  fontFamily: Fonts.bodyBold,
                  fontSize: 14,
                  color: activeTab === tab.key ? colors.background : colors.textMuted,
                }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

        </View>

        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <>
            {/* Continue Learning strip */}
            {continueLearning ? (
              <>
                <Text
                  style={{
                    fontFamily: Fonts.heading,
                    fontSize: 18,
                    color: colors.gold,
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
                      router.push(`/education/module/${continueLearning.moduleId}/quiz` as any);
                    } else {
                      router.push(`/education/module/${continueLearning.moduleId}` as any);
                    }
                  }}
                />
              </>
            ) : null}

            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <ActivityIndicator color={colors.gold} size="large" />
              </View>
            ) : tracks.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary, textAlign: 'center' }}>
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
                  isDraft={showAdminContent && !track.is_published}
                  onEdit={showAdminContent ? () => router.push(`/education/admin/track-form?id=${track.id}` as any) : undefined}
                />
              ))
            )}
          </>
        )}

        {/* SIMULATOR TAB */}
        {activeTab === 'simulator' && (
          <View style={{ marginTop: 4 }}>
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textMuted }}>
                {t('simulator.section_subtitle')}
              </Text>
            </View>

            {/* Portfolio entry card */}
            {hasCompletedPlay && (
              <TouchableOpacity
                onPress={() => router.push('/simulator/portfolio' as any)}
                activeOpacity={0.85}
                style={{ marginHorizontal: 20, marginBottom: 16, borderRadius: 14, backgroundColor: '#1c1a14', borderWidth: 1.5, borderColor: colors.gold + '60', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gold + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="briefcase-outline" size={22} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: colors.gold }}>
                    {t('simulator.portfolio_title')}
                  </Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                    {t('simulator.portfolio_stat_played')} · {t('simulator.portfolio_stat_accuracy')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gold} />
              </TouchableOpacity>
            )}

            {deals.map((deal) => (
              <Pressable
                key={deal.id}
                onPress={() => router.push(`/simulator/${deal.id}` as any)}
                style={({ pressed }) => ({
                  marginHorizontal: 20,
                  marginBottom: 16,
                  borderRadius: 14,
                  overflow: 'hidden',
                  opacity: pressed ? 0.88 : 1,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                })}
              >
                {deal.image_url ? (
                  <Image
                    source={{ uri: deal.image_url }}
                    style={{ width: '100%', height: 160 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ width: '100%', height: 160, backgroundColor: colors.surfaceDeep, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="business-outline" size={48} color={colors.gold} style={{ opacity: 0.4 }} />
                  </View>
                )}

                <View style={{ padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: colors.textPrimary, marginBottom: 2 }} numberOfLines={2}>
                        {deal.title}
                      </Text>
                      <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textMuted }} numberOfLines={1}>
                        {deal.address}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: colors.borderSubtle, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.borderStrong }}>
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: colors.gold }}>
                        ${deal.price.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                    {showAdminContent && !deal.is_published && (
                      <View style={{ backgroundColor: colors.errorBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: colors.error }}>
                          {t('simulator.draft_badge')}
                        </Text>
                      </View>
                    )}
                    {showAdminContent && (
                      <TouchableOpacity
                        onPress={() => router.push(`/simulator/admin/deal-form?id=${deal.id}` as any)}
                        hitSlop={8}
                        style={{ marginLeft: 8 }}
                      >
                        <Ionicons name="pencil-outline" size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity
                      onPress={() => router.push(`/simulator/${deal.id}` as any)}
                      activeOpacity={0.75}
                      style={{ backgroundColor: colors.gold, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 }}
                    >
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: colors.background }}>
                        {t('simulator.play_button')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            ))}

            {showAdminContent && deals.length === 0 && (
              <View style={{ paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center' }}>
                <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: colors.textFaint, textAlign: 'center' }}>
                  {t('simulator.no_deals_yet')}
                </Text>
              </View>
            )}

            {!showAdminContent && deals.length === 0 && (
              <View style={{ paddingHorizontal: 20, paddingVertical: 48, alignItems: 'center' }}>
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary, textAlign: 'center' }}>
                  {t('simulator.no_deals_member')}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ paddingBottom: 32 }} />
      </ScrollView>
    </View>
  );
}
