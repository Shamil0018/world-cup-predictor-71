-- Create security definer function to return aggregated prediction statistics for a given match, bypassing RLS securely
create or replace function public.get_match_prediction_stats(_match_id uuid)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  _total int;
  _home_wins int;
  _draws int;
  _away_wins int;
begin
  select count(*),
         count(*) filter (where predicted_home > predicted_away),
         count(*) filter (where predicted_home = predicted_away),
         count(*) filter (where predicted_home < predicted_away)
  into _total, _home_wins, _draws, _away_wins
  from public.predictions
  where match_id = _match_id;

  return json_build_object(
    'total', coalesce(_total, 0),
    'home_wins', coalesce(_home_wins, 0),
    'draws', coalesce(_draws, 0),
    'away_wins', coalesce(_away_wins, 0)
  );
end;
$$;

grant execute on function public.get_match_prediction_stats(uuid) to anon, authenticated;
