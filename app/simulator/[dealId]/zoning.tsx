import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
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
import { fetchDealFull, updatePlay, SimZoningQuestion } from '../../../lib/simulator';

const CARD_BG = '#1c1a14';

type OptionKey = 'a' | 'b' | 'c';

interface AnswerState {
  chosen: OptionKey | null;
  correct: boolean;
  revealed: boolean;
}

export default function ZoningScreen() {
  const { dealId, playId } = useLocalSearchParams<{ dealId: string; playId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();

  const [questions, setQuestions] = useState<SimZoningQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState<AnswerState>({ chosen: null, correct: false, revealed: false });
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [persisting, setPersisting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDealFull(dealId)
      .then((d) => setQuestions(d.zoning_questions))
      .catch(() => setErrorMsg(t('common.unknown_error')))
      .finally(() => setLoading(false));
  }, [dealId]);

  const current = questions[qIndex] ?? null;
  const total = questions.length;

  const handleOption = (opt: OptionKey) => {
    if (answer.revealed) return;
    const isCorrect = opt.toLowerCase() === (current?.correct_option ?? '').toLowerCase();
    const nextCorrect = isCorrect ? correctCount + 1 : correctCount;
    setAnswer({ chosen: opt, correct: isCorrect, revealed: true });
    if (isCorrect) setCorrectCount(nextCorrect);
  };

  const handleNext = async () => {
    const isLast = qIndex >= total - 1;
    if (isLast) {
      // Persist final zoning results
      if (playId) {
        setPersisting(true);
        try {
          await updatePlay(playId, {
            zoning_correct: answer.correct ? correctCount : correctCount,
            zoning_total: total,
          });
        } catch {
          // best-effort
        }
        setPersisting(false);
      }
      setDone(true);
    } else {
      setQIndex((i) => i + 1);
      setAnswer({ chosen: null, correct: false, revealed: false });
    }
  };

  const handleNumbers = () => {
    router.push(`/simulator/${dealId}/numbers?playId=${playId ?? ''}` as any);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <SimModal visible={!!errorMsg} message={errorMsg ?? ''} onClose={() => setErrorMsg(null)} />
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  const GOLD = colors.gold;

  // ── Results screen ──────────────────────────────────────────────
  if (done) {
    const pct = total > 0 ? correctCount / total : 0;
    const barWidth = Math.round(pct * 100);

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SimModal visible={!!errorMsg} message={errorMsg ?? ''} onClose={() => setErrorMsg(null)} />
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}>
            <Ionicons name="arrow-back" size={24} color={GOLD} />
          </Pressable>
          <View style={{ backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: colors.background, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('simulator.stage3_badge')}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontFamily: Fonts.headingHeavy, fontSize: 26, color: '#fff', textAlign: 'center', marginBottom: 32 }}>
            {t('simulator.stage3_results_title', { correct: correctCount, total })}
          </Text>

          {/* Gold progress bar */}
          <View style={{ width: '100%', height: 10, backgroundColor: colors.surface, borderRadius: 5, overflow: 'hidden', marginBottom: 40 }}>
            <View style={{ width: `${barWidth}%`, height: '100%', backgroundColor: GOLD, borderRadius: 5 }} />
          </View>

          <TouchableOpacity
            onPress={handleNumbers}
            activeOpacity={0.8}
            style={{ backgroundColor: GOLD, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 40, alignItems: 'center' }}
          >
            {persisting ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: colors.background }}>
                {t('simulator.stage3_results_btn')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // No questions seeded
  if (total === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}>
            <Ionicons name="arrow-back" size={24} color={GOLD} />
          </Pressable>
          <Text style={{ fontFamily: Fonts.heading, fontSize: 20, color: GOLD, flex: 1 }}>{t('simulator.stage3_title')}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 24 }}>
            {t('simulator.stage3_no_questions')}
          </Text>
          <TouchableOpacity onPress={handleNumbers} activeOpacity={0.8} style={{ backgroundColor: GOLD, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 }}>
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: colors.background }}>{t('simulator.stage3_results_btn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Question screen ─────────────────────────────────────────────
  const options: { key: OptionKey; label: string }[] = [
    { key: 'a', label: current.option_a },
    { key: 'b', label: current.option_b },
    ...(current.option_c ? [{ key: 'c' as OptionKey, label: current.option_c }] : []),
  ];

  const isCorrectOpt = (opt: OptionKey) =>
    opt.toLowerCase() === (current?.correct_option ?? '').toLowerCase();

  const optionBorderColor = (opt: OptionKey): string => {
    if (!answer.revealed) return colors.border;
    if (isCorrectOpt(opt)) return colors.success;
    if (opt === answer.chosen) return colors.error;
    return colors.border;
  };

  const optionBg = (opt: OptionKey): string => {
    if (!answer.revealed) return CARD_BG;
    if (isCorrectOpt(opt)) return colors.successBg;
    if (opt === answer.chosen) return colors.errorBg;
    return CARD_BG;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}>
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </Pressable>
        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 13, color: colors.textMuted, flex: 1 }}>
          {t('simulator.stage3_question_label', { current: qIndex + 1, total })}
        </Text>
        <View style={{ backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: colors.background, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('simulator.stage3_badge')}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ height: 3, backgroundColor: colors.surface, marginHorizontal: 20, borderRadius: 2, marginBottom: 20 }}>
        <View style={{ width: `${((qIndex + 1) / total) * 100}%`, height: '100%', backgroundColor: GOLD, borderRadius: 2 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 17, color: '#fff', lineHeight: 26, marginBottom: 24 }}>
          {current.question}
        </Text>

        {/* Option cards */}
        <View style={{ gap: 10 }}>
          {options.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => handleOption(key)}
              activeOpacity={0.8}
              disabled={answer.revealed}
              style={{
                backgroundColor: optionBg(key),
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: optionBorderColor(key),
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: answer.revealed && isCorrectOpt(key)
                  ? colors.success
                  : answer.revealed && key === answer.chosen
                    ? colors.error
                    : colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 12, color: '#fff', textTransform: 'uppercase' }}>{key}</Text>
              </View>
              <Text style={{ flex: 1, fontFamily: Fonts.body, fontSize: 15, color: colors.textPrimary, lineHeight: 22 }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback explanation */}
        {answer.revealed && (
          <View style={{
            marginTop: 16,
            backgroundColor: CARD_BG,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: answer.correct ? colors.success + '60' : colors.error + '60',
            padding: 16,
          }}>
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: answer.correct ? colors.success : colors.error, marginBottom: 6 }}>
              {answer.correct ? t('simulator.stage3_correct') : t('simulator.stage3_incorrect')}
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: colors.textSecondary, lineHeight: 21 }}>
              {current.explanation}
            </Text>
          </View>
        )}

        {/* Next button */}
        {answer.revealed && (
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.8}
            style={{ marginTop: 20, backgroundColor: GOLD, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: colors.background }}>
              {t('simulator.stage3_next')}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
