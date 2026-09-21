import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import { useLanguage } from '../../../../contexts/LanguageContext';
import {
  fetchQuizQuestions,
  fetchModuleDetail,
  submitQuizAttempt,
  EduQuizQuestion,
} from '../../../../lib/education';
import { Fonts } from '../../../../constants/fonts';
import { Colors } from '../../../../constants/colors';

const GOLD = Colors.gold;
const BG = Colors.background;
const GREEN = '#4caf50';
const RED = '#e53935';

type Option = 'a' | 'b' | 'c' | 'd';
const OPTIONS: Option[] = ['a', 'b', 'c', 'd'];
const OPTION_LABELS: Record<Option, string> = { a: 'A', b: 'B', c: 'C', d: 'D' };

function getOptionText(q: EduQuizQuestion, opt: Option): string {
  return q[`option_${opt}` as keyof EduQuizQuestion] as string;
}

function SegmentBar({ total, answered }: { total: number; answered: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, marginBottom: 20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: i < answered ? GOLD : 'rgba(255,255,255,0.15)',
          }}
        />
      ))}
    </View>
  );
}

export default function QuizScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<EduQuizQuestion[]>([]);
  const [courseId, setCourseId] = useState<string>('');
  const [nextModuleId, setNextModuleId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<Option | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const submitting = useRef(false);

  const load = useCallback(async () => {
    if (!moduleId) return;
    try {
      const [qs, detail] = await Promise.all([
        fetchQuizQuestions(moduleId),
        fetchModuleDetail(moduleId, user?.id ?? null),
      ]);
      setQuestions(qs);
      setCourseId(detail.module?.course_id ?? '');
      setNextModuleId(detail.nextModuleId);
    } finally {
      setLoading(false);
    }
  }, [moduleId, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const currentQuestion = questions[currentIndex] ?? null;
  const isLast = currentIndex === questions.length - 1;
  const answered = selected !== null;
  const isCorrect = answered && selected === currentQuestion?.correct_option;

  function handleSelect(opt: Option) {
    if (answered) return;
    setSelected(opt);
    if (opt === currentQuestion?.correct_option) {
      setCorrectCount((c) => c + 1);
    }
  }

  async function handleNext() {
    if (!answered || submitting.current) return;

    if (!isLast) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      return;
    }

    // Last question — submit and navigate to result
    submitting.current = true;
    const finalScore = isCorrect ? correctCount : correctCount; // already incremented on select
    try {
      if (user?.id) {
        await submitQuizAttempt(user.id, moduleId!, finalScore, questions.length);
      }
    } finally {
      router.replace({
        pathname: `/education/module/${moduleId}/result` as any,
        params: {
          score: String(finalScore),
          total: String(questions.length),
          passed: String(finalScore / questions.length >= 0.7),
          nextModuleId: nextModuleId ?? '',
          courseId,
        },
      });
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    );
  }

  // ── Empty state (all modules today, pre-seed) ──────────────────────────────
  if (questions.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 }}
        >
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#1a1600',
              borderWidth: 1,
              borderColor: Colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Ionicons name="hourglass-outline" size={34} color={Colors.borderStrong} />
          </View>

          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 22,
              color: GOLD,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            {t('education.quiz_coming_soon')}
          </Text>

          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 15,
              color: Colors.textMuted,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 36,
            }}
          >
            {t('education.no_questions_yet')}
          </Text>

          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            style={{
              backgroundColor: GOLD,
              borderRadius: 10,
              paddingVertical: 14,
              paddingHorizontal: 32,
            }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: BG }}>
              {t('education.back_to_module')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Active quiz ────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 48 }}
      >
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginBottom: 24 }}>
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </TouchableOpacity>

        {/* Progress label */}
        <Text
          style={{
            fontFamily: Fonts.bodySemiBold,
            fontSize: 13,
            color: Colors.textTertiary,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          {t('education.question_progress', { current: currentIndex + 1, total: questions.length })}
        </Text>

        {/* Segment bar */}
        <SegmentBar total={questions.length} answered={currentIndex} />

        {/* Question */}
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 20,
            color: Colors.textPrimary,
            lineHeight: 28,
            marginBottom: 28,
          }}
        >
          {currentQuestion!.question}
        </Text>

        {/* Options */}
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt;
          const correctOpt = currentQuestion!.correct_option;
          let bg: string = '#1a1600';
          let borderColor: string = Colors.border;
          let textColor: string = 'rgba(255,255,255,0.85)';

          if (answered) {
            if (opt === correctOpt) {
              bg = 'rgba(76,175,80,0.18)';
              borderColor = GREEN;
              textColor = Colors.textPrimary;
            } else if (isSelected) {
              bg = 'rgba(229,57,53,0.18)';
              borderColor = RED;
              textColor = Colors.textPrimary;
            }
          } else if (isSelected) {
            bg = Colors.border;
            borderColor = GOLD;
            textColor = Colors.textPrimary;
          }

          return (
            <TouchableOpacity
              key={opt}
              onPress={() => handleSelect(opt)}
              activeOpacity={answered ? 1 : 0.75}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: bg,
                borderWidth: 1.5,
                borderColor,
                borderRadius: 10,
                padding: 14,
                marginBottom: 10,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: borderColor }}>
                  {OPTION_LABELS[opt]}
                </Text>
              </View>
              <Text style={{ fontFamily: Fonts.body, fontSize: 15, color: textColor, flex: 1, lineHeight: 21 }}>
                {getOptionText(currentQuestion!, opt)}
              </Text>
              {answered && opt === correctOpt && (
                <Ionicons name="checkmark-circle" size={20} color={GREEN} />
              )}
              {answered && isSelected && opt !== correctOpt && (
                <Ionicons name="close-circle" size={20} color={RED} />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Explanation */}
        {answered && !!currentQuestion!.explanation && (
          <View
            style={{
              backgroundColor: '#151000',
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 10,
              padding: 14,
              marginTop: 4,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: GOLD, marginBottom: 4 }}>
              {isCorrect ? t('education.correct') : t('education.incorrect')}
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 }}>
              {currentQuestion!.explanation}
            </Text>
          </View>
        )}

        {/* Next / See Results button */}
        {answered && (
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.8}
            style={{
              backgroundColor: GOLD,
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: BG }}>
              {isLast ? t('education.see_results') : t('education.next_question')}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
