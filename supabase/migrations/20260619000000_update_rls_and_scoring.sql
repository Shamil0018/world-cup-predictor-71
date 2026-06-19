-- Drop dependent view first
DROP VIEW IF EXISTS public.leaderboard;

-- Recreate prediction error function with outcome penalty
CREATE OR REPLACE FUNCTION public.prediction_error(ph INT, pa INT, ah INT, aa INT)
RETURNS INT LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT abs(ph - ah) + abs(pa - aa) + abs((ph - pa) - (ah - aa)) + 
    CASE 
      WHEN (ah > aa AND ph > pa) OR (ah < aa AND ph < pa) OR (ah = aa AND ph = pa) THEN 0
      ELSE 2
    END
$$;

-- Recreate leaderboard view with new point system and games predicted count
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.id AS user_id,
  p.username,
  p.avatar_url,
  COALESCE(SUM(20 - public.prediction_error(pr.predicted_home, pr.predicted_away, m.home_score, m.away_score)), 0)::INT AS total_points,
  COUNT(pr.id)::INT AS games_predicted,
  COUNT(pr.id) FILTER (WHERE m.status = 'finished')::INT AS matches_scored
FROM public.profiles p
LEFT JOIN public.predictions pr ON pr.user_id = p.id
LEFT JOIN public.matches m ON m.id = pr.match_id AND m.status = 'finished' AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL
GROUP BY p.id, p.username, p.avatar_url;

GRANT SELECT ON public.leaderboard TO anon, authenticated;

-- Drop and recreate prediction lock policies (lock at kickoff instead of 30 minutes before)
DROP POLICY IF EXISTS "Users insert own predictions before lock" ON public.predictions;
DROP POLICY IF EXISTS "Users update own predictions before lock" ON public.predictions;

CREATE POLICY "Users insert own predictions before lock" ON public.predictions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.kickoff_at > now() AND m.status = 'scheduled')
  );

CREATE POLICY "Users update own predictions before lock" ON public.predictions FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.kickoff_at > now() AND m.status = 'scheduled')
  );
