import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAdminInEducation } from '../../../hooks/useAdminInEducation';
import {
  fetchCourseDetail,
  getTrackIcon,
  CourseDetailResult,
  EduModule,
} from '../../../lib/education';
import { Fonts } from '../../../constants/fonts';
import ModuleRow from '../../../components/education/ModuleRow';
import type { ModuleStatus } from '../../../components/education/ModuleRow';

function difficultyLabel(difficulty: string | null, t: (k: string) => string): string {
  switch (difficulty?.toLowerCase()) {
    case 'beginner': return t('education.difficulty_beginner');
    case 'intermediate': return t('education.difficulty_intermediate');
    case 'advanced': return t('education.difficulty_advanced');
    default: return difficulty ?? '';
  }
}

function getModuleStatus(
  modules: EduModule[],
  index: number,
  progressMap: Record<string, import('../../../lib/education').EduUserProgress>,
  isAdmin?: boolean,
): ModuleStatus {
  const mod = modules[index];
  if (progressMap[mod.id]?.quiz_passed === true) return 'completed';
  if (isAdmin) return 'unlocked';
  if (index === 0) return 'unlocked';
  if (progressMap[modules[index - 1].id]?.quiz_passed === true) return 'unlocked';
  return 'locked';
}

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const isAdmin = useAdminInEducation();

  const [result, setResult] = useState<CourseDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!courseId) return;
    setError(false);
    try {
      const data = await fetchCourseDetail(courseId, user?.id ?? null);
      setResult(data);
      if (!data.course) setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [courseId, user?.id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const handleModulePress = (moduleId: string) => {
    router.push(`/education/module/${moduleId}` as any);
  };

  const handleStartOrContinue = () => {
    if (!result?.modules?.length) return;
    const firstUnlocked = result.modules.find(
      (_, i) => getModuleStatus(result.modules, i, result.progressMap, isAdmin) !== 'locked',
    );
    if (firstUnlocked) handleModulePress(firstUnlocked.id);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0900', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#c9a84c" size="large" />
      </View>
    );
  }

  if (error || !result?.course) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 }}
        >
          <Ionicons name="arrow-back" size={24} color="#c9a84c" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 16,
              color: '#FFFFFF',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {t('education.could_not_load_course')}
          </Text>
          <Pressable
            onPress={() => { setLoading(true); load(); }}
            style={{ backgroundColor: '#c9a84c', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: '#0a0900' }}>
              {t('events.retry')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { course, modules, progressMap, enrollment, trackTitle } = result;
  const progressPct = enrollment?.progress_percent ?? 0;
  const hasStarted = progressPct > 0;
  const modulesDone = Object.values(progressMap).filter((p) => p.quiz_passed).length;
  const barWidth = `${Math.min(Math.max(progressPct, 0), 100)}%` as const;
  const trackIcon = getTrackIcon(trackTitle ?? '');

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0900' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#c9a84c" />
        </TouchableOpacity>

        {/* Hero card */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 24,
            borderRadius: 16,
            borderWidth: 0.5,
            borderColor: 'rgba(197,164,84,0.25)',
            backgroundColor: '#1c1a14',
            padding: 20,
          }}
        >
          {/* Top row: track icon + difficulty badge / course title */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: 'rgba(197,164,84,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Ionicons name={trackIcon as any} size={24} color="#c5a454" />
            </View>

            <View style={{ flex: 1 }}>
              {!!course.difficulty && (
                <View
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: 'rgba(201,168,76,0.12)',
                    borderRadius: 99,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: '#c9a84c' }}>
                    {difficultyLabel(course.difficulty, t)}
                  </Text>
                </View>
              )}
              <Text
                style={{
                  fontFamily: Fonts.heading,
                  fontSize: 20,
                  color: '#e8e0cc',
                  lineHeight: 26,
                }}
                numberOfLines={3}
              >
                {course.title}
              </Text>
            </View>
          </View>

          {/* Description */}
          {!!course.description && (
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 14,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 20,
                marginBottom: 16,
              }}
            >
              {course.description}
            </Text>
          )}

          {/* Progress bar */}
          <View
            style={{
              height: 5,
              borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.08)',
              marginBottom: 8,
              overflow: 'hidden',
            }}
          >
            {progressPct > 0 && (
              <View
                style={{
                  height: '100%',
                  width: barWidth,
                  borderRadius: 3,
                  backgroundColor: '#c5a454',
                }}
              />
            )}
          </View>

          {/* Progress count */}
          <Text
            style={{
              fontFamily: Fonts.body,
              fontSize: 12,
              color: 'rgba(255,255,255,0.45)',
              marginBottom: 16,
            }}
          >
            {t('education.course_modules_complete', { done: modulesDone, total: modules.length })}
          </Text>

          {/* Start / Continue button */}
          <TouchableOpacity
            onPress={handleStartOrContinue}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#c9a84c',
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 15, color: '#0a0900' }}>
              {hasStarted ? t('education.continue_course') : t('education.start_course')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Module timeline list */}
        <View style={{ paddingBottom: 48 }}>
          {modules.map((mod, i) => {
            const status = getModuleStatus(modules, i, progressMap, isAdmin);
            return (
              <ModuleRow
                key={mod.id}
                module={mod}
                status={status}
                index={i}
                total={modules.length}
                onPress={() => handleModulePress(mod.id)}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
