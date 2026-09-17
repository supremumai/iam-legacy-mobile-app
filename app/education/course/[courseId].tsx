import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
  fetchCourseDetail,
  CourseDetailResult,
  EduModule,
} from '../../../lib/education';
import { Fonts } from '../../../constants/fonts';
import ProgressRing from '../../../components/education/ProgressRing';
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
): ModuleStatus {
  const mod = modules[index];
  if (progressMap[mod.id]?.quiz_passed === true) return 'completed';
  if (index === 0) return 'unlocked';
  if (progressMap[modules[index - 1].id]?.quiz_passed === true) return 'unlocked';
  return 'locked';
}

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

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
    // STUB navigation — Batch 67 replaces /education/module/[moduleId] with the
    // real video + quiz screen. This is safe to tap and shows a placeholder.
    router.push(`/education/module/${moduleId}` as any);
  };

  const handleStartOrContinue = () => {
    if (!result?.modules?.length) return;
    const firstUnlocked = result.modules.find(
      (_, i) => getModuleStatus(result.modules, i, result.progressMap) !== 'locked',
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

  const { course, modules, progressMap, enrollment } = result;
  const progressPct = enrollment?.progress_percent ?? 0;
  const hasStarted = progressPct > 0;

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

        {/* Hero */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: 24,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(201,168,76,0.12)',
          }}
        >
          {/* Difficulty badge */}
          {!!course.difficulty && (
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(201,168,76,0.12)',
                borderRadius: 99,
                paddingHorizontal: 12,
                paddingVertical: 4,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 12, color: '#c9a84c' }}>
                {difficultyLabel(course.difficulty, t)}
              </Text>
            </View>
          )}

          <Text
            style={{
              fontFamily: Fonts.heading,
              fontSize: 26,
              color: '#c9a84c',
              marginBottom: 8,
              lineHeight: 32,
            }}
          >
            {course.title}
          </Text>

          {!!course.description && (
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 14,
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 20,
                marginBottom: 20,
              }}
            >
              {course.description}
            </Text>
          )}

          {/* Progress ring + start/continue button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <ProgressRing percent={progressPct} size={84} strokeWidth={7} />

            <TouchableOpacity
              onPress={handleStartOrContinue}
              activeOpacity={0.8}
              style={{
                flex: 1,
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
        </View>

        {/* Module list */}
        <View style={{ paddingTop: 8 }}>
          <Text
            style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: 12,
              color: 'rgba(201,168,76,0.6)',
              letterSpacing: 1.1,
              textTransform: 'uppercase',
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            {`${modules.length} ${modules.length === 1 ? 'module' : 'modules'}`}
          </Text>

          {modules.map((mod, i) => {
            const status = getModuleStatus(modules, i, progressMap);
            return (
              <ModuleRow
                key={mod.id}
                module={mod}
                status={status}
                onPress={() => handleModulePress(mod.id)}
              />
            );
          })}
        </View>

        <View style={{ paddingBottom: 48 }} />
      </ScrollView>
    </View>
  );
}
