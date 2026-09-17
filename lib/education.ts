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
