import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SimModal } from '../../../components/SimModal';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useColors } from '../../../contexts/ThemeContext';
import { Fonts } from '../../../constants/fonts';
import { fetchDealFull, updatePlay, SimDealFull, SimDealFact } from '../../../lib/simulator';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const CARD_WIDTH = width - 40; // 20px margin each side
const MAX_FICHAS = 3;
const CARD_BG = '#1c1a14';

interface DossierCard {
  labelKey: string;
  value: string | null;
}

function buildDossierCards(deal: SimDealFull, t: (k: string) => string): DossierCard[] {
  return [
    { labelKey: 'simulator.stage2_attr_price', value: `$${deal.price.toLocaleString()}` },
    { labelKey: 'simulator.stage2_attr_zoning', value: deal.zoning },
    { labelKey: 'simulator.stage2_attr_lot', value: deal.lot_size_sqft ? `${deal.lot_size_sqft.toLocaleString()} ${t('simulator.sqft_unit')}` : null },
    { labelKey: 'simulator.stage2_attr_utilities', value: deal.utilities },
    { labelKey: 'simulator.stage2_attr_flood', value: deal.flood_zone },
    { labelKey: 'simulator.stage2_attr_owner', value: deal.current_owner },
    { labelKey: 'simulator.stage2_attr_jurisdiction', value: deal.jurisdiction },
    { labelKey: 'simulator.stage2_attr_date', value: deal.purchase_date },
  ].filter((c) => c.value != null) as DossierCard[];
}

export default function DossierScreen() {
  const { dealId, playId } = useLocalSearchParams<{ dealId: string; playId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();

  const [deal, setDeal] = useState<SimDealFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardIndex, setCardIndex] = useState(0);
  const [fichasLeft, setFichasLeft] = useState(MAX_FICHAS);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [locked, setLocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchDealFull(dealId)
      .then(setDeal)
      .catch(() => setErrorMsg(t('common.unknown_error')))
      .finally(() => setLoading(false));
  }, [dealId]);

  const handleReveal = (fact: SimDealFact) => {
    if (locked) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (revealedIds.has(fact.id)) {
      // Collapse and refund
      const next = new Set(revealedIds);
      next.delete(fact.id);
      setRevealedIds(next);
      setFichasLeft((f) => Math.min(MAX_FICHAS, f + 1));
    } else {
      if (fichasLeft <= 0) return;
      const next = new Set(revealedIds);
      next.add(fact.id);
      setRevealedIds(next);
      setFichasLeft((f) => f - 1);
    }
  };

  const handleContinue = async () => {
    setLocked(true);
    if (playId) {
      await updatePlay(playId, { facts_investigated: Array.from(revealedIds) }).catch(() => {});
    }
    router.push(`/simulator/${dealId}/zoning?playId=${playId ?? ''}` as any);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (!deal) return null;

  const cards = buildDossierCards(deal, t);
  const GOLD = colors.gold;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SimModal visible={!!errorMsg} message={errorMsg ?? ''} onClose={() => setErrorMsg(null)} />
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
        >
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </Pressable>
        <Text style={{ fontFamily: Fonts.heading, fontSize: 20, color: GOLD, flex: 1 }}>
          {t('simulator.stage2_dossier_header')}
        </Text>
        {/* Stage badge */}
        <View style={{ backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: colors.background, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('simulator.stage2_badge')}
          </Text>
        </View>
      </View>

      {/* Dossier cards — horizontal FlatList with chevron affordance */}
      <View style={{ position: 'relative' }}>
      {cardIndex > 0 && (
        <View style={{ position: 'absolute', left: 4, top: '50%', zIndex: 10, marginTop: -16, opacity: 0.7 }}>
          <Ionicons name="chevron-back" size={28} color={GOLD} />
        </View>
      )}
      {cardIndex < cards.length - 1 && (
        <View style={{ position: 'absolute', right: 4, top: '50%', zIndex: 10, marginTop: -16, opacity: 0.7 }}>
          <Ionicons name="chevron-forward" size={28} color={GOLD} />
        </View>
      )}
      <FlatList
        ref={flatRef}
        data={cards}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 20}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 20, gap: 20 }}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 20));
          setCardIndex(idx);
        }}
        renderItem={({ item }) => (
          <View
            style={{
              width: CARD_WIDTH,
              backgroundColor: CARD_BG,
              borderRadius: 16,
              padding: 28,
              borderWidth: 1,
              borderColor: GOLD + '40',
              justifyContent: 'center',
              minHeight: 180,
            }}
          >
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
              {t(item.labelKey)}
            </Text>
            <Text style={{ fontFamily: Fonts.heading, fontSize: 28, color: '#fff', lineHeight: 36 }}>
              {item.value ?? '—'}
            </Text>
          </View>
        )}
        style={{ flexGrow: 0 }}
      />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Progress dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 }}>
          {cards.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === cardIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === cardIndex ? GOLD : GOLD + '33',
              }}
            />
          ))}
        </View>

        {/* Research budget */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>
            {t('simulator.stage2_fichas_hint')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: colors.textMuted }}>
              {t('simulator.stage2_fichas_label')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {Array.from({ length: MAX_FICHAS }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: i < fichasLeft ? GOLD : colors.surface,
                    borderWidth: 1.5,
                    borderColor: i < fichasLeft ? GOLD : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i < fichasLeft && (
                    <Ionicons name="cash-outline" size={14} color={colors.background} />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Facts list */}
          {deal.facts.length === 0 ? null : (
            <View style={{ gap: 8 }}>
              {deal.facts.map((fact) => {
                const revealed = revealedIds.has(fact.id);
                const canInteract = !locked && (revealed || fichasLeft > 0);

                return (
                  <TouchableOpacity
                    key={fact.id}
                    activeOpacity={canInteract ? 0.75 : 1}
                    onPress={canInteract ? () => handleReveal(fact) : undefined}
                    style={{
                      backgroundColor: CARD_BG,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: revealed ? GOLD + '60' : colors.border,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Header row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 }}>
                      <Ionicons
                        name={(fact.icon ?? 'search-outline') as any}
                        size={18}
                        color={revealed ? GOLD : colors.textMuted}
                      />
                      <Text style={{ flex: 1, fontFamily: Fonts.bodySemiBold, fontSize: 14, color: revealed ? colors.textPrimary : colors.textMuted }}>
                        {fact.title}
                      </Text>
                      {!revealed && !locked && (
                        fichasLeft > 0 ? (
                          <Ionicons name="lock-closed-outline" size={16} color={colors.textFaint} />
                        ) : (
                          <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: colors.textFaint }}>
                            {t('simulator.stage2_no_fichas')}
                          </Text>
                        )
                      )}
                      {revealed && !locked && (
                        <Ionicons name="chevron-up" size={16} color={GOLD} />
                      )}
                    </View>

                    {/* Revealed content */}
                    {revealed && (
                      <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingTop: 0 }}>
                        <View style={{ height: 1, backgroundColor: GOLD + '30', marginBottom: 10 }} />
                        <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: colors.textSecondary, lineHeight: 21 }}>
                          {fact.content}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Continue button */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={locked}
            style={{ backgroundColor: GOLD, borderRadius: 12, paddingVertical: 16, alignItems: 'center', opacity: locked ? 0.6 : 1 }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: colors.background }}>
              {t('simulator.stage2_continue')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
