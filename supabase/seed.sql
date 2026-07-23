-- Seed data for local development
-- Apply with: supabase db reset --local
-- Regenerate types after: supabase gen types typescript --local > packages/shared/src/database.types.ts
--
-- All passwords: password123
-- Accounts:
--   admin@tcgmatch.app  (role: admin)
--   alice@example.com   (role: player)
--   bob@example.com     (role: player)
--   carol@example.com   (role: player)
--   dave@example.com    (role: player)

-- ── Auth Users (Supabase Auth) ──────────────────────────────────────
-- Creates password-authenticated users so they can sign in directly.
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, confirmation_sent_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@tcgmatch.app', crypt('password123', gen_salt('bf')), now(), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000002', 'alice@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000003', 'bob@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000004', 'carol@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000005', 'dave@example.com', crypt('password123', gen_salt('bf')), now(), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- ── Auth Identities ─────────────────────────────────────────────────
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@tcgmatch.app"}', 'email', 'admin@tcgmatch.app', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '{"sub":"00000000-0000-0000-0000-000000000002","email":"alice@example.com"}', 'email', 'alice@example.com', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '{"sub":"00000000-0000-0000-0000-000000000003","email":"bob@example.com"}', 'email', 'bob@example.com', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '{"sub":"00000000-0000-0000-0000-000000000004","email":"carol@example.com"}', 'email', 'carol@example.com', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', '{"sub":"00000000-0000-0000-0000-000000000005","email":"dave@example.com"}', 'email', 'dave@example.com', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

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

-- ── Events (Matches & Trading Sessions) ────────────────────────────
INSERT INTO public.events (id, type, created_by_user_id, organizer_user_id, name, description, lat, lng, scheduled_at, status, tcg_id, max_participants)
VALUES
  -- Open match: Commander
  ('00000000-0000-0000-0000-000000000040', 'match', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
   'Commander at Dragon''s Lair', 'Looking for a pod of 4 for casual Commander.',
   -3.7278, -38.5274, now() + interval '2 days', 'open', '00000000-0000-0000-0000-000000000010', 4),

  -- Open match: Standard MTG
  ('00000000-0000-0000-0000-000000000041', 'match', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
   'Standard practice', 'Need practice for the next FNM. BO3.',
   -3.7342, -38.5361, now() + interval '1 day', 'open', '00000000-0000-0000-0000-000000000010', 2),

  -- Open trading session
  ('00000000-0000-0000-0000-000000000042', 'trading', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004',
   'Card trading meetup', 'Bring binders. Looking for modern staples and selling some EDH cards.',
   -3.7278, -38.5274, now() + interval '5 days', 'open', '00000000-0000-0000-0000-000000000010', 8),

  -- Planned trading session
  ('00000000-0000-0000-0000-000000000043', 'trading', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005',
   'Pokémon trade night', 'Looking for Scarlet & Violet era cards. Selling sealed product.',
   -3.7415, -38.4789, now() + interval '7 days', 'planned', '00000000-0000-0000-0000-000000000011', 6),

  -- Past completed match
  ('00000000-0000-0000-0000-000000000044', 'match', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
   'Casual Modern', 'Had a great Modern session last week.',
   -3.7278, -38.5274, now() - interval '7 days', 'completed', '00000000-0000-0000-0000-000000000010', 2)
ON CONFLICT (id) DO NOTHING;

-- ── Event Participants ─────────────────────────────────────────────
INSERT INTO public.event_participants (event_id, user_id, role, status, confirmed_at)
VALUES
  -- Alice + Bob in the Commander match
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000002', 'participant', 'confirmed', now()),
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000003', 'participant', 'pending', NULL),

  -- Bob (creator) + Carol as pending opponent in Standard practice
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000003', 'participant', 'confirmed', now()),
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000004', 'opponent', 'pending', NULL),

  -- Carol (creator) + Dave + Alice in trading session
  ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000004', 'participant', 'confirmed', now()),
  ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000005', 'participant', 'pending', NULL),

  -- Past match participants (completed)
  ('00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000002', 'participant', 'confirmed', now() - interval '7 days'),
  ('00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000003', 'opponent', 'confirmed', now() - interval '7 days')
ON CONFLICT (event_id, user_id) DO NOTHING;

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
