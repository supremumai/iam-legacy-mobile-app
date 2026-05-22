# Database Migrations — Manual Execution Required

## ⚠️ ACTION REQUIRED

No Supabase access token or service_role key was found during Batch 13 setup.
The migration SQL has been saved locally but **must be executed manually** in the Supabase dashboard.

## Steps

1. Go to: https://supabase.com/dashboard/project/tqkjnmczkajjlhwlwukp/editor
2. Open the file: `supabase/migrations/001_initial_schema.sql`
3. Copy the entire SQL content
4. Paste it into the SQL Editor and click **Run**

## What the migration creates

### Tables
- `public.profiles` — User profiles linked to auth.users
- `public.posts` — User posts (feed)
- `public.events` — Events (online/offline)
- `public.courses` — Learning courses
- `public.user_course_progress` — Per-user course progress tracking

### Security
- Row Level Security (RLS) enabled on all 5 tables
- 14 RLS policies covering read/write/delete per ownership

### Auth Trigger
- `handle_new_user()` function — auto-creates a profile row on every new signup
- Trigger: `on_auth_user_created` on `auth.users`

## Also Required: Add Anon Key to .env

After running the migration, get your **anon key** from:
https://supabase.com/dashboard/project/tqkjnmczkajjlhwlwukp/settings/api

Update `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://tqkjnmczkajjlhwlwukp.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-here>
```

> ⚠️ `.env` is gitignored and must NOT be committed. Keep the key secret.
