import { Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { Fonts } from '../../../../constants/fonts';
import { useColors } from '../../../../contexts/ThemeContext';

export default function QuizResultScreen() {
  const { moduleId, score, total, passed, nextModuleId, courseId } =
    useLocalSearchParams<{
      moduleId: string;
      score: string;
      total: string;
      passed: string;
      nextModuleId: string;
      courseId: string;
    }>();
  const { t } = useLanguage();
  const router = useRouter();
  const colors = useColors();
  const GOLD = colors.gold;
  const BG = colors.background;
  const GREEN = colors.success;

  const scoreNum = parseInt(score ?? '0', 10);
  const totalNum = parseInt(total ?? '0', 10);
  const didPass = passed === 'true';
  const hasNext = !!nextModuleId && nextModuleId.length > 0;

  function handlePrimary() {
    if (didPass) {
      if (hasNext) {
        router.navigate(`/education/module/${nextModuleId}` as any);
      } else {
        router.navigate(`/education/course/${courseId}` as any);
      }
    } else {
      router.replace(`/education/module/${moduleId}/quiz` as any);
    }
  }

  function handleSecondary() {
    if (didPass) {
      router.navigate(`/education/course/${courseId}` as any);
    } else {
      router.back(); // video screen is one level up in stack
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      {/* Icon */}
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: didPass ? colors.successBg : colors.surfacePanel,
          borderWidth: 1.5,
          borderColor: didPass ? colors.successBorder : colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
        }}
      >
        <Ionicons
          name={didPass ? 'trophy' : 'ribbon-outline'}
          size={42}
          color={didPass ? GREEN : colors.borderStrong}
        />
      </View>

      {/* Headline */}
      <Text
        style={{
          fontFamily: Fonts.heading,
          fontSize: 26,
          color: didPass ? GREEN : GOLD,
          textAlign: 'center',
          marginBottom: 10,
        }}
      >
        {didPass ? t('education.module_complete') : t('education.almost_there')}
      </Text>

      {/* Score */}
      <Text
        style={{
          fontFamily: Fonts.bodySemiBold,
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 48,
        }}
      >
        {t('education.your_score', { score: scoreNum, total: totalNum })}
      </Text>

      {/* Primary CTA */}
      <TouchableOpacity
        onPress={handlePrimary}
        activeOpacity={0.8}
        style={{
          backgroundColor: GOLD,
          borderRadius: 10,
          paddingVertical: 14,
          paddingHorizontal: 32,
          alignSelf: 'stretch',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: BG }}>
          {didPass
            ? hasNext
              ? t('education.next_module')
              : t('education.course_complete_cta')
            : t('education.retry_quiz')}
        </Text>
      </TouchableOpacity>

      {/* Secondary CTA */}
      <TouchableOpacity
        onPress={handleSecondary}
        activeOpacity={0.7}
        style={{ paddingVertical: 12, alignSelf: 'stretch', alignItems: 'center' }}
      >
        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 15, color: colors.goldMid }}>
          {didPass ? t('education.back_to_course') : t('education.rewatch_video')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
