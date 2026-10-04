import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SimModal } from '../../../components/SimModal';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useColors } from '../../../contexts/ThemeContext';
import { Fonts } from '../../../constants/fonts';
import { fetchDealFull, createPlay, fetchLastPlayForDeal, SimDealFull, SimPlay } from '../../../lib/simulator';

const { width } = Dimensions.get('window');
// 16:9 hero height — shows the full horizontal width of a landscape property photo
const HERO_HEIGHT = Math.round(width * 9 / 16);

export default function Stage1Screen() {
  const { dealId } = useLocalSearchParams<{ dealId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();
  const colors = useColors();

  const [deal, setDeal] = useState<SimDealFull | null>(null);
  const [lastPlay, setLastPlay] = useState<SimPlay | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<'yes' | 'no' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDealFull(dealId)
      .then((d) => {
        setDeal(d);
        if (user?.id) {
          fetchLastPlayForDeal(user.id, d.id)
            .then(setLastPlay)
            .catch(() => {});
        }
      })
      .catch(() => setErrorMsg(t('common.unknown_error')))
      .finally(() => setLoading(false));
  }, [dealId, user?.id]);

  const handleGutCall = async (call: 'yes' | 'no') => {
    if (!user?.id || !deal) return;
    setSubmitting(call);
    try {
      const gutCall = call === 'yes' ? 'build' : 'no';
      const play = await createPlay({ user_id: user.id, deal_id: deal.id, gut_call: gutCall });
      router.push(`/simulator/${dealId}/dossier?playId=${play.id}` as any);
    } catch {
      setErrorMsg(t('simulator.error_generic'));
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (!deal) return null;

  const GOLD = colors.gold;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SimModal visible={!!errorMsg} message={errorMsg ?? ''} onClose={() => setErrorMsg(null)} />

      {/* Safe-area back button + stage badge — float above the hero */}
      <View style={{ position: 'absolute', top: insets.top + 12, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 10 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            borderRadius: 20,
            padding: 7,
          })}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: colors.background, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('simulator.stage1_title')}
          </Text>
        </View>
      </View>

      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* 16:9 hero image with bottom gradient scrim */}
        <View style={{ width, height: HERO_HEIGHT + insets.top, overflow: 'hidden' }}>
          {deal.image_url ? (
            <Image
              source={{ uri: deal.image_url }}
              style={{ width, height: HERO_HEIGHT + insets.top }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ width, height: HERO_HEIGHT + insets.top, backgroundColor: colors.surfaceDeep, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="business-outline" size={64} color={GOLD} style={{ opacity: 0.3 }} />
            </View>
          )}
          {/* Scrim: top fade for back button legibility */}
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80 }}
          />
          {/* Scrim: bottom fade into card */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}
          />
        </View>

        {/* Content card */}
        <View style={{ backgroundColor: colors.background, paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 32 }}>
          {/* Price chip */}
          <View style={{ alignSelf: 'flex-start', backgroundColor: colors.borderSubtle, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.borderStrong, marginBottom: 14 }}>
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: GOLD }}>
              ${deal.price.toLocaleString()}
            </Text>
          </View>

          <Text style={{ fontFamily: Fonts.headingHeavy, fontSize: 26, color: colors.textPrimary, marginBottom: 4 }} numberOfLines={2}>
            {deal.title}
          </Text>
          <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: colors.textMuted, marginBottom: 24 }} numberOfLines={1}>
            {deal.address}
          </Text>

          {/* Replay banner */}
          {lastPlay?.decision ? (() => {
            const nums = (lastPlay.numbers ?? {}) as Record<string, number>;
            const profit = lastPlay.profit_estimate ?? nums.final_profit ?? null;
            const decisionLabel = lastPlay.decision === 'build'
              ? t('simulator.stage7_build_label')
              : (lastPlay.decision === 'pass' || lastPlay.decision === 'no_buy')
                ? t('simulator.stage7_pass_label')
                : t('simulator.stage7_other_label');
            const profitStr = profit != null ? '$' + Math.round(profit).toLocaleString() : '—';
            const ratingStr = lastPlay.rating ? t('simulator.stage1_replay_rating', { rating: lastPlay.rating }) : '';
            return (
              <View style={{ backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border }}>
                <Ionicons name="time-outline" size={14} color={GOLD} />
                <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.textMuted, flex: 1 }} numberOfLines={1}>
                  {t('simulator.stage1_replay_last', { decision: decisionLabel, profit: profitStr })}{ratingStr}
                </Text>
              </View>
            );
          })() : null}

          {/* Question */}
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 18, color: colors.textPrimary, marginBottom: 20, textAlign: 'center' }}>
            {t('simulator.stage1_question')}
          </Text>

          {/* Sí / No */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={submitting ? undefined : () => handleGutCall('yes')}
              activeOpacity={0.8}
              style={{ flex: 1, backgroundColor: GOLD, borderRadius: 12, paddingVertical: 16, alignItems: 'center', opacity: submitting && submitting !== 'yes' ? 0.4 : 1 }}
            >
              {submitting === 'yes' ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: colors.background }}>
                  {t('simulator.stage1_yes')}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submitting ? undefined : () => handleGutCall('no')}
              activeOpacity={0.8}
              style={{ flex: 1, backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, opacity: submitting && submitting !== 'no' ? 0.4 : 1 }}
            >
              {submitting === 'no' ? (
                <ActivityIndicator color={colors.textPrimary} size="small" />
              ) : (
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: colors.textPrimary }}>
                  {t('simulator.stage1_no')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
