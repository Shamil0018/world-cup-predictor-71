-- Create settings table to store dynamic app configuration
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings are viewable by everyone" ON public.settings FOR SELECT USING (true);

CREATE POLICY "Only admins can modify settings" ON public.settings 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default toggle value for the Mbappe Dictator pop-up
INSERT INTO public.settings (key, value) 
VALUES ('mbappe_popup_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
