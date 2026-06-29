-- Seed Round of 32 matches for FIFA World Cup 2026
-- Run this in the Supabase SQL Editor
-- Results are pre-filled for matches already played as of June 29, 2026

insert into matches (round, match_number, team1, team2, winner, match_date) values
  -- June 28 (played)
  ('r32',  1, 'Canada',       'South Africa',          'Canada',       '2026-06-28'),
  -- June 29 (played today)
  ('r32',  2, 'Germany',      'Paraguay',              'Germany',      '2026-06-29'),
  ('r32',  3, 'Netherlands',  'Morocco',               'Netherlands',  '2026-06-29'),
  ('r32',  4, 'Brazil',       'Japan',                 'Brazil',       '2026-06-29'),
  -- June 30
  ('r32',  5, 'France',       'Sweden',                null,           '2026-06-30'),
  ('r32',  6, 'Ivory Coast',  'Norway',                null,           '2026-06-30'),
  ('r32',  7, 'Mexico',       'Ecuador',               null,           '2026-06-30'),
  -- July 1
  ('r32',  8, 'England',      'DR Congo',              null,           '2026-07-01'),
  ('r32',  9, 'United States','Bosnia and Herzegovina',null,           '2026-07-01'),
  ('r32', 10, 'Belgium',      'Senegal',               null,           '2026-07-01'),
  -- July 2
  ('r32', 11, 'Portugal',     'Croatia',               null,           '2026-07-02'),
  ('r32', 12, 'Spain',        'Austria',               null,           '2026-07-02'),
  ('r32', 13, 'Switzerland',  'Algeria',               null,           '2026-07-02'),
  -- July 3
  ('r32', 14, 'Argentina',    'Cape Verde',            null,           '2026-07-03'),
  ('r32', 15, 'Colombia',     'Ghana',                 null,           '2026-07-03'),
  ('r32', 16, 'Australia',    'Egypt',                 null,           '2026-07-03');

-- Mark existing predictions correct/incorrect for played matches
update predictions p
set is_correct = (p.predicted_winner = m.winner)
from matches m
where p.match_id = m.id and m.winner is not null;
