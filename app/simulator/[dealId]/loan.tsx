import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SimModal } from '../../../components/SimModal';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useColors } from '../../../contexts/ThemeContext';
import { Fonts } from '../../../constants/fonts';
import { fetchPlay, updatePlay } from '../../../lib/simulator';

// ── Tunable constants ─────────────────────────────────────────────
const LOAN_ANNUAL_RATE = 0.12; // 12% annual hard money rate
const LOAN_POINTS = 0.02;      // 2% origination points on financed amount
// ─────────────────────────────────────────────────────────────────

const CARD_BG = '#1c1a14';

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString();
}

const DOWN_PCT_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50];

export default function LoanScreen() {
  const { dealId, playId } = useLocalSearchParams<{ dealId: string; playId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const GOLD = colors.gold;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downPctIdx, setDownPctIdx] = useState(3); // default 20%
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Numbers from previous stage
  const [numbers, setNumbers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!playId) { setLoading(false); return; }
    fetchPlay(playId)
      .then((play) => {
        const n = (play.numbers ?? {}) as Record<string, number>;
        setNumbers(n);
      })
      .catch(() => setErrorMsg(t('common.unknown_error')))
      .finally(() => setLoading(false));
  }, [playId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    );
  }

  const downPct = DOWN_PCT_OPTIONS[downPctIdx] / 100;
  const purchasePrice = numbers.purchase_price ?? 0;
  const constructionCost = numbers.construction_cost ?? 0;
  const loanBase = purchasePrice + constructionCost;
  const loanAmount = loanBase * (1 - downPct);
  const downPayment = loanBase * downPct;
  const points = loanAmount * LOAN_POINTS;
  const monthlyRate = LOAN_ANNUAL_RATE / 12;
  const holdingMonths = numbers.holding_months ?? 12;
  const interest = loanAmount * monthlyRate * holdingMonths;
  const outOfPocket = downPayment + points + interest;
  // net = sale - purchase - construction - holding - closing - points - interest
  const netProfitCalc = (numbers.sale_price ?? 0) - purchasePrice - constructionCost - (numbers.holding_cost ?? 0) - (numbers.closing_cost ?? 0) - points - interest;
  const profitColor = netProfitCalc < 0 ? colors.error : netProfitCalc < purchasePrice * 0.05 ? colors.textMuted : GOLD;
  const barPct = Math.max(0, Math.min(netProfitCalc / (Math.max(purchasePrice, 200000) * 0.6), 1)) * 100;

  const handleContinue = async () => {
    setSaving(true);
    try {
      if (playId) {
        const updatedNumbers = {
          ...numbers,
          down_pct: downPct,
          loan_amount: loanAmount,
          loan_points: points,
          loan_interest: interest,
          out_of_pocket: outOfPocket,
          net_profit: netProfitCalc,
          surprise_applied: false,
          surprise_impact: 0,
          final_profit: netProfitCalc,
        };
        await updatePlay(playId, { numbers: updatedNumbers });
      }
    } catch {
      // best-effort
    }
    setSaving(false);
    router.push(`/simulator/${dealId}/surprise?playId=${playId ?? ''}` as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SimModal visible={!!errorMsg} message={errorMsg ?? ''} onClose={() => setErrorMsg(null)} />
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Fonts.heading, fontSize: 20, color: GOLD, flex: 1 }}>
          {t('simulator.stage5_title')}
        </Text>
        <View style={{ backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: colors.background, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('simulator.stage5_badge')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Net profit counter */}
        <View style={{ backgroundColor: CARD_BG, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: GOLD + '40' }}>
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
            {t('simulator.stage5_net_profit')}
          </Text>
          <Text style={{ fontFamily: Fonts.headingHeavy, fontSize: 36, color: profitColor, marginBottom: 12 }}>
            {netProfitCalc < 0 ? '-' : '+'}{fmt(Math.abs(netProfitCalc))}
          </Text>
          <View style={{ height: 8, backgroundColor: colors.surface, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ width: `${barPct}%`, height: '100%', backgroundColor: profitColor, borderRadius: 4 }} />
          </View>
        </View>

        {/* Down payment selector */}
        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
          {t('simulator.stage5_down_pct')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {DOWN_PCT_OPTIONS.map((pct, i) => (
            <TouchableOpacity
              key={pct}
              onPress={() => setDownPctIdx(i)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: downPctIdx === i ? GOLD : colors.surface,
                borderWidth: 1.5,
                borderColor: downPctIdx === i ? GOLD : colors.border,
              }}
            >
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: downPctIdx === i ? colors.background : colors.textPrimary }}>
                {pct}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loan breakdown */}
        <View style={{ backgroundColor: CARD_BG, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
          {[
            { label: t('simulator.stage5_financed_amount'), value: fmt(loanAmount), hint: `(${t('simulator.stage5_financed_hint', { pct: Math.round((1 - downPct) * 100) })})` },
            { label: t('simulator.stage5_interest'), value: fmt(interest), hint: `${LOAN_ANNUAL_RATE * 100}% ${t('simulator.stage5_annual')} × ${holdingMonths} ${t('simulator.stage4_months_unit')}` },
            { label: t('simulator.stage5_points'), value: fmt(points), hint: `${LOAN_POINTS * 100}% ${t('simulator.stage5_of_loan')}` },
            { label: t('simulator.stage5_loan_total'), value: fmt(points + interest), hint: null },
          ].map(({ label, value, hint }) => (
            <View key={label}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: colors.textMuted }}>{label}</Text>
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.textSecondary }}>{value}</Text>
              </View>
              {hint ? <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{hint}</Text> : null}
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: colors.textPrimary }}>{t('simulator.stage5_out_of_pocket')}</Text>
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: GOLD }}>{fmt(outOfPocket)}</Text>
          </View>
        </View>

        {/* Continue */}
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={saving}
          style={{ marginTop: 28, backgroundColor: GOLD, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
        >
          {saving ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: colors.background }}>
              {t('simulator.stage5_continue')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
