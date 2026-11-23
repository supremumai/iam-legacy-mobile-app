-- 002_content_moderation.sql
--
-- Supporting changes for in-app reporting (Apple guideline 1.2).
-- The tables content_reports and user_blocks, their RLS policies and the
-- notifications.type = 'report' value already exist in the live database;
-- this file only fills three gaps found while wiring up the app:
--
--   1. notifications has no INSERT policy, so the client cannot notify admins.
--      A SECURITY DEFINER trigger on content_reports does it server-side.
--   2. notifications.post_id is NOT NULL, but a report about a user profile has
--      no post. The column becomes nullable.
--   3. posts has no admin DELETE policy (post_comments does), so an admin
--      cannot remove a reported post from the reports screen.
--
-- Idempotent: safe to run more than once. Review, then run in the SQL editor.

-- 2. User-profile reports have no post to point at.
alter table public.notifications
  alter column post_id drop not null;

-- 1. Notify every admin when a report is filed.
create or replace function public.notify_admins_on_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_id uuid;
  v_comment_id uuid;
begin
  if new.reporter_id is null then
    return new;
  end if;

  if new.target_type = 'post' then
    select id into v_post_id from public.posts where id = new.target_id;
  elsif new.target_type = 'comment' then
    select id, post_id into v_comment_id, v_post_id
    from public.post_comments where id = new.target_id;
  end if;

  insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id)
  select p.id, new.reporter_id, 'report', v_post_id, v_comment_id
  from public.profiles p
  where p.is_admin = true
    and p.id <> new.reporter_id;

  return new;
end;
$$;

drop trigger if exists content_reports_notify_admins on public.content_reports;
create trigger content_reports_notify_admins
  after insert on public.content_reports
  for each row execute function public.notify_admins_on_report();

-- 3. Admins can delete any post (owners keep their existing delete policy).
drop policy if exists posts_admin_delete on public.posts;
create policy posts_admin_delete on public.posts
  for delete
  using (public.is_admin());
