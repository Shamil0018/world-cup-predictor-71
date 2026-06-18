-- Clear existing matches and predictions
TRUNCATE public.predictions CASCADE;
TRUNCATE public.matches CASCADE;

-- Insert/update required teams
INSERT INTO public.teams (code, name, flag_emoji, group_letter) VALUES
  ('CZE', 'Czech Republic', '🇨🇿', 'Group A'),
  ('RSA', 'South Africa', '🇿🇦', 'Group A'),
  ('UZB', 'Uzbekistan', '🇺🇿', 'Group B'),
  ('COL', 'Colombia', '🇨🇴', 'Group B'),
  ('GHA', 'Ghana', '🇬🇭', 'Group C'),
  ('PAN', 'Panama', '🇵🇦', 'Group C'),
  ('CAN', 'Canada', '🇨🇦', 'Group B'),
  ('QAT', 'Qatar', '🇶🇦', 'Group B'),
  ('MEX', 'Mexico', '🇲🇽', 'Group A'),
  ('KOR', 'South Korea', '🇰🇷', 'Group A'),
  ('USA', 'United States', '🇺🇸', 'Group D'),
  ('AUS', 'Australia', '🇦🇺', 'Group D'),
  ('SCO', 'Scotland', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Group C'),
  ('MAR', 'Morocco', '🇲🇦', 'Group C'),
  ('BRA', 'Brazil', '🇧🇷', 'Group C'),
  ('HAI', 'Haiti', '🇭🇹', 'Group C'),
  ('TUR', 'Türkiye', '🇹🇷', 'Group D'),
  ('PAR', 'Paraguay', '🇵🇾', 'Group D'),
  ('NED', 'Netherlands', '🇳🇱', 'Group F'),
  ('SWE', 'Sweden', '🇸🇪', 'Group F'),
  ('GER', 'Germany', '🇩🇪', 'Group E'),
  ('CIV', 'Ivory Coast', '🇨🇮', 'Group E'),
  ('ECU', 'Ecuador', '🇪🇨', 'Group E'),
  ('CUW', 'Curaçao', '🇨🇼', 'Group E'),
  ('TUN', 'Tunisia', '🇹🇳', 'Group F'),
  ('JPN', 'Japan', '🇯🇵', 'Group F')
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

