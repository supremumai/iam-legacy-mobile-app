import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useColors } from '../../../contexts/ThemeContext';
import { Fonts } from '../../../constants/fonts';
import { fetchDealFull, updatePlay, SimDealFull } from '../../../lib/simulator';

// ── Tunable constants ─────────────────────────────────────────────
const DEFAULT_COST_PER_SQFT = 150; // $ per sqft construction cost
const HOLDING_RATE_PER_MONTH = 0.01; // 1% of construction cost per month
// ─────────────────────────────────────────────────────────────────

const CARD_BG = '#1c1a14';

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString();
}

interface StepperProps {
  label: string;
  value: number;
  unit: string;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  colors: ReturnType<typeof import('../../../contexts/ThemeContext').useColors>;
}

function Stepper({ label, value, unit, step, min, max, onChange, colors }: StepperProps) {
  const GOLD = colors.gold;
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - step))}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="remove" size={20} color={GOLD} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: Fonts.headingHeavy, fontSize: 24, color: '#fff', textAlign: 'center' }}>
            {unit === '$' ? fmt(value) : `${value.toLocaleString()} ${unit}`}
          </Text>
          {/* Visual bar */}
          <View style={{ height: 3, backgroundColor: colors.surface, borderRadius: 2, marginTop: 8 }}>
            <View style={{ width: `${((value - min) / (max - min)) * 100}%`, height: '100%', backgroundColor: GOLD, borderRadius: 2 }} />
          </View>
        </View>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + step))}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="add" size={20} color={GOLD} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function calcNumbers(deal: SimDealFull, buildSqft: number, holdingMonths: number, salePrice: number) {
  const costPerSqft = deal.expert_cost_per_sqft ?? DEFAULT_COST_PER_SQFT;
  const constructionCost = buildSqft * costPerSqft;
  const holdingCost = Math.round(constructionCost * HOLDING_RATE_PER_MONTH * holdingMonths);
  const closingCost = Math.round(salePrice * (deal.expert_closing_pct ?? 0.05));
  const profit = salePrice - deal.price - constructionCost - holdingCost - closingCost;
  return { constructionCost, holdingCost, closingCost, profit };
}

export default function NumbersScreen() {
  const { dealId, playId } = useLocalSearchParams<{ dealId: string; playId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const GOLD = colors.gold;

  const [deal, setDeal] = useState<SimDealFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [buildSqft, setBuildSqft] = useState(2000);
  const [holdingMonths, setHoldingMonths] = useState(12);
  const [salePrice, setSalePrice] = useState(500000);

  useEffect(() => {
    fetchDealFull(dealId)
      .then((d) => {
        setDeal(d);
        setBuildSqft(d.expert_build_sqft ?? 2000);
        setHoldingMonths(d.expert_holding_months ?? 12);
        setSalePrice(d.expert_sale_price ?? Math.round(d.price * 1.6));
      })
      .catch((e) => Alert.alert(t('common.error'), e?.message ?? t('common.unknown_error')))
      .finally(() => setLoading(false));
  }, [dealId]);

  if (loading || !deal) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    );
  }

  const { constructionCost, holdingCost, closingCost, profit } = calcNumbers(deal, buildSqft, holdingMonths, salePrice);

  const barPct = Math.max(0, Math.min(profit / (deal.price * 0.6), 1)) * 100;
  const profitColor = profit < 0 ? colors.error : profit < deal.price * 0.05 ? colors.textMuted : GOLD;

  const handleContinue = async () => {
    setSaving(true);
    try {
      if (playId) {
        const numbers = {
          purchase_price: deal.price,
          build_sqft: buildSqft,
          cost_per_sqft: deal.expert_cost_per_sqft ?? DEFAULT_COST_PER_SQFT,
          holding_months: holdingMonths,
          sale_price: salePrice,
          construction_cost: constructionCost,
          holding_cost: holdingCost,
          closing_cost: closingCost,
          gross_profit: profit,
        };
        await updatePlay(playId, { numbers });
      }
    } catch {
      // best-effort
    }
    setSaving(false);
    router.push(`/simulator/${dealId}/loan?playId=${playId ?? ''}` as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </TouchableOpacity>
        <Text style={{ fontFamily: Fonts.heading, fontSize: 20, color: GOLD, flex: 1 }}>
          {t('simulator.stage4_title')}
        </Text>
        <View style={{ backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: colors.background, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('simulator.stage4_badge')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* El Contador */}
        <View style={{ backgroundColor: CARD_BG, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: GOLD + '40' }}>
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
            {t('simulator.stage4_counter_label')}
          </Text>
          <Text style={{ fontFamily: Fonts.headingHeavy, fontSize: 36, color: profitColor, marginBottom: 12 }}>
            {profit < 0 ? '-' : '+'}{fmt(Math.abs(profit))}
          </Text>
          <View style={{ height: 8, backgroundColor: colors.surface, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ width: `${barPct}%`, height: '100%', backgroundColor: profitColor, borderRadius: 4 }} />
          </View>
        </View>

        {/* Steppers */}
        <Stepper
          label={t('simulator.stage4_build_sqft')}
          value={buildSqft}
          unit="sqft"
          step={250}
          min={500}
          max={10000}
          onChange={setBuildSqft}
          colors={colors}
        />
        <Stepper
          label={t('simulator.stage4_holding')}
          value={holdingMonths}
          unit={t('simulator.stage4_months_unit')}
          step={1}
          min={1}
          max={36}
          onChange={setHoldingMonths}
          colors={colors}
        />
        <Stepper
          label={t('simulator.stage4_sale_price')}
          value={salePrice}
          unit="$"
          step={10000}
          min={50000}
          max={5000000}
          onChange={setSalePrice}
          colors={colors}
        />

        {/* Summary card */}
        <View style={{ backgroundColor: CARD_BG, borderRadius: 14, padding: 18, marginTop: 8, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
          {[
            { label: t('simulator.stage4_construction'), value: fmt(constructionCost) },
            { label: t('simulator.stage4_holding_cost'), value: fmt(holdingCost) },
            { label: t('simulator.stage4_closing_cost'), value: fmt(closingCost) },
          ].map(({ label, value }) => (
            <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: colors.textMuted }}>{label}</Text>
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.textSecondary }}>{value}</Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: colors.textPrimary }}>{t('simulator.stage4_gross_profit')}</Text>
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: profitColor }}>{profit >= 0 ? '' : '-'}{fmt(Math.abs(profit))}</Text>
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
              {t('simulator.stage4_continue')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
