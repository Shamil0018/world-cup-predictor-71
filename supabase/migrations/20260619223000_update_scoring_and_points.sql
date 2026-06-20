-- Redefine prediction_error function to include outcome penalty (+2 if outcome is incorrect)
create or replace function public.prediction_error(ph int, pa int, ah int, aa int)
returns int language sql immutable as $$
  select abs(ph - ah) + abs(pa - aa) + abs((ph - pa) - (ah - aa)) + 
    case 
      when (ph > pa and ah > aa) or (ph < pa and ah < aa) or (ph = pa and ah = aa) then 0
      else 2
    end
$$;

-- Recreate leaderboard view to compute total_points
create or replace view public.leaderboard as
select
  p.id as user_id,
  p.username,
  p.avatar_url,
  coalesce(sum(public.prediction_error(pr.predicted_home, pr.predicted_away, m.home_score, m.away_score)), 0)::int as total_error,
  coalesce(sum(20 - public.prediction_error(pr.predicted_home, pr.predicted_away, m.home_score, m.away_score)), 0)::int as total_points,
  count(pr.id) filter (where m.status = 'finished')::int as matches_scored
from public.profiles p
left join public.predictions pr on pr.user_id = p.id
left join public.matches m on m.id = pr.match_id and m.status = 'finished' and m.home_score is not null and m.away_score is not null
group by p.id, p.username, p.avatar_url;

-- Apply permissions and settings on the recreated view
alter view public.leaderboard set (security_invoker = true);
grant select on public.leaderboard to anon, authenticated;
