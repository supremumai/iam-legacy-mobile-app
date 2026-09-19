import { supabase } from './supabase';

export interface EduCourse {
  id: string;
  track_id: string;
  title: string;
  description: string | null;
  order_index: number;
  difficulty: string | null;
  thumbnail_url: string | null;
  modules_count: number;
  is_published: boolean;
}

export interface EduTrack {
  id: string;
  title: string;
  tagline: string | null;
  description: string | null;
  order_index: number;
  thumbnail_url: string | null;
  is_published: boolean;
  courses: EduCourse[];
}

export interface EduModule {
  id: string;
  course_id: string;
  title: string;
  summary: string | null;
  order_index: number;
  video_url: string | null;
  video_duration_seconds: number | null;
  key_terms: string[] | null;
  is_published: boolean;
}

export interface EduUserProgress {
  module_id: string;
  video_watched: boolean;
  quiz_attempts: number;
  best_score: number | null;
  quiz_passed: boolean;
  completed_at: string | null;
}

export interface EduEnrollment {
  course_id: string;
  enrolled_at: string;
  progress_percent: number;
  completed_at: string | null;
}

export interface CourseDetailResult {
  course: EduCourse | null;
  modules: EduModule[];
  progressMap: Record<string, EduUserProgress>;
  enrollment: EduEnrollment | null;
}

export async function fetchTracks(): Promise<EduTrack[]> {
  try {
    const { data: tracks, error: tracksError } = await supabase
      .from('tracks')
      .select('id, title, tagline, description, order_index, thumbnail_url, is_published')
      .eq('is_published', true)
      .order('order_index', { ascending: true });

    if (tracksError || !tracks || tracks.length === 0) return [];

    const trackIds = tracks.map((t) => t.id);

    const { data: courses, error: coursesError } = await supabase
      .from('edu_courses')
      .select(
        'id, track_id, title, description, order_index, difficulty, thumbnail_url, modules_count, is_published',
      )
      .eq('is_published', true)
      .in('track_id', trackIds)
      .order('order_index', { ascending: true });

    if (coursesError) return [];

    const coursesByTrack: Record<string, EduCourse[]> = {};
    for (const c of courses ?? []) {
      if (!coursesByTrack[c.track_id]) coursesByTrack[c.track_id] = [];
      coursesByTrack[c.track_id].push(c as EduCourse);
    }

    return tracks.map((t) => ({
      ...t,
      courses: coursesByTrack[t.id] ?? [],
    })) as EduTrack[];
  } catch {
    return [];
  }
}

export interface ModuleDetailResult {
  module: EduModule | null;
  progress: EduUserProgress | null;
  nextModuleId: string | null;
}

export async function fetchModuleDetail(
  moduleId: string,
  userId: string | null,
): Promise<ModuleDetailResult> {
  const empty: ModuleDetailResult = { module: null, progress: null, nextModuleId: null };

  try {
    const { data: mod, error: modError } = await supabase
      .from('edu_modules')
      .select(
        'id, course_id, title, summary, order_index, video_url, video_duration_seconds, key_terms, is_published',
      )
      .eq('id', moduleId)
      .single();

    if (modError || !mod) return empty;

    const module = mod as EduModule;

    const [progressResult, nextResult] = await Promise.all([
      userId
        ? supabase
            .from('edu_user_progress')
            .select(
              'module_id, video_watched, quiz_attempts, best_score, quiz_passed, completed_at',
            )
            .eq('user_id', userId)
            .eq('module_id', moduleId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('edu_modules')
        .select('id')
        .eq('course_id', module.course_id)
        .eq('is_published', true)
        .gt('order_index', module.order_index)
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      module,
      progress: (progressResult.data ?? null) as EduUserProgress | null,
      nextModuleId: nextResult.data?.id ?? null,
    };
  } catch {
    return empty;
  }
}

export interface EduQuizQuestion {
  id: string;
  module_id: string;
  order_index: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'a' | 'b' | 'c' | 'd';
  explanation: string | null;
}

export interface QuizAttemptResult {
  passed: boolean;
  score: number;
  alreadyPassed: boolean;
}

export async function fetchQuizQuestions(moduleId: string): Promise<EduQuizQuestion[]> {
  try {
    const { data, error } = await supabase
      .from('edu_quiz_questions')
      .select('id, module_id, order_index, question, option_a, option_b, option_c, option_d, correct_option, explanation')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });
    if (error) return [];
    return (data ?? []).map((q) => ({
      ...q,
      correct_option: (q.correct_option as string).toLowerCase() as EduQuizQuestion['correct_option'],
    }));
  } catch {
    return [];
  }
}

// Read-then-write pattern (consistent with project; single-user writes make races negligible).
// quiz_passed never reverts to false; best_score stores the historical maximum.
export async function submitQuizAttempt(
  userId: string,
  moduleId: string,
  score: number,
  totalQuestions: number,
): Promise<QuizAttemptResult> {
  const passed = totalQuestions > 0 && score / totalQuestions >= 0.7;
  try {
    const { data: current } = await supabase
      .from('edu_user_progress')
      .select('quiz_attempts, best_score, quiz_passed, completed_at')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .maybeSingle();

    const alreadyPassed = current?.quiz_passed ?? false;
    const prevAttempts = current?.quiz_attempts ?? 0;
    const prevBest = current?.best_score ?? null;
    const newBest = prevBest === null ? score : Math.max(prevBest, score);
    const newPassed = alreadyPassed || passed;

    const payload: Record<string, unknown> = {
      user_id: userId,
      module_id: moduleId,
      video_watched: true,
      quiz_attempts: prevAttempts + 1,
      best_score: newBest,
      quiz_passed: newPassed,
    };
    if (newPassed && !alreadyPassed) {
      payload.completed_at = new Date().toISOString();
    }

    await supabase.from('edu_user_progress').upsert(payload, { onConflict: 'user_id,module_id' });

    return { passed, score, alreadyPassed };
  } catch {
    return { passed, score, alreadyPassed: false };
  }
}

export async function setModuleVideoUrl(
  moduleId: string,
  url: string | null,
): Promise<{ error: string } | null> {
  try {
    const { error } = await supabase
      .from('edu_modules')
      .update({ video_url: url })
      .eq('id', moduleId);
    if (error) return { error: error.message };
    return null;
  } catch (e: any) {
    return { error: e?.message ?? 'Could not save URL' };
  }
}

export interface ContinueLearningResult {
  moduleId: string;
  moduleTitle: string;
  courseTitle: string;
  courseId: string;
  moduleOrderIndex: number;
  videoWatched: boolean;
}

export async function fetchContinueLearning(
  userId: string | null,
): Promise<ContinueLearningResult | null> {
  if (!userId) return null;
  try {
    const { data: progress } = await supabase
      .from('edu_user_progress')
      .select('module_id, video_watched')
      .eq('user_id', userId)
      .eq('quiz_passed', false)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!progress) return null;

    const { data: mod, error: modError } = await supabase
      .from('edu_modules')
      .select('id, title, order_index, course_id')
      .eq('id', progress.module_id)
      .single();

    if (modError || !mod) return null;

    const { data: course, error: courseError } = await supabase
      .from('edu_courses')
      .select('id, title')
      .eq('id', mod.course_id)
      .single();

    if (courseError || !course) return null;

    return {
      moduleId: progress.module_id,
      moduleTitle: mod.title,
      courseTitle: course.title,
      courseId: course.id,
      moduleOrderIndex: mod.order_index,
      videoWatched: progress.video_watched ?? false,
    };
  } catch {
    return null;
  }
}

export async function fetchHomeCourses(): Promise<EduCourse[]> {
  try {
    const { data, error } = await supabase
      .from('edu_courses')
      .select(
        'id, track_id, title, description, order_index, difficulty, thumbnail_url, modules_count, is_published',
      )
      .eq('is_published', true)
      .order('order_index', { ascending: true })
      .limit(3);
    if (error) return [];
    return (data ?? []) as EduCourse[];
  } catch {
    return [];
  }
}

export async function updateQuizQuestion(
  id: string,
  fields: {
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: 'A' | 'B' | 'C' | 'D';
  },
): Promise<string | null> {
  try {
    const { error } = await supabase
      .from('edu_quiz_questions')
      .update(fields)
      .eq('id', id);
    if (error) return error.message;
    return null;
  } catch (e: any) {
    return e?.message ?? 'Could not save';
  }
}

export async function upsertVideoWatched(moduleId: string, userId: string): Promise<void> {
  try {
    await supabase
      .from('edu_user_progress')
      .upsert(
        { user_id: userId, module_id: moduleId, video_watched: true },
        { onConflict: 'user_id,module_id' },
      );
  } catch {
    // silent — progress is best-effort; user can rewatch and it will retry
  }
}

export async function fetchCourseDetail(
  courseId: string,
  userId: string | null,
): Promise<CourseDetailResult> {
  const empty: CourseDetailResult = {
    course: null,
    modules: [],
    progressMap: {},
    enrollment: null,
  };

  try {
    const [courseResult, modulesResult] = await Promise.all([
      supabase
        .from('edu_courses')
        .select(
          'id, track_id, title, description, order_index, difficulty, thumbnail_url, modules_count, is_published',
        )
        .eq('id', courseId)
        .single(),
      supabase
        .from('edu_modules')
        .select(
          'id, course_id, title, summary, order_index, video_url, video_duration_seconds, key_terms, is_published',
        )
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('order_index', { ascending: true }),
    ]);

    if (courseResult.error || !courseResult.data) return empty;

    const modules = (modulesResult.data ?? []) as EduModule[];
    let progressMap: Record<string, EduUserProgress> = {};
    let enrollment: EduEnrollment | null = null;

    if (userId && modules.length > 0) {
      const moduleIds = modules.map((m) => m.id);
      const [progressResult, enrollmentResult] = await Promise.all([
        supabase
          .from('edu_user_progress')
          .select('module_id, video_watched, quiz_attempts, best_score, quiz_passed, completed_at')
          .eq('user_id', userId)
          .in('module_id', moduleIds),
        supabase
          .from('edu_enrollments')
          .select('course_id, enrolled_at, progress_percent, completed_at')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .maybeSingle(),
      ]);

      for (const p of progressResult.data ?? []) {
        progressMap[p.module_id] = p as EduUserProgress;
      }
      enrollment = (enrollmentResult.data ?? null) as EduEnrollment | null;
    }

    return {
      course: courseResult.data as EduCourse,
      modules,
      progressMap,
      enrollment,
    };
  } catch {
    return empty;
  }
}
