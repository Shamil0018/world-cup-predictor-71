-- 1. Redefine prediction_error function with clean search path and outcome penalty
create or replace function public.prediction_error(ph int, pa int, ah int, aa int)
returns int language sql immutable set search_path = public as $$
  select abs(ph - ah) + abs(pa - aa) + abs((ph - pa) - (ah - aa)) + 
    case 
      when (ph > pa and ah > aa) or (ph < pa and ah < aa) or (ph = pa and ah = aa) then 0
      else 2
    end
$$;

-- 2. Drop and recreate public.leaderboard view using 20 - error logic
drop view if exists public.leaderboard;

create view public.leaderboard
with (security_invoker = true) as
select
  p.id as user_id,
  p.username,
  p.avatar_url,
  coalesce(sum(20 - public.prediction_error(pr.predicted_home, pr.predicted_away, m.home_score, m.away_score)), 0)::int as total_points,
  coalesce(sum(public.prediction_error(pr.predicted_home, pr.predicted_away, m.home_score, m.away_score)), 0)::int as total_error,
  count(pr.id) filter (where m.status = 'finished' and m.home_score is not null and m.away_score is not null)::int as matches_scored
from public.profiles p
left join public.predictions pr on pr.user_id = p.id
left join public.matches m on m.id = pr.match_id and m.status = 'finished' and m.home_score is not null and m.away_score is not null
group by p.id, p.username, p.avatar_url;

grant select on public.leaderboard to anon, authenticated;

-- 3. Create security definer function to check user predictions without RLS recursion loops
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

revoke execute on function public.has_user_predicted(uuid, uuid) from public, anon;

-- 4. Clean predictions table RLS policies
drop policy if exists "Predictions readable by all" on public.predictions;
drop policy if exists "Users insert own predictions before lock" on public.predictions;
drop policy if exists "Users update own predictions before lock" on public.predictions;
drop policy if exists "View predictions when allowed" on public.predictions;
drop policy if exists "Insert own prediction before kickoff" on public.predictions;
drop policy if exists "Update own prediction before kickoff" on public.predictions;

-- A. SELECT Policy: see own predictions always; others only after match kickoff, or if you predicted it yourself
create policy "View predictions when allowed" on public.predictions
for select
to authenticated, anon
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.matches m
    where m.id = predictions.match_id
      and m.kickoff_at <= now()
  )
  or public.has_user_predicted(auth.uid(), predictions.match_id)
);

-- B. INSERT Policy: insert your prediction only before kickoff on scheduled matches
create policy "Insert own prediction before kickoff" on public.predictions
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.matches m
    where m.id = predictions.match_id
      and m.kickoff_at > now()
      and m.status = 'scheduled'
  )
);

-- C. UPDATE Policy: update your prediction only before kickoff on scheduled matches
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
