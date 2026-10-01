import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useColors } from '../../../contexts/ThemeContext';
import { Fonts } from '../../../constants/fonts';
import { fetchDealFull, createPlay, fetchLastPlayForDeal, SimDealFull, SimPlay } from '../../../lib/simulator';

const { width, height } = Dimensions.get('window');

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
      .catch((e) => Alert.alert(t('common.error'), e?.message ?? t('common.unknown_error')))
      .finally(() => setLoading(false));
  }, [dealId, user?.id]);

  const handleGutCall = async (call: 'yes' | 'no') => {
    if (!user?.id || !deal) return;
    setSubmitting(call);
    try {
      const play = await createPlay({ user_id: user.id, deal_id: deal.id, gut_call: call });
      router.push(`/simulator/${dealId}/dossier?playId=${play.id}` as any);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('common.unknown_error'));
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
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Full-screen background */}
      {deal.image_url ? (
        <Image
          source={{ uri: deal.image_url }}
          style={{ position: 'absolute', top: 0, left: 0, width, height }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ position: 'absolute', top: 0, left: 0, width, height, backgroundColor: colors.background }} />
      )}

      {/* Dark overlay */}
      <View style={{ position: 'absolute', top: 0, left: 0, width, height, backgroundColor: 'rgba(0,0,0,0.62)' }} />

      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={({ pressed }) => ({
          position: 'absolute',
          top: insets.top + 12,
          left: 20,
          opacity: pressed ? 0.6 : 1,
          zIndex: 10,
          backgroundColor: 'rgba(0,0,0,0.4)',
          borderRadius: 20,
          padding: 6,
        })}
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </Pressable>

      {/* Stage label */}
      <View style={{ position: 'absolute', top: insets.top + 14, right: 20, zIndex: 10 }}>
        <View style={{ backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: colors.background, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('simulator.stage1_title')}
          </Text>
        </View>
      </View>

      {/* Bottom card */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 24,
          paddingTop: 28,
          backgroundColor: 'rgba(10,9,0,0.88)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        {/* Price chip */}
        <View style={{ alignSelf: 'flex-start', backgroundColor: colors.borderSubtle, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.borderStrong, marginBottom: 14 }}>
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: GOLD }}>
            ${deal.price.toLocaleString()}
          </Text>
        </View>

        <Text style={{ fontFamily: Fonts.headingHeavy, fontSize: 26, color: '#fff', marginBottom: 4 }} numberOfLines={2}>
          {deal.title}
        </Text>
        <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 24 }} numberOfLines={1}>
          {deal.address}
        </Text>

        {/* Replay banner */}
        {lastPlay?.decision ? (() => {
          const nums = (lastPlay.numbers ?? {}) as Record<string, number>;
          const profit = lastPlay.profit_estimate ?? nums.final_profit ?? null;
          const decisionLabel = lastPlay.decision === 'build'
            ? t('simulator.stage7_build_label')
            : lastPlay.decision === 'pass'
              ? t('simulator.stage7_pass_label')
              : t('simulator.stage7_other_label');
          const profitStr = profit != null ? '$' + Math.round(profit).toLocaleString() : '—';
          const ratingStr = lastPlay.rating ? t('simulator.stage1_replay_rating', { rating: lastPlay.rating }) : '';
          return (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="time-outline" size={14} color={GOLD} />
              <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.65)', flex: 1 }} numberOfLines={1}>
                {t('simulator.stage1_replay_last', { decision: decisionLabel, profit: profitStr })}{ratingStr}
              </Text>
            </View>
          );
        })() : null}

        {/* Question */}
        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 18, color: '#fff', marginBottom: 20, textAlign: 'center' }}>
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
            style={{ flex: 1, backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', opacity: submitting && submitting !== 'no' ? 0.4 : 1 }}
          >
            {submitting === 'no' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: '#fff' }}>
                {t('simulator.stage1_no')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
