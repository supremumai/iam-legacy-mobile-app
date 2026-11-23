-- 003_fix_admin_content_removal.sql
--
-- Root cause of "Eliminar contenido" failing on reported posts (HTTP 400,
-- Postgres P0001 "Admins may only change admin status on other users'
-- profiles, not other fields"):
--
--   DELETE posts (admin; allowed by posts_admin_delete)
--     -> AFTER DELETE trigger award_points_post()  [SECURITY DEFINER]
--        UPDATE profiles SET points = points - 5 WHERE id = <post author>
--          -> BEFORE UPDATE trigger restrict_cross_profile_updates()
--             auth.uid() (the admin) <> the author's id, and `points`
--             changed -> RAISE -> the whole DELETE rolls back.
--
-- SECURITY DEFINER does not help because auth.uid() still reads the caller's
-- JWT. The delete only succeeded when the author had 0 points, since the
-- update then changed nothing. The same guard also fires for the other
-- award_points_* triggers whenever the person acting is not the profile
-- owner: an admin deleting a comment, someone liking or commenting on another
-- member's post, or a post owner deleting a post that others commented on.
--
-- Fix: an UPDATE issued from inside another trigger (pg_trigger_depth() > 1)
-- is system bookkeeping, not a client editing someone else's profile, so it
-- may change `points`. Everything else stays enforced: a direct client UPDATE
-- (depth 1) still cannot change another user's points or any other field,
-- and a nested update still cannot touch any other column.
--
-- Idempotent (CREATE OR REPLACE). Review, then run in the SQL editor.

create or replace function public.restrict_cross_profile_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_j jsonb;
  new_j jsonb;
begin
  if auth.uid() is distinct from old.id then
    old_j := to_jsonb(old) - 'is_admin' - 'updated_at';
    new_j := to_jsonb(new) - 'is_admin' - 'updated_at';

    -- Points are maintained by the award_points_* triggers, which update the
    -- profile from inside a trigger (depth > 1).
    if pg_trigger_depth() > 1 then
      old_j := old_j - 'points';
      new_j := new_j - 'points';
    end if;

    if old_j is distinct from new_j then
      raise exception 'Admins may only change admin status on other users'' profiles, not other fields';
    end if;
  end if;

  return new;
end;
$$;
