-- Add indexes to optimize leaderboard view performance
CREATE INDEX IF NOT EXISTS predictions_user_id_idx ON public.predictions(user_id);
CREATE INDEX IF NOT EXISTS predictions_match_id_idx ON public.predictions(match_id);
CREATE INDEX IF NOT EXISTS matches_status_idx ON public.matches(status);
