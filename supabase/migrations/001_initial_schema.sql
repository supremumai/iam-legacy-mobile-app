-- =============================================
-- TABLE: profiles
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  username text UNIQUE,
  role text,
  bio text,
  location text,
  avatar_url text,
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE: posts
-- =============================================
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  image_url text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE: events
-- =============================================
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  location text,
  event_date timestamptz,
  is_online boolean DEFAULT false,
  attendees_count integer DEFAULT 0,
  image_url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE: courses
-- =============================================
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  instructor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  description text,
  lessons_count integer DEFAULT 0,
  difficulty text,
  rating numeric DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE: user_course_progress
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  progress_percent integer DEFAULT 0,
  completed boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_owner_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- posts policies
CREATE POLICY "posts_public_read" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_owner_insert" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_owner_update" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_owner_delete" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- events policies
CREATE POLICY "events_public_read" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_admin_write" ON public.events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "events_admin_update" ON public.events FOR UPDATE USING (auth.uid() = created_by);

-- courses policies
CREATE POLICY "courses_public_read" ON public.courses FOR SELECT USING (true);
CREATE POLICY "courses_admin_write" ON public.courses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "courses_admin_update" ON public.courses FOR UPDATE USING (auth.uid() = instructor_id);

-- user_course_progress policies
CREATE POLICY "progress_owner_read" ON public.user_course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_owner_insert" ON public.user_course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_owner_update" ON public.user_course_progress FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- AUTH TRIGGER — auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
