
-- Fix 1: Add outcome penalty to prediction_error
CREATE OR REPLACE FUNCTION public.prediction_error(ph integer, pa integer, ah integer, aa integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT abs(ph - ah) + abs(pa - aa) + abs((ph - pa) - (ah - aa))
    + CASE
        WHEN (ah > aa AND ph > pa) OR (ah < aa AND ph < pa) OR (ah = aa AND ph = pa) THEN 0
        ELSE 2
      END
$$;

-- Fix 2: leaderboard view as points = 20 - error per finished predicted match
DROP VIEW IF EXISTS public.leaderboard;
CREATE VIEW public.leaderboard
WITH (security_invoker = true)
AS
SELECT
  p.id AS user_id,
  p.username,
  p.avatar_url,
  COALESCE(SUM(
    GREATEST(0, 20 - prediction_error(pr.predicted_home, pr.predicted_away, m.home_score, m.away_score))
  ) FILTER (WHERE m.status = 'finished' AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL), 0)::integer AS total_points,
  COUNT(pr.id)::integer AS games_predicted,
  COUNT(pr.id) FILTER (WHERE m.status = 'finished' AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL)::integer AS matches_scored
FROM public.profiles p
LEFT JOIN public.predictions pr ON pr.user_id = p.id
LEFT JOIN public.matches m ON m.id = pr.match_id
GROUP BY p.id, p.username, p.avatar_url;

GRANT SELECT ON public.leaderboard TO anon, authenticated;

-- Fix 4 + Fix 6: prediction policies — lock at kickoff, no updates, visibility gated
DROP POLICY IF EXISTS "Predictions readable by all" ON public.predictions;
DROP POLICY IF EXISTS "Users insert own predictions before lock" ON public.predictions;
DROP POLICY IF EXISTS "Users update own predictions before lock" ON public.predictions;

-- See your own predictions always; see others only after match has started OR you already submitted for that match
CREATE POLICY "View predictions when allowed" ON public.predictions
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = predictions.match_id
      AND m.kickoff_at <= now()
  )
  OR EXISTS (
    SELECT 1 FROM public.predictions mine
    WHERE mine.match_id = predictions.match_id
      AND mine.user_id = auth.uid()
  )
);

-- Insert your prediction only before kickoff, and only once per match
CREATE POLICY "Insert own prediction before kickoff" ON public.predictions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = predictions.match_id
      AND m.kickoff_at > now()
      AND m.status = 'scheduled'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.predictions existing
    WHERE existing.user_id = auth.uid()
      AND existing.match_id = predictions.match_id
  )
);

-- No update policy = predictions cannot be edited (save once)
