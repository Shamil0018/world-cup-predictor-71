-- Clear existing matches and predictions
TRUNCATE public.predictions CASCADE;
TRUNCATE public.matches CASCADE;

-- Insert/update required teams
INSERT INTO public.teams (code, name, flag_emoji, group_letter) VALUES
  ('ALG', 'Algeria', '🇩🇿', 'Group A'),
  ('ARG', 'Argentina', '🇦🇷', 'Group B'),
  ('AUS', 'Australia', '🇦🇺', 'Group C'),
  ('AUT', 'Austria', '🇦🇹', 'Group D'),
  ('BEL', 'Belgium', '🇧🇪', 'Group E'),
  ('BIH', 'Bosnia and Herzegovina', '🇧🇦', 'Group F'),
  ('BRA', 'Brazil', '🇧🇷', 'Group A'),
  ('CAN', 'Canada', '🇨🇦', 'Group B'),
  ('CPV', 'Cape Verde', '🇨🇻', 'Group C'),
  ('COL', 'Colombia', '🇨🇴', 'Group D'),
  ('CRO', 'Croatia', '🇭🇷', 'Group E'),
  ('CUW', 'Curacao', '🇨🇼', 'Group F'),
  ('CZE', 'Czechia', '🇨🇿', 'Group A'),
  ('COD', 'DR Congo', '🇨🇩', 'Group B'),
  ('ECU', 'Ecuador', '🇪🇨', 'Group C'),
  ('EGY', 'Egypt', '🇪🇬', 'Group D'),
  ('ENG', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Group E'),
  ('FRA', 'France', '🇫🇷', 'Group F'),
  ('GER', 'Germany', '🇩🇪', 'Group A'),
  ('GHA', 'Ghana', '🇬🇭', 'Group B'),
  ('HAI', 'Haiti', '🇭🇹', 'Group C'),
  ('IRN', 'Iran', '🇮🇷', 'Group D'),
  ('IRQ', 'Iraq', '🇮🇶', 'Group E'),
  ('CIV', 'Ivory Coast', '🇨🇮', 'Group F'),
  ('JPN', 'Japan', '🇯🇵', 'Group A'),
  ('JOR', 'Jordan', '🇯🇴', 'Group B'),
  ('MEX', 'Mexico', '🇲🇽', 'Group C'),
  ('MAR', 'Morocco', '🇲🇦', 'Group D'),
  ('NED', 'Netherlands', '🇳🇱', 'Group E'),
  ('NZL', 'New Zealand', '🇳🇿', 'Group F'),
  ('NOR', 'Norway', '🇳🇴', 'Group A'),
  ('PAN', 'Panama', '🇵🇦', 'Group B'),
  ('PAR', 'Paraguay', '🇵🇾', 'Group C'),
  ('POR', 'Portugal', '🇵🇹', 'Group D'),
  ('QAT', 'Qatar', '🇶🇦', 'Group E'),
  ('KSA', 'Saudi Arabia', '🇸🇦', 'Group F'),
  ('SCO', 'Scotland', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Group A'),
  ('SEN', 'Senegal', '🇸🇳', 'Group B'),
  ('RSA', 'South Africa', '🇿🇦', 'Group C'),
  ('KOR', 'South Korea', '🇰🇷', 'Group D'),
  ('ESP', 'Spain', '🇪🇸', 'Group E'),
  ('SWE', 'Sweden', '🇸🇪', 'Group F'),
  ('SUI', 'Switzerland', '🇨🇭', 'Group A'),
  ('TUN', 'Tunisia', '🇹🇳', 'Group B'),
  ('TUR', 'Turkey', '🇹🇷', 'Group C'),
  ('USA', 'United States', '🇺🇸', 'Group D'),
  ('URU', 'Uruguay', '🇺🇾', 'Group E'),
  ('UZB', 'Uzbekistan', '🇺🇿', 'Group F')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  flag_emoji = EXCLUDED.flag_emoji,
  group_letter = EXCLUDED.group_letter;


-- Insert previous games (3 requested + the only retained game from current bracket: Mexico vs United States)
INSERT INTO public.matches (home_team_id, away_team_id, kickoff_at, stage, status, home_score, away_score) VALUES
  ((SELECT id FROM public.teams WHERE code = 'CZE'), (SELECT id FROM public.teams WHERE code = 'RSA'), '2026-06-18 12:00:00+00', 'Group A', 'finished', 1, 1),
  ((SELECT id FROM public.teams WHERE code = 'UZB'), (SELECT id FROM public.teams WHERE code = 'COL'), '2026-06-18 15:00:00+00', 'Group B', 'finished', 1, 3),
  ((SELECT id FROM public.teams WHERE code = 'GHA'), (SELECT id FROM public.teams WHERE code = 'PAN'), '2026-06-18 18:00:00+00', 'Group C', 'finished', 1, 0),
  ((SELECT id FROM public.teams WHERE code = 'MEX'), (SELECT id FROM public.teams WHERE code = 'USA'), '2026-06-18 20:00:00+00', 'Group A', 'finished', 2, 1);

