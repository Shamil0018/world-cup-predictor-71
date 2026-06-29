-- 1. Add winner columns to matches and predictions tables
alter table public.matches 
add column if not exists winner_id uuid references public.teams(id) on delete set null;

alter table public.predictions 
add column if not exists predicted_winner_id uuid references public.teams(id) on delete set null;

-- 2. Redefine prediction_error to handle knockout matches based on winner columns
create or replace function public.prediction_error(
  ph int, 
  pa int, 
  ah int, 
  aa int,
  stage text default 'group',
  predicted_winner_id uuid default null,
  actual_winner_id uuid default null
)
returns int 
language sql 
immutable 
set search_path = public as $$
  select 
    -- Score difference penalties
    abs(ph - ah) + abs(pa - aa) + abs((ph - pa) - (ah - aa)) + 
    -- Outcome penalty
    case 
      when stage != 'group' then
        case 
          when predicted_winner_id = actual_winner_id then 0
          else 2
        end
      else
        case 
          when (ph > pa and ah > aa) or (ph < pa and ah < aa) or (ph = pa and ah = aa) then 0
          else 2
        end
    end
$$;

-- 3. Drop and recreate public.leaderboard view with group stage best N-3 logic and direct knockout scoring
drop view if exists public.leaderboard;

create view public.leaderboard
with (security_invoker = true) as
with user_group_predictions as (
  select
    pr.user_id,
    (20 - public.prediction_error(pr.predicted_home, pr.predicted_away, m.home_score, m.away_score, m.stage, pr.predicted_winner_id, m.winner_id)) as points,
    public.prediction_error(pr.predicted_home, pr.predicted_away, m.home_score, m.away_score, m.stage, pr.predicted_winner_id, m.winner_id) as error,
    row_number() over (
      partition by pr.user_id 
      order by (20 - public.prediction_error(pr.predicted_home, pr.predicted_away, m.home_score, m.away_score, m.stage, pr.predicted_winner_id, m.winner_id)) desc, pr.id asc
    ) as rnk,
    count(*) over (partition by pr.user_id) as total_group_finished
  from public.predictions pr
  join public.matches m on m.id = pr.match_id
  where m.status = 'finished' 
    and m.home_score is not null 
    and m.away_score is not null
    and m.stage = 'group'
),
user_knockout_predictions as (
  select
    pr.user_id,
    sum(20 - public.prediction_error(pr.predicted_home, pr.predicted_away, m.home_score, m.away_score, m.stage, pr.predicted_winner_id, m.winner_id))::int as points,
    sum(public.prediction_error(pr.predicted_home, pr.predicted_away, m.home_score, m.away_score, m.stage, pr.predicted_winner_id, m.winner_id))::int as error,
    count(pr.id)::int as matches_scored
  from public.predictions pr
  join public.matches m on m.id = pr.match_id
  where m.status = 'finished' 
    and m.home_score is not null 
    and m.away_score is not null
    and m.stage != 'group'
  group by pr.user_id
),
user_group_points as (
  select
    user_id,
    coalesce(sum(points), 0)::int as total_points,
    coalesce(sum(error), 0)::int as total_error,
    max(total_group_finished)::int as matches_scored
  from user_group_predictions
  where rnk <= greatest(15, total_group_finished - 3)
  group by user_id
)
select
  p.id as user_id,
  p.username,
  p.avatar_url,
  (coalesce(ug.total_points, 0) + coalesce(uk.points, 0))::int as total_points,
  (coalesce(ug.total_error, 0) + coalesce(uk.error, 0))::int as total_error,
  (coalesce(ug.matches_scored, 0) + coalesce(uk.matches_scored, 0))::int as matches_scored
from public.profiles p
left join user_group_points ug on ug.user_id = p.id
left join user_knockout_predictions uk on uk.user_id = p.id;

grant select on public.leaderboard to anon, authenticated;
