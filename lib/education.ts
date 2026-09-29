import { supabase } from './supabase';

const TRACK_ICON_MAP: Array<[string, string]> = [
  ['wholesale', 'cash-outline'],
  ['investment', 'trending-up-outline'],
  ['financ', 'business-outline'],
];

export function getTrackIcon(trackTitle: string): string {
  const lower = trackTitle.toLowerCase();
  for (const [key, icon] of TRACK_ICON_MAP) {
    if (lower.includes(key)) return icon;
  }
  return 'book-outline';
}

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
  progress_percent: number;
  modules_done: number;
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
  trackTitle: string | null;
}

export async function fetchTracks(
  userId?: string | null,
  opts: { includeUnpublished?: boolean } = {},
): Promise<EduTrack[]> {
  try {
    let tracksQuery = supabase
      .from('tracks')
      .select('id, title, tagline, description, order_index, thumbnail_url, is_published')
      .order('order_index', { ascending: true });
    if (!opts.includeUnpublished) tracksQuery = tracksQuery.eq('is_published', true);
    const { data: tracks, error: tracksError } = await tracksQuery;

    if (tracksError || !tracks || tracks.length === 0) return [];

    const trackIds = tracks.map((t) => t.id);

    let coursesQuery = supabase
      .from('edu_courses')
      .select(
        'id, track_id, title, description, order_index, difficulty, thumbnail_url, modules_count, is_published',
      )
      .in('track_id', trackIds)
      .order('order_index', { ascending: true });
    if (!opts.includeUnpublished) coursesQuery = coursesQuery.eq('is_published', true);
    const { data: courses, error: coursesError } = await coursesQuery;

    if (coursesError) return [];

    const coursesByTrack: Record<string, EduCourse[]> = {};
    for (const c of courses ?? []) {
      if (!coursesByTrack[c.track_id]) coursesByTrack[c.track_id] = [];
      coursesByTrack[c.track_id].push(c as EduCourse);
    }

    // Bulk-fetch enrollments for the user across all courses (no N+1).
    const progressByCourse: Record<string, number> = {};
    if (userId) {
      const allCourseIds = (courses ?? []).map((c) => c.id);
      if (allCourseIds.length > 0) {
        const { data: enrollments } = await supabase
          .from('edu_enrollments')
          .select('course_id, progress_percent')
          .eq('user_id', userId)
          .in('course_id', allCourseIds);
        for (const e of enrollments ?? []) {
          progressByCourse[e.course_id] = e.progress_percent ?? 0;
        }
      }
    }

    return tracks.map((t) => {
      const trackCourses = coursesByTrack[t.id] ?? [];
      // Each track has 1 course today; use the first course's enrollment.
      const primary = trackCourses[0];
      const progress = primary ? (progressByCourse[primary.id] ?? 0) : 0;
      const totalModules = primary?.modules_count ?? 0;
      // N derived from progress_percent × modules_count (avoids extra query).
      const modulesDone = Math.min(Math.round((progress / 100) * totalModules), totalModules);
      return {
        ...t,
        courses: trackCourses,
        progress_percent: progress,
        modules_done: modulesDone,
      };
    }) as EduTrack[];
  } catch {
    return [];
  }
}

export interface ModuleDetailResult {
  module: EduModule | null;
  progress: EduUserProgress | null;
  nextModuleId: string | null;
  totalModules: number;
}

export async function fetchModuleDetail(
  moduleId: string,
  userId: string | null,
): Promise<ModuleDetailResult> {
  const empty: ModuleDetailResult = { module: null, progress: null, nextModuleId: null, totalModules: 0 };

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

    const [progressResult, nextResult, courseResult] = await Promise.all([
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
      supabase
        .from('edu_courses')
        .select('modules_count')
        .eq('id', module.course_id)
        .maybeSingle(),
    ]);

    return {
      module,
      progress: (progressResult.data ?? null) as EduUserProgress | null,
      nextModuleId: nextResult.data?.id ?? null,
      totalModules: courseResult.data?.modules_count ?? 0,
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

export interface HomeCourse extends EduCourse {
  track_thumbnail_url: string | null;
}

export async function fetchHomeCourses(): Promise<HomeCourse[]> {
  try {
    const { data: courses, error } = await supabase
      .from('edu_courses')
      .select(
        'id, track_id, title, description, order_index, difficulty, thumbnail_url, modules_count, is_published',
      )
      .eq('is_published', true)
      .order('order_index', { ascending: true })
      .limit(3);
    if (error || !courses?.length) return [];

    // Fetch track thumbnails separately to avoid relying on PostgREST FK introspection
    const trackIds = [...new Set(courses.map((c: any) => c.track_id).filter(Boolean))];
    let trackThumbMap: Record<string, string | null> = {};
    if (trackIds.length) {
      const { data: tracks } = await supabase
        .from('edu_tracks')
        .select('id, thumbnail_url')
        .in('id', trackIds);
      for (const t of tracks ?? []) {
        trackThumbMap[t.id] = (t as any).thumbnail_url ?? null;
      }
    }

    return courses.map((c: any) => ({
      ...c,
      track_thumbnail_url: trackThumbMap[c.track_id] ?? null,
    })) as HomeCourse[];
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
  opts: { includeUnpublished?: boolean } = {},
): Promise<CourseDetailResult> {
  const empty: CourseDetailResult = {
    course: null,
    modules: [],
    progressMap: {},
    enrollment: null,
    trackTitle: null,
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
      (() => {
        let q = supabase
          .from('edu_modules')
          .select(
            'id, course_id, title, summary, order_index, video_url, video_duration_seconds, key_terms, is_published',
          )
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });
        if (!opts.includeUnpublished) q = q.eq('is_published', true);
        return q;
      })(),
    ]);

    if (courseResult.error || !courseResult.data) return empty;

    const modules = (modulesResult.data ?? []) as EduModule[];
    let progressMap: Record<string, EduUserProgress> = {};
    let enrollment: EduEnrollment | null = null;

    if (userId && (modules as EduModule[]).length > 0) {
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

    let trackTitle: string | null = null;
    if (courseResult.data.track_id) {
      const { data: trackData } = await supabase
        .from('tracks')
        .select('title')
        .eq('id', courseResult.data.track_id)
        .maybeSingle();
      trackTitle = trackData?.title ?? null;
    }

    return {
      course: courseResult.data as EduCourse,
      modules,
      progressMap,
      enrollment,
      trackTitle,
    };
  } catch {
    return empty;
  }
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

type TrackFields = {
  title: string;
  tagline?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  order_index?: number;
  is_published?: boolean;
};

export async function createTrack(fields: TrackFields): Promise<{ id: string } | { error: string }> {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .insert({ ...fields, is_published: fields.is_published ?? false })
      .select('id')
      .single();
    if (error || !data) return { error: error?.message ?? 'Could not create track' };
    return { id: data.id };
  } catch (e: any) {
    return { error: e?.message ?? 'Could not create track' };
  }
}

export async function updateTrack(id: string, fields: Partial<TrackFields>): Promise<string | null> {
  try {
    const { error } = await supabase.from('tracks').update(fields).eq('id', id);
    if (error) return error.message;
    return null;
  } catch (e: any) {
    return e?.message ?? 'Could not update track';
  }
}

export async function deleteTrack(id: string): Promise<string | null> {
  try {
    const { error } = await supabase.from('tracks').delete().eq('id', id);
    if (error) return error.message;
    return null;
  } catch (e: any) {
    return e?.message ?? 'Could not delete track';
  }
}

type CourseFields = {
  title: string;
  description?: string | null;
  difficulty?: string | null;
  thumbnail_url?: string | null;
  order_index?: number;
  is_published?: boolean;
};

export async function createCourse(
  trackId: string,
  fields: CourseFields,
): Promise<{ id: string } | { error: string }> {
  try {
    const { data, error } = await supabase
      .from('edu_courses')
      .insert({ ...fields, track_id: trackId, is_published: fields.is_published ?? false, modules_count: 0 })
      .select('id')
      .single();
    if (error || !data) return { error: error?.message ?? 'Could not create course' };
    return { id: data.id };
  } catch (e: any) {
    return { error: e?.message ?? 'Could not create course' };
  }
}

export async function updateCourse(id: string, fields: Partial<CourseFields>): Promise<string | null> {
  try {
    const { error } = await supabase.from('edu_courses').update(fields).eq('id', id);
    if (error) return error.message;
    return null;
  } catch (e: any) {
    return e?.message ?? 'Could not update course';
  }
}

export async function deleteCourse(id: string): Promise<string | null> {
  try {
    const { error } = await supabase.from('edu_courses').delete().eq('id', id);
    if (error) return error.message;
    return null;
  } catch (e: any) {
    return e?.message ?? 'Could not delete course';
  }
}

type ModuleFields = {
  title: string;
  summary?: string | null;
  key_terms?: string[] | null;
  order_index?: number;
  is_published?: boolean;
};

export async function createModule(
  courseId: string,
  fields: ModuleFields,
): Promise<{ id: string } | { error: string }> {
  try {
    const { data, error } = await supabase
      .from('edu_modules')
      .insert({ ...fields, course_id: courseId, is_published: fields.is_published ?? false })
      .select('id')
      .single();
    if (error || !data) return { error: error?.message ?? 'Could not create module' };
    return { id: data.id };
  } catch (e: any) {
    return { error: e?.message ?? 'Could not create module' };
  }
}

export async function updateModule(id: string, fields: Partial<ModuleFields>): Promise<string | null> {
  try {
    const { error } = await supabase.from('edu_modules').update(fields).eq('id', id);
    if (error) return error.message;
    return null;
  } catch (e: any) {
    return e?.message ?? 'Could not update module';
  }
}

export async function deleteModule(id: string): Promise<string | null> {
  try {
    const { error } = await supabase.from('edu_modules').delete().eq('id', id);
    if (error) return error.message;
    return null;
  } catch (e: any) {
    return e?.message ?? 'Could not delete module';
  }
}

export async function addQuizQuestion(
  moduleId: string,
): Promise<{ id: string } | { error: string }> {
  try {
    const { data: existing } = await supabase
      .from('edu_quiz_questions')
      .select('order_index')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextIndex = (existing?.order_index ?? 0) + 1;
    const { data, error } = await supabase
      .from('edu_quiz_questions')
      .insert({
        module_id: moduleId,
        order_index: nextIndex,
        question: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'a',
        explanation: null,
      })
      .select('id')
      .single();
    if (error || !data) return { error: error?.message ?? 'Could not add question' };
    return { id: data.id };
  } catch (e: any) {
    return { error: e?.message ?? 'Could not add question' };
  }
}

export async function deleteQuizQuestion(id: string): Promise<string | null> {
  try {
    const { error } = await supabase.from('edu_quiz_questions').delete().eq('id', id);
    if (error) return error.message;
    return null;
  } catch (e: any) {
    return e?.message ?? 'Could not delete question';
  }
}

export async function swapModuleOrder(
  moduleAId: string,
  orderA: number,
  moduleBId: string,
  orderB: number,
): Promise<string | null> {
  try {
    const [r1, r2] = await Promise.all([
      supabase.from('edu_modules').update({ order_index: orderB }).eq('id', moduleAId),
      supabase.from('edu_modules').update({ order_index: orderA }).eq('id', moduleBId),
    ]);
    if (r1.error) return r1.error.message;
    if (r2.error) return r2.error.message;
    return null;
  } catch (e: any) {
    return e?.message ?? 'Could not reorder modules';
  }
}

export async function getNextTrackOrderIndex(): Promise<number> {
  try {
    const { data } = await supabase
      .from('tracks')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data?.order_index ?? 0) + 1;
  } catch {
    return 1;
  }
}

export async function getNextCourseOrderIndex(trackId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('edu_courses')
      .select('order_index')
      .eq('track_id', trackId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data?.order_index ?? 0) + 1;
  } catch {
    return 1;
  }
}

export async function getNextModuleOrderIndex(courseId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('edu_modules')
      .select('order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data?.order_index ?? 0) + 1;
  } catch {
    return 1;
  }
}
