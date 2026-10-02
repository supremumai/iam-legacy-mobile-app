import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SimModal } from '../../../components/SimModal';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Extrapolation,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useColors } from '../../../contexts/ThemeContext';
import { Fonts } from '../../../constants/fonts';
import { fetchDealFull, fetchPlay, updatePlay, SimSurpriseCard } from '../../../lib/simulator';

const CARD_BG = '#1c1a14';

export default function SurpriseScreen() {
  const { dealId, playId } = useLocalSearchParams<{ dealId: string; playId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const GOLD = colors.gold;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [card, setCard] = useState<SimSurpriseCard | null>(null);
  const [numbers, setNumbers] = useState<Record<string, number>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const flipValue = useSharedValue(0);

  useEffect(() => {
    Promise.all([
      fetchDealFull(dealId),
      playId ? fetchPlay(playId) : Promise.resolve(null),
    ])
      .then(([deal, play]) => {
        setCard(deal.surprise_cards[0] ?? null);
        if (play?.numbers) setNumbers(play.numbers as Record<string, number>);
      })
      .catch(() => setErrorMsg(t('common.unknown_error')))
      .finally(() => setLoading(false));
  }, [dealId, playId]);

  const handleFlip = () => {
    if (flipped) return;
    setFlipped(true);
    flipValue.value = withTiming(1, { duration: 600 });
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(flipValue.value, [0, 1], [0, 180], Extrapolation.CLAMP)}deg` }],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(flipValue.value, [0, 1], [180, 360], Extrapolation.CLAMP)}deg` }],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
  }));

  const persist = async (adjusted: boolean, impactDelta: number) => {
    if (!playId) return;
    setSaving(true);
    try {
      const updatedNumbers = {
        ...numbers,
        surprise_applied: adjusted ? 1 : 0,
        surprise_impact: impactDelta,
        final_profit: (numbers.net_profit ?? 0) + (adjusted ? impactDelta : 0),
      };
      await updatePlay(playId, {
        surprise_card_id: card?.id ?? null,
        adjusted_after_surprise: adjusted,
        numbers: updatedNumbers,
      });
    } catch {
      // best-effort
    }
    setSaving(false);
  };

  const handleAdjust = async () => {
    const impact = card?.impact_amount ?? 0;
    const delta = card?.impact_type === 'negative' ? -Math.abs(impact) : Math.abs(impact);
    await persist(true, delta);
    router.push(`/simulator/${dealId}/numbers?playId=${playId ?? ''}&adjusting=true` as any);
  };

  const handleKeep = async () => {
    await persist(false, 0);
    router.push(`/simulator/${dealId}/verdict?playId=${playId ?? ''}` as any);
  };

  const handleContinue = async () => {
    await persist(false, 0);
    router.push(`/simulator/${dealId}/verdict?playId=${playId ?? ''}` as any);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SimModal visible={!!errorMsg} message={errorMsg ?? ''} onClose={() => setErrorMsg(null)} />
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Fonts.heading, fontSize: 20, color: GOLD, flex: 1 }}>
          {t('simulator.stage6_title')}
        </Text>
        <View style={{ backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: colors.background, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('simulator.stage6_badge')}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
        {card ? (
          <>
            {/* Flip card */}
            <TouchableOpacity
              onPress={handleFlip}
              activeOpacity={flipped ? 1 : 0.85}
              style={{ width: '100%', height: 240 }}
            >
              <Animated.View style={frontStyle}>
                <View style={{
                  flex: 1,
                  backgroundColor: CARD_BG,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: GOLD,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                }}>
                  <Ionicons name="card-outline" size={52} color={GOLD} style={{ opacity: 0.7 }} />
                  <Text style={{ fontFamily: Fonts.headingHeavy, fontSize: 22, color: GOLD, letterSpacing: 2 }}>
                    ?
                  </Text>
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: colors.textMuted }}>
                    {t('simulator.stage6_flip_hint')}
                  </Text>
                </View>
              </Animated.View>

              <Animated.View style={backStyle}>
                <View style={{
                  flex: 1,
                  backgroundColor: CARD_BG,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: card.impact_type === 'negative' ? colors.error : colors.success,
                  padding: 24,
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: card.impact_type === 'negative' ? colors.error : colors.success, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                    {card.impact_amount && card.impact_amount > 0
                      ? t('simulator.stage6_impact_add', { amount: Math.abs(card.impact_amount).toLocaleString() })
                      : t('simulator.stage6_impact_sub', { amount: Math.abs(card.impact_amount ?? 0).toLocaleString() })}
                  </Text>
                  <Text style={{ fontFamily: Fonts.heading, fontSize: 20, color: '#fff', marginBottom: 12, lineHeight: 28 }}>
                    {card.title}
                  </Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginBottom: 12 }}>
                    {card.description}
                  </Text>
                  {card.related_fact_title ? (
                    <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.textFaint }}>
                      {t('simulator.stage6_related_fact', { fact: card.related_fact_title })}
                    </Text>
                  ) : null}
                </View>
              </Animated.View>
            </TouchableOpacity>

            {/* Action buttons (only after flip) */}
            {flipped && (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 32, width: '100%' }}>
                <TouchableOpacity
                  onPress={handleAdjust}
                  activeOpacity={0.8}
                  disabled={saving}
                  style={{ flex: 1, backgroundColor: GOLD, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: colors.background }}>
                      {t('simulator.stage6_adjust')}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleKeep}
                  activeOpacity={0.8}
                  disabled={saving}
                  style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
                >
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: colors.textPrimary }}>
                    {t('simulator.stage6_keep')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          /* No surprise card */
          <View style={{ alignItems: 'center', gap: 16 }}>
            <Ionicons name="checkmark-circle-outline" size={56} color={GOLD} style={{ opacity: 0.6 }} />
            <Text style={{ fontFamily: Fonts.heading, fontSize: 22, color: '#fff', textAlign: 'center' }}>
              {t('simulator.stage6_no_card')}
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: 15, color: colors.textMuted, textAlign: 'center' }}>
              {t('simulator.stage6_no_card_sub')}
            </Text>
            <TouchableOpacity
              onPress={handleContinue}
              activeOpacity={0.8}
              disabled={saving}
              style={{ marginTop: 16, backgroundColor: GOLD, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center' }}
            >
              {saving ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: colors.background }}>
                  {t('simulator.stage6_continue')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
