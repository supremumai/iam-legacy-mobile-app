import { useEffect } from 'react';
import { BackHandler, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { Fonts } from '../../../../constants/fonts';
import { useColors } from '../../../../contexts/ThemeContext';
import { QUIZ_PASS_THRESHOLD } from '../../../../lib/education';

const XP_AWARD = 25;

export default function QuizResultScreen() {
  const {
    moduleId,
    score,
    total,
    passed,
    nextModuleId,
    courseId,
    moduleTitle,
    attemptNumber,
  } = useLocalSearchParams<{
    moduleId: string;
    score: string;
    total: string;
    passed: string;
    nextModuleId: string;
    courseId: string;
    moduleTitle: string;
    attemptNumber: string;
  }>();
  const { t } = useLanguage();
  const router = useRouter();
  const colors = useColors();

  const scoreNum = parseInt(score ?? '0', 10);
  const totalNum = parseInt(total ?? '1', 10);
  const attemptNum = parseInt(attemptNumber ?? '1', 10);
  const didPass = passed === 'true';
  const hasNext = !!nextModuleId && nextModuleId.length > 0;
  const pct = totalNum > 0 ? Math.round((scoreNum / totalNum) * 100) : 0;
  const barFill = Math.min(Math.max(pct, 0), 100);

  // Always go to course on hardware/gesture back
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goToCourse();
      return true;
    });
    return () => sub.remove();
  }, [courseId]);

  function goToCourse() {
    if (courseId) {
      router.replace(`/education/course/${courseId}` as any);
    } else {
      router.replace('/(drawer)/(tabs)/education' as any);
    }
  }

  function goToEducation() {
    router.replace('/(drawer)/(tabs)/education' as any);
  }

  function handleRetry() {
    router.replace(`/education/module/${moduleId}/quiz` as any);
  }

  function handleRewatchVideo() {
    router.replace(`/education/module/${moduleId}` as any);
  }

  function handleNextModule() {
    router.replace(`/education/module/${nextModuleId}` as any);
  }

  const thresholdPct = Math.round(QUIZ_PASS_THRESHOLD * 100);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Back arrow — always visible, always safe */}
      <TouchableOpacity
        onPress={goToCourse}
        activeOpacity={0.7}
        style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 }}
      >
        <Ionicons name="arrow-back" size={24} color={colors.gold} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 56, alignItems: 'center' }}
      >
        {/* Icon */}
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: didPass ? 'rgba(201,168,76,0.12)' : colors.surface,
            borderWidth: 1.5,
            borderColor: didPass ? colors.gold : colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 24,
            marginBottom: 24,
          }}
        >
          <Ionicons
            name={didPass ? 'trophy' : 'ribbon-outline'}
            size={44}
            color={didPass ? colors.gold : colors.textMuted}
          />
        </View>

        {/* Headline */}
        <Text
          style={{
            fontFamily: Fonts.heading,
            fontSize: 28,
            color: didPass ? colors.gold : colors.textPrimary,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          {didPass
            ? (hasNext ? t('education.module_mastered') : t('education.course_complete_heading'))
            : t('education.almost_there')}
        </Text>

        {/* Module title */}
        {!!moduleTitle && (
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 14,
              color: colors.textMuted,
              textAlign: 'center',
              marginBottom: 20,
            }}
            numberOfLines={2}
          >
            {moduleTitle}
          </Text>
        )}

        {/* Big score % */}
        <Text
          style={{
            fontFamily: Fonts.headingHeavy,
            fontSize: 64,
            lineHeight: 68,
            color: didPass ? colors.gold : colors.textPrimary,
            textAlign: 'center',
            marginBottom: 4,
          }}
        >
          {pct}%
        </Text>

        {/* X de Y correctas */}
        <Text
          style={{
            fontFamily: Fonts.bodySemiBold,
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          {t('education.your_score', { score: scoreNum, total: totalNum })}
        </Text>

        {/* Progress bar */}
        <View
          style={{
            width: '100%',
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.surface,
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${barFill}%`,
              height: '100%',
              borderRadius: 3,
              backgroundColor: didPass ? colors.gold : colors.textMuted,
            }}
          />
        </View>

        {/* Attempt label */}
        <Text
          style={{
            fontFamily: Fonts.body,
            fontSize: 12,
            color: colors.textFaint,
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          {t('education.attempt_label', { n: attemptNum })}
        </Text>

        {didPass ? (
          // ── PASS STATE ────────────────────────────────────────────────
          <>
            {/* XP earned */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(201,168,76,0.12)',
                borderRadius: 99,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginBottom: 32,
              }}
            >
              <Ionicons name="flash" size={14} color={colors.gold} />
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: colors.gold }}>
                {t('education.xp_earned', { xp: XP_AWARD })}
              </Text>
            </View>

            {/* Primary: next module or back to education */}
            <TouchableOpacity
              onPress={hasNext ? handleNextModule : goToEducation}
              activeOpacity={0.8}
              style={{
                backgroundColor: colors.gold,
                borderRadius: 12,
                paddingVertical: 16,
                alignSelf: 'stretch',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: colors.background }}>
                {hasNext ? t('education.next_module') : t('education.back_to_education')}
              </Text>
            </TouchableOpacity>

            {/* Secondary: back to course */}
            <TouchableOpacity
              onPress={goToCourse}
              activeOpacity={0.7}
              style={{
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: colors.border,
                paddingVertical: 14,
                alignSelf: 'stretch',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textSecondary }}>
                {t('education.back_to_course')}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // ── NOT-PASSED STATE ──────────────────────────────────────────
          <>
            {/* Encouraging hint */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 32,
                alignSelf: 'stretch',
              }}
            >
              <Text
                style={{
                  fontFamily: Fonts.body,
                  fontSize: 14,
                  color: colors.textMuted,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                {t('education.mastery_hint', { pct: thresholdPct })}
              </Text>
            </View>

            {/* Primary: retry */}
            <TouchableOpacity
              onPress={handleRetry}
              activeOpacity={0.8}
              style={{
                backgroundColor: colors.gold,
                borderRadius: 12,
                paddingVertical: 16,
                alignSelf: 'stretch',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 16, color: colors.background }}>
                {t('education.retry_quiz')}
              </Text>
            </TouchableOpacity>

            {/* Secondary: rewatch video */}
            <TouchableOpacity
              onPress={handleRewatchVideo}
              activeOpacity={0.7}
              style={{
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: colors.border,
                paddingVertical: 14,
                alignSelf: 'stretch',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.textSecondary }}>
                {t('education.rewatch_video')}
              </Text>
            </TouchableOpacity>

            {/* Tertiary text link: back to course */}
            <TouchableOpacity onPress={goToCourse} activeOpacity={0.6}>
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.textFaint }}>
                {t('education.back_to_course')}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
