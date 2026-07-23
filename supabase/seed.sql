-- Seed data for local development
-- Apply with: supabase db reset --local
-- Regenerate types after: supabase gen types typescript --local > packages/shared/src/database.types.ts
--
-- Auth users (for login) are created separately by scripts/setup-dev.sh
-- because the auth schema doesn't exist at seed time (it's created by the
-- auth container on startup). See README.md for details.
--
-- Accounts (after running scripts/setup-dev.sh, all passwords: password123):
--   admin@tcgmatch.app  (role: admin)
--   alice@example.com   (role: player)
--   bob@example.com     (role: player)
--   carol@example.com   (role: player)
--   dave@example.com    (role: player)

-- ── Public Users Profile ────────────────────────────────────────────
INSERT INTO public.users (id, email, username, role, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@tcgmatch.app', 'admin', 'admin', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'alice@example.com', 'alice', 'player', now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'bob@example.com', 'bob', 'player', now(), now()),
  ('00000000-0000-0000-0000-000000000004', 'carol@example.com', 'carol', 'player', now(), now()),
  ('00000000-0000-0000-0000-000000000005', 'dave@example.com', 'dave', 'player', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ── Consents (LGPD) ────────────────────────────────────────────────
INSERT INTO public.consents (user_id, policy_version)
SELECT id, '1.0' FROM public.users
WHERE NOT EXISTS (SELECT 1 FROM public.consents WHERE consents.user_id = users.id);

-- ── TCGs ───────────────────────────────────────────────────────────
INSERT INTO public.tcgs (id, name, slug, description)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'Magic: The Gathering', 'mtg', 'The original trading card game by Wizards of the Coast.'),
  ('00000000-0000-0000-0000-000000000011', 'Pokémon TCG', 'pokemon', 'Collect and battle with Pokémon.'),
  ('00000000-0000-0000-0000-000000000012', 'Yu-Gi-Oh!', 'yugioh', 'The classic card game based on the anime franchise.'),
  ('00000000-0000-0000-0000-000000000013', 'One Piece Card Game', 'one-piece', 'The official One Piece TCG by Bandai.')
ON CONFLICT (id) DO NOTHING;

-- ── Formats ────────────────────────────────────────────────────────
INSERT INTO public.formats (id, tcg_id, name, slug)
VALUES
  -- MTG
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'Commander', 'commander'),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 'Standard', 'standard'),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000010', 'Modern', 'modern'),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000010', 'Pauper', 'pauper'),
  -- Pokémon
  ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000011', 'Standard', 'pokemon-standard'),
  ('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000011', 'Expanded', 'expanded'),
  -- Yu-Gi-Oh!
  ('00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000012', 'Advanced', 'advanced'),
  ('00000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000012', 'Traditional', 'traditional'),
  -- One Piece
  ('00000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000013', 'Standard', 'op-standard')
ON CONFLICT (id) DO NOTHING;

-- ── Game Stores (Fortaleza) ────────────────────────────────────────
INSERT INTO public.game_stores (id, name, slug, description, address, lat, lng, created_by_user_id, is_verified)
VALUES
  ('00000000-0000-0000-0000-000000000030', 'Dragon''s Lair', 'dragons-lair', 'The largest TCG store in Fortaleza. Regular tournaments and pre-release events.',
   'Rua Barão do Rio Branco, 900 — Centro', -3.7278, -38.5274, '00000000-0000-0000-0000-000000000001', true),
  ('00000000-0000-0000-0000-000000000031', 'Mana Point', 'mana-point', 'Focused on Magic: The Gathering. Friendly Commander nights every Wednesday.',
   'Av. Bezerra de Menezes, 500 — São Gerardo', -3.7342, -38.5361, '00000000-0000-0000-0000-000000000001', true),
  ('00000000-0000-0000-0000-000000000032', 'PokéCenter CE', 'pokecenter-ce', 'Pokémon TCG league and casual play. Boosters and singles available.',
   'Rua Frederico Borges, 300 — Varjota', -3.7415, -38.4789, '00000000-0000-0000-0000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

-- ── Store Memberships ──────────────────────────────────────────────
INSERT INTO public.store_memberships (store_id, user_id, role)
VALUES
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 'owner')
ON CONFLICT (store_id, user_id) DO NOTHING;

-- ── Events ─────────────────────────────────────────────────────────
-- Generates 20 matches, 20 trading sessions, and 20 tournaments.
-- All events are scheduled in the future (upcoming) or in_progress.
-- Tournaments include bracket_type for bracket visualization.
-- Each event is associated with one of the 5 seed users (cycled).
DO $$
DECLARE
  user_ids UUID[] := ARRAY[
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005'
  ];
  store_ids UUID[] := ARRAY[
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000032'
  ];
  tcg_ids UUID[] := ARRAY[
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000013'
  ];
  bracket_types TEXT[] := ARRAY['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'pool_play'];
  match_names TEXT[] := ARRAY[
    'Casual Commander', 'Standard Showdown', 'Modern Night', 'Pauper Fight',
    'Limited Draft', 'Pioneer Practice', 'Legacy Open', 'Vintage Fun',
    'Standard BO3', 'Commander Pod', 'Modern Grind', 'Sealed League',
    'Frontier Test', 'Historic Brawl', 'Oathbreaker Duel', 'Pauper EDH',
    'Two-Headed Giant', 'Planechase', 'Arena BO1', 'Draft Sim'
  ];
  trading_names TEXT[] := ARRAY[
    'Card Binder Night', 'Trade & Binder', 'Buylist Session', 'Rare Exchange',
    'Bulk Trade Day', 'Collector Meet', 'Foil Swap', 'Foreign Cards Trade',
    'Sealed Trade', 'Singles Market', 'High-End Trade', 'Budget Trade',
    'Japanese Imports', 'Alter Art Trade', 'Playmat Swap', 'Deck Trade',
    'Promo Exchange', 'Misprint Trade', 'Signed Cards', 'Vintage Trade'
  ];
  tournament_names TEXT[] := ARRAY[
    'Friday Night Magic', 'Store Championship', 'Weekly Tournament', 'Monthly Cup',
    'Dragon''s Lair Open', 'Mana Point Masters', 'PokéCenter League', 'Commander Fest',
    'Standard Royale', 'Modern Clash', 'Pauper Gauntlet', 'Draft Tournament',
    'Legacy Challenge', 'Pioneer Showdown', 'Sealed Battle', 'Team Tournament',
    'Rookie Tournament', 'Pro Qualifier', 'Charity Tournament', 'Season Finale'
  ];
  descriptions TEXT[] := ARRAY[
    'Casual event for all skill levels. Beginners welcome!',
    'Competitive play with prize support. Top 3 get store credit.',
    'Bring your best deck and test your skills against the best.',
    'Friendly atmosphere. Focus on learning and improving.',
    'Proxy-friendly event. No meta deck required.',
    'Side events available. Food and drinks on site.',
    'Judge on site. Rules questions welcome.',
    'Streamed and commentated. Spectators welcome.',
    'Part of the weekly league circuit. Points accumulate.',
    'Special event with extended prize pool.'
  ];
  i INT;
  uid UUID;
  sid UUID;
  tid UUID;
  bid TEXT;
  days INT;
  eid TEXT;
  etype TEXT;
  ename TEXT;
  descr TEXT;
BEGIN
  i := 0;

  -- 20 Matches
  FOREACH ename IN ARRAY match_names LOOP
    uid := user_ids[1 + (i % array_length(user_ids, 1))];
    sid := store_ids[1 + (i % array_length(store_ids, 1))];
    tid := tcg_ids[1 + (i % array_length(tcg_ids, 1))];
    descr := descriptions[1 + (i % array_length(descriptions, 1))];
    days := 1 + (i % 14); -- spread across next 2 weeks
    eid := '00000000-0000-0000-0000-' || lpad((100 + i)::text, 12, '0');

    INSERT INTO public.events (id, type, created_by_user_id, organizer_user_id, name, description, lat, lng, scheduled_at, status, tcg_id, max_participants)
    VALUES (eid::uuid, 'match', uid, uid, ename, descr,
      (CASE WHEN sid = store_ids[1] THEN -3.7278 WHEN sid = store_ids[2] THEN -3.7342 ELSE -3.7415 END),
      (CASE WHEN sid = store_ids[1] THEN -38.5274 WHEN sid = store_ids[2] THEN -38.5361 ELSE -38.4789 END),
      now() + (days || ' days')::interval, 'open', tid, 2 + (i % 4))
    ON CONFLICT (id) DO NOTHING;
    i := i + 1;
  END LOOP;

  -- 20 Trading Sessions
  i := 0;
  FOREACH ename IN ARRAY trading_names LOOP
    uid := user_ids[1 + (i % array_length(user_ids, 1))];
    sid := store_ids[1 + (i % array_length(store_ids, 1))];
    tid := tcg_ids[1 + (i % array_length(tcg_ids, 1))];
    descr := descriptions[1 + ((i + 3) % array_length(descriptions, 1))];
    days := 1 + ((i + 7) % 14);
    eid := '00000000-0000-0000-0000-' || lpad((200 + i)::text, 12, '0');

    INSERT INTO public.events (id, type, created_by_user_id, organizer_user_id, name, description, lat, lng, scheduled_at, status, tcg_id, max_participants)
    VALUES (eid::uuid, 'trading', uid, uid, ename, descr,
      (CASE WHEN sid = store_ids[1] THEN -3.7278 WHEN sid = store_ids[2] THEN -3.7342 ELSE -3.7415 END),
      (CASE WHEN sid = store_ids[1] THEN -38.5274 WHEN sid = store_ids[2] THEN -38.5361 ELSE -38.4789 END),
      now() + (days || ' days')::interval,
      CASE WHEN i % 4 = 0 THEN 'planned' ELSE 'open' END,
      tid, 4 + (i % 8))
    ON CONFLICT (id) DO NOTHING;
    i := i + 1;
  END LOOP;

  -- 20 Tournaments
  i := 0;
  FOREACH ename IN ARRAY tournament_names LOOP
    uid := user_ids[1 + ((i + 2) % array_length(user_ids, 1))];
    sid := store_ids[1 + ((i + 1) % array_length(store_ids, 1))];
    tid := tcg_ids[1 + ((i + 2) % array_length(tcg_ids, 1))];
    bid := bracket_types[1 + (i % array_length(bracket_types, 1))];
    descr := descriptions[1 + ((i + 7) % array_length(descriptions, 1))];
    days := 1 + ((i + 14) % 21); -- spread across next 3 weeks
    eid := '00000000-0000-0000-0000-' || lpad((300 + i)::text, 12, '0');

    INSERT INTO public.events (id, type, created_by_user_id, organizer_user_id, name, description, lat, lng, scheduled_at, status, tcg_id, max_participants, bracket_type)
    VALUES (eid::uuid, 'tournament', uid, uid, ename, descr,
      (CASE WHEN sid = store_ids[1] THEN -3.7278 WHEN sid = store_ids[2] THEN -3.7342 ELSE -3.7415 END),
      (CASE WHEN sid = store_ids[1] THEN -38.5274 WHEN sid = store_ids[2] THEN -38.5361 ELSE -38.4789 END),
      now() + (days || ' days')::interval,
      CASE WHEN i < 2 THEN 'in_progress' WHEN i % 5 = 0 THEN 'draft' ELSE 'open' END,
      tid, 8 + (i % 16), bid)
    ON CONFLICT (id) DO NOTHING;
    i := i + 1;
  END LOOP;
END $$;

-- ── Event Participants ─────────────────────────────────────────────
-- Adds participants to matches, trading sessions, and tournaments.
INSERT INTO public.event_participants (event_id, user_id, role, status, confirmed_at)
VALUES
  -- Matches: participants for first 3 matches
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000002', 'participant', 'confirmed', now()),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000003', 'opponent', 'pending', NULL),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000003', 'participant', 'confirmed', now()),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000004', 'opponent', 'pending', NULL),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000005', 'participant', 'confirmed', now()),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'opponent', 'pending', NULL),
  -- Trading: participants for first 2 sessions
  ('00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000004', 'participant', 'confirmed', now()),
  ('00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000001', 'participant', 'pending', NULL),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000005', 'participant', 'confirmed', now()),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000002', 'participant', 'pending', NULL),
  -- Tournament participants (checked_in = bracket-ready):
  -- Torunament 300 (in_progress, single_elimination)
  ('00000000-0000-0000-0000-000000000300', '00000000-0000-0000-0000-000000000001', 'participant', 'checked_in', now()),
  ('00000000-0000-0000-0000-000000000300', '00000000-0000-0000-0000-000000000002', 'participant', 'checked_in', now()),
  ('00000000-0000-0000-0000-000000000300', '00000000-0000-0000-0000-000000000003', 'participant', 'checked_in', now()),
  ('00000000-0000-0000-0000-000000000300', '00000000-0000-0000-0000-000000000004', 'participant', 'checked_in', now()),
  -- Torunament 301 (in_progress, double_elimination)
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', 'participant', 'checked_in', now()),
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000003', 'participant', 'checked_in', now()),
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000005', 'participant', 'checked_in', now()),
  -- Torunaments 302-305 (open): add pending participants
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000002', 'participant', 'pending', NULL),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000004', 'participant', 'pending', NULL),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000001', 'participant', 'pending', NULL),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000005', 'participant', 'pending', NULL),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000003', 'participant', 'pending', NULL),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000004', 'participant', 'pending', NULL)
ON CONFLICT (event_id, user_id) DO NOTHING;

-- ── Bracket Data (for in_progress tournaments) ─────────────────────
-- Tournament 300 (single_elimination, 4 players)
-- Round 1: Semifinals (2 matches), Round 2: Finals (1 match)
INSERT INTO public.bracket_rounds (id, event_id, round_number, name)
VALUES
  ('00000000-0000-0000-0000-000000000400', '00000000-0000-0000-0000-000000000300', 2, 'Semifinals'),
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000300', 1, 'Finals')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.bracket_matches (id, round_id, player1_id, player2_id, status, next_match_id, next_match_player_slot)
VALUES
  ('00000000-0000-0000-0000-000000000500', '00000000-0000-0000-0000-000000000400', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'pending', '00000000-0000-0000-0000-000000000502', 1),
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000400', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'pending', '00000000-0000-0000-0000-000000000502', 2),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000401', NULL, NULL, 'pending', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Tournament 301 (double_elimination, 3 players — pool has odd count)
-- Bracket structure: Round 1 with 1 match + a BYE scenario
INSERT INTO public.bracket_rounds (id, event_id, round_number, name)
VALUES
  ('00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000301', 1, 'Round 1'),
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000301', 2, 'Finals')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.bracket_matches (id, round_id, player1_id, player2_id, status, next_match_id, next_match_player_slot)
VALUES
  ('00000000-0000-0000-0000-000000000510', '00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'pending', '00000000-0000-0000-0000-000000000511', 1),
  ('00000000-0000-0000-0000-000000000511', '00000000-0000-0000-0000-000000000411', NULL, '00000000-0000-0000-0000-000000000005', 'pending', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ── Notifications ──────────────────────────────────────────────────
INSERT INTO public.notifications (user_id, type, title, body)
VALUES
  ('00000000-0000-0000-0000-000000000003', 'match_join', 'New opponent', 'Carol joined your Standard practice match.'),
  ('00000000-0000-0000-0000-000000000005', 'match_join', 'Trading partner', 'Dave joined your Pokémon trade night.'),
  ('00000000-0000-0000-0000-000000000002', 'match_confirm', 'Confirmed', 'Bob confirmed your Commander match.')
ON CONFLICT DO NOTHING;

-- ── Reports (sample) ───────────────────────────────────────────────
INSERT INTO public.reports (id, reporter_id, target_type, target_id, reason, status)
VALUES
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000002', 'user', '00000000-0000-0000-0000-000000000003',
   'Unsportsmanlike behavior during a match.', 'pending')
ON CONFLICT (id) DO NOTHING;

-- ── Audit Log ──────────────────────────────────────────────────────
INSERT INTO public.audit_log (action, actor_id, target_type, target_id, details)
VALUES
  ('seed_loaded', '00000000-0000-0000-0000-000000000001', 'system', '00000000-0000-0000-0000-000000000001',
   '{"event": "seed_data_inserted", "version": "0.66.0"}')
ON CONFLICT DO NOTHING;
