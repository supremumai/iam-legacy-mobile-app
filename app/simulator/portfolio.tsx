import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SimModal } from '../../components/SimModal';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useColors } from '../../contexts/ThemeContext';
import { Fonts } from '../../constants/fonts';
import { fetchCompletedPlays, fetchDealsByIds, SimPlay, SimDeal } from '../../lib/simulator';

const CARD_BG = '#1c1a14';

function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  return (n >= 0 ? '+' : '') + '$' + Math.round(Math.abs(n)).toLocaleString();
}

export default function PortfolioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const { user } = useAuth();
  const GOLD = colors.gold;

  const [loading, setLoading] = useState(true);
  const [plays, setPlays] = useState<SimPlay[]>([]);
  const [dealsMap, setDealsMap] = useState<Record<string, SimDeal>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetchCompletedPlays(user.id)
      .then(async (p) => {
        setPlays(p);
        if (p.length > 0) {
          const ids = [...new Set(p.map((x) => x.deal_id).filter(Boolean) as string[])];
          const deals = await fetchDealsByIds(ids);
          const map: Record<string, SimDeal> = {};
          deals.forEach((d) => { map[d.id] = d; });
          setDealsMap(map);
        }
      })
      .catch(() => setErrorMsg(t('common.unknown_error')))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const totalPlayed = plays.length;
  const expertMatchCount = plays.filter((p) => {
    const deal = p.deal_id ? dealsMap[p.deal_id] : null;
    if (!deal) return false;
    return (deal.expert_decision ?? '').toLowerCase() === (p.decision ?? '').toLowerCase();
  }).length;
  const accuracyPct = totalPlayed > 0 ? Math.round((expertMatchCount / totalPlayed) * 100) : 0;
  const bestRating = plays.reduce((max, p) => Math.max(max, Number(p.rating ?? 0)), 0);

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
        <Text style={{ fontFamily: Fonts.heading, fontSize: 22, color: GOLD, flex: 1 }}>
          {t('simulator.portfolio_title')}
        </Text>
        <View style={{ backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: colors.background, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('simulator.portfolio_badge')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        {/* Track-record strip */}
        {totalPlayed > 0 && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {[
              { label: t('simulator.portfolio_stat_played'), value: String(totalPlayed) },
              { label: t('simulator.portfolio_stat_accuracy'), value: `${accuracyPct}%` },
              { label: t('simulator.portfolio_stat_best_rating'), value: `${bestRating}/3` },
            ].map(({ label, value }) => (
              <View key={label} style={{ flex: 1, backgroundColor: CARD_BG, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontFamily: Fonts.headingHeavy, fontSize: 22, color: GOLD }}>{value}</Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 4 }}>{label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Play cards */}
        {plays.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60, gap: 12 }}>
            <Ionicons name="briefcase-outline" size={56} color={GOLD} style={{ opacity: 0.4 }} />
            <Text style={{ fontFamily: Fonts.heading, fontSize: 20, color: '#fff', textAlign: 'center' }}>
              {t('simulator.portfolio_empty')}
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
              {t('simulator.portfolio_empty_sub')}
            </Text>
          </View>
        ) : (
          plays.map((play) => {
            const deal = play.deal_id ? dealsMap[play.deal_id] : null;
            const nums = (play.numbers ?? {}) as Record<string, number>;
            const profit = play.profit_estimate ?? nums.final_profit ?? null;
            const ratingNum = Number(play.rating ?? 0);
            const decisionKey = play.decision === 'build'
              ? 'portfolio_decision_build'
              : play.decision === 'pass'
                ? 'portfolio_decision_pass'
                : 'portfolio_decision_other';
            const decisionColor = play.decision === 'build' ? GOLD : play.decision === 'pass' ? colors.error : colors.textMuted;
            const date = new Date(play.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <View
                key={play.id}
                style={{ backgroundColor: CARD_BG, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: colors.textPrimary }} numberOfLines={1}>
                      {deal?.title ?? '—'}
                    </Text>
                    <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
                      {deal?.address ?? '—'}
                    </Text>
                  </View>
                  {/* Decision chip */}
                  <View style={{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1.5, borderColor: decisionColor, marginLeft: 10 }}>
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: decisionColor, letterSpacing: 0.5 }}>
                      {t(`simulator.${decisionKey}`)}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {t('simulator.portfolio_est_profit')}
                    </Text>
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: profit != null && profit < 0 ? colors.error : GOLD, marginTop: 2 }}>
                      {fmt(profit)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {Array.from({ length: 3 }, (_, i) => (
                        <Ionicons key={i} name="star" size={14} color={i < ratingNum ? GOLD : colors.surface} />
                      ))}
                    </View>
                    <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: colors.textFaint }}>{date}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
