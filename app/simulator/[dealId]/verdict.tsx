import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useColors } from '../../../contexts/ThemeContext';
import { Fonts } from '../../../constants/fonts';
import { fetchDealFull, fetchPlay, updatePlay, SimDealFull, SimPlay } from '../../../lib/simulator';

// ── Rating logic ──────────────────────────────────────────────────
// +1 decision matches expert
// +1 zoning_correct >= 2/3 of zoning_total
// +1 final_profit > 0 and within ±25% of expert_sale_price delta
// ─────────────────────────────────────────────────────────────────

const CARD_BG = '#1c1a14';

function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  return '$' + Math.round(n).toLocaleString();
}

function calcRating(deal: SimDealFull, play: SimPlay): number {
  let score = 0;
  const numbers = (play.numbers ?? {}) as Record<string, number>;

  // Decision match
  const expertDecision = (deal.expert_decision ?? '').toLowerCase();
  const userDecision = (play.decision ?? '').toLowerCase();
  if (expertDecision && userDecision && expertDecision === userDecision) score += 1;

  // Zoning
  if (play.zoning_total > 0 && play.zoning_correct / play.zoning_total >= 2 / 3) score += 1;

  // Profit quality
  const finalProfit = numbers.final_profit ?? 0;
  const expertProfit = (deal.expert_sale_price ?? 0) - deal.price - (deal.expert_build_sqft ?? 0) * (deal.expert_cost_per_sqft ?? 150) - (deal.expert_holding_months ?? 0) * ((deal.expert_build_sqft ?? 0) * (deal.expert_cost_per_sqft ?? 150) * 0.01) - (deal.expert_sale_price ?? 0) * (deal.expert_closing_pct ?? 0.05);
  if (finalProfit > 0 && expertProfit !== 0 && Math.abs(finalProfit - expertProfit) / Math.abs(expertProfit) <= 0.25) score += 1;

  return score;
}

export default function VerdictScreen() {
  const { dealId, playId } = useLocalSearchParams<{ dealId: string; playId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const GOLD = colors.gold;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [deal, setDeal] = useState<SimDealFull | null>(null);
  const [play, setPlay] = useState<SimPlay | null>(null);
  const [decision, setDecision] = useState<'build' | 'pass' | null>(null);
  const [visionText, setVisionText] = useState('');
  const [rating, setRating] = useState(0);

  useEffect(() => {
    Promise.all([
      fetchDealFull(dealId),
      playId ? fetchPlay(playId) : Promise.resolve(null),
    ])
      .then(([d, p]) => {
        setDeal(d);
        setPlay(p);
      })
      .catch((e) => Alert.alert(t('common.error'), e?.message ?? t('common.unknown_error')))
      .finally(() => setLoading(false));
  }, [dealId, playId]);

  if (loading || !deal) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!decision) return;
    setSubmitting(true);
    const finalPlay = play ? { ...play, decision } : null;
    let computedRating = 0;
    if (finalPlay) {
      finalPlay.decision = decision;
      computedRating = calcRating(deal, finalPlay);
    }
    setRating(computedRating);
    try {
      if (playId) {
        const numbers = (play?.numbers ?? {}) as Record<string, number>;
        await updatePlay(playId, {
          decision,
          vision_text: visionText || null,
          profit_estimate: numbers.final_profit ?? null,
          rating: String(computedRating),
        });
      }
    } catch {
      // best-effort
    }
    setSubmitting(false);
    setDone(true);
  };

  // ── Result screen ───────────────────────────────────────────────
  if (done && play) {
    const numbers = (play.numbers ?? {}) as Record<string, number>;
    const finalProfit = numbers.final_profit ?? numbers.net_profit ?? numbers.gross_profit ?? 0;
    const profitColor = finalProfit < 0 ? colors.error : GOLD;

    const expertProfit = (deal.expert_sale_price ?? 0) - deal.price
      - (deal.expert_build_sqft ?? 0) * (deal.expert_cost_per_sqft ?? 150)
      - (deal.expert_holding_months ?? 0) * ((deal.expert_build_sqft ?? 0) * (deal.expert_cost_per_sqft ?? 150) * 0.01)
      - (deal.expert_sale_price ?? 0) * (deal.expert_closing_pct ?? 0.05);

    const tableRows: { label: string; you: string; expert: string }[] = [
      {
        label: t('simulator.stage7_row_build_sqft'),
        you: numbers.build_sqft ? `${Math.round(numbers.build_sqft).toLocaleString()} sqft` : '—',
        expert: deal.expert_build_sqft ? `${deal.expert_build_sqft.toLocaleString()} sqft` : '—',
      },
      {
        label: t('simulator.stage7_row_sale_price'),
        you: fmt(numbers.sale_price),
        expert: fmt(deal.expert_sale_price),
      },
      {
        label: t('simulator.stage7_row_holding'),
        you: numbers.holding_months ? t('simulator.stage7_months', { n: numbers.holding_months }) : '—',
        expert: deal.expert_holding_months ? t('simulator.stage7_months', { n: deal.expert_holding_months }) : '—',
      },
      {
        label: t('simulator.stage7_row_profit'),
        you: fmt(finalProfit),
        expert: fmt(expertProfit),
      },
      {
        label: t('simulator.stage7_row_decision'),
        you: decision === 'build' ? t('simulator.stage7_build_label') : t('simulator.stage7_pass_label'),
        expert: (deal.expert_decision ?? '').toLowerCase() === 'build'
          ? t('simulator.stage7_build_label')
          : (deal.expert_decision ?? '').toLowerCase() === 'pass'
            ? t('simulator.stage7_pass_label')
            : deal.expert_decision ?? '—',
      },
    ];

    const starColors = Array.from({ length: 3 }, (_, i) => (i < rating ? GOLD : colors.surface));

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: colors.background, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('simulator.stage7_badge')}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
          {/* Title + stars */}
          <Text style={{ fontFamily: Fonts.headingHeavy, fontSize: 26, color: '#fff', marginBottom: 8 }}>
            {t('simulator.stage7_result_title')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
            {starColors.map((c, i) => (
              <Ionicons key={i} name="star" size={28} color={c} />
            ))}
          </View>
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.textMuted, marginBottom: 28 }}>
            {t('simulator.stage7_rating', { rating })}
          </Text>

          {/* Net profit hero */}
          <View style={{ backgroundColor: CARD_BG, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: profitColor + '60' }}>
            <Text style={{ fontFamily: Fonts.headingHeavy, fontSize: 32, color: profitColor }}>
              {finalProfit >= 0 ? '+' : ''}{fmt(finalProfit)}
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
              {t('simulator.stage7_row_profit')}
            </Text>
          </View>

          {/* Comparison table */}
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            {t('simulator.stage7_comparison_header')}
          </Text>
          <View style={{ backgroundColor: CARD_BG, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
            {/* Header row */}
            <View style={{ flexDirection: 'row', backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ flex: 2, fontFamily: Fonts.bodyBold, fontSize: 12, color: colors.textMuted }}>{t('simulator.stage7_col_item')}</Text>
              <Text style={{ flex: 1, fontFamily: Fonts.bodyBold, fontSize: 12, color: GOLD, textAlign: 'right' }}>{t('simulator.stage7_col_you')}</Text>
              <Text style={{ flex: 1, fontFamily: Fonts.bodyBold, fontSize: 12, color: colors.textMuted, textAlign: 'right' }}>{t('simulator.stage7_col_expert')}</Text>
            </View>
            {tableRows.map((row, i) => (
              <View key={row.label} style={{ flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border }}>
                <Text style={{ flex: 2, fontFamily: Fonts.body, fontSize: 13, color: colors.textSecondary }}>{row.label}</Text>
                <Text style={{ flex: 1, fontFamily: Fonts.bodySemiBold, fontSize: 13, color: GOLD, textAlign: 'right' }}>{row.you}</Text>
                <Text style={{ flex: 1, fontFamily: Fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'right' }}>{row.expert}</Text>
              </View>
            ))}
          </View>

          {/* Lesson */}
          {deal.lesson ? (
            <>
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                {t('simulator.stage7_lesson_header')}
              </Text>
              <View style={{ backgroundColor: CARD_BG, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: GOLD + '40', marginBottom: 28 }}>
                <Text style={{ fontFamily: Fonts.body, fontSize: 15, color: colors.textPrimary, lineHeight: 24 }}>
                  {deal.lesson}
                </Text>
              </View>
            </>
          ) : null}

          {/* Expert rationale */}
          {deal.expert_rationale ? (
            <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 28 }}>
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                {deal.expert_decision ? `${(deal.expert_decision ?? '').toUpperCase()} — ` : ''}{t('simulator.stage7_col_expert')}
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: colors.textSecondary, lineHeight: 22 }}>
                {deal.expert_rationale}
              </Text>
            </View>
          ) : null}

          {/* Play again */}
          <TouchableOpacity
            onPress={() => router.push('/(drawer)/(tabs)/education' as any)}
            activeOpacity={0.8}
            style={{ backgroundColor: GOLD, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: colors.background }}>
              {t('simulator.stage7_play_again')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Decision screen ─────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Fonts.heading, fontSize: 20, color: GOLD, flex: 1 }}>
          {t('simulator.stage7_title')}
        </Text>
        <View style={{ backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: colors.background, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('simulator.stage7_badge')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 17, color: '#fff', textAlign: 'center', lineHeight: 26, marginVertical: 24 }}>
          {t('simulator.stage7_question')}
        </Text>

        {/* Decision cards */}
        <View style={{ flexDirection: 'row', gap: 14, marginBottom: 32 }}>
          {(['build', 'pass'] as const).map((opt) => {
            const active = decision === opt;
            const isBuild = opt === 'build';
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => setDecision(opt)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: active ? (isBuild ? GOLD : colors.error) : CARD_BG,
                  borderRadius: 16,
                  paddingVertical: 28,
                  alignItems: 'center',
                  gap: 10,
                  borderWidth: 2,
                  borderColor: active ? (isBuild ? GOLD : colors.error) : colors.border,
                }}
              >
                <Ionicons
                  name={isBuild ? 'hammer-outline' : 'close-circle-outline'}
                  size={32}
                  color={active ? colors.background : (isBuild ? GOLD : colors.error)}
                />
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: active ? colors.background : colors.textPrimary, letterSpacing: 1 }}>
                  {isBuild ? t('simulator.stage7_build') : t('simulator.stage7_pass')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Vision text */}
        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>
          {t('simulator.stage7_vision_label')}
        </Text>
        <TextInput
          value={visionText}
          onChangeText={setVisionText}
          placeholder={t('simulator.stage7_vision_placeholder')}
          placeholderTextColor={colors.textFaint}
          multiline
          numberOfLines={4}
          style={{
            backgroundColor: CARD_BG,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
            fontFamily: Fonts.body,
            fontSize: 15,
            color: colors.textPrimary,
            minHeight: 100,
            textAlignVertical: 'top',
            marginBottom: 28,
          }}
        />

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={!decision || submitting}
          style={{
            backgroundColor: decision ? GOLD : colors.surface,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: decision ? 1 : 0.5,
          }}
        >
          {submitting ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: decision ? colors.background : colors.textMuted }}>
              {submitting ? t('simulator.stage7_submitting') : t('simulator.stage7_submit')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
