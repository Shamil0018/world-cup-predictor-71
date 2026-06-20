-- Create security definer function to bypass RLS recursion
create or replace function public.has_user_predicted(_user_id uuid, _match_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.predictions
    where user_id = _user_id and match_id = _match_id
  )
$$;

-- authenticated role retains execute permission since RLS calls it
revoke execute on function public.has_user_predicted(uuid, uuid) from public, anon;

-- Recreate policy using the helper function
drop policy if exists "View predictions when allowed" on public.predictions;

create policy "View predictions when allowed" on public.predictions
for select
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.matches m
    where m.id = predictions.match_id
      and m.kickoff_at <= now()
  )
  or public.has_user_predicted(auth.uid(), predictions.match_id)
);

-- Recreate the update policy to allow users to change predictions before kickoff
drop policy if exists "Update own prediction before kickoff" on public.predictions;
drop policy if exists "Users update own predictions before lock" on public.predictions;

create policy "Update own prediction before kickoff" on public.predictions
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.matches m
    where m.id = predictions.match_id
      and m.kickoff_at > now()
      and m.status = 'scheduled'
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.matches m
    where m.id = predictions.match_id
      and m.kickoff_at > now()
      and m.status = 'scheduled'
  )
);
