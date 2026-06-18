
ALTER VIEW public.leaderboard SET (security_invoker = true);

ALTER FUNCTION public.prediction_error(int,int,int,int) SET search_path = public;
ALTER FUNCTION public.touch_updated_at() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- authenticated retains execute since RLS policies call it
