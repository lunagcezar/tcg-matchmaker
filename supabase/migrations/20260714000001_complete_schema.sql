-- TCGs
CREATE TABLE IF NOT EXISTS public.tcgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.tcgs ENABLE ROW LEVEL SECURITY;

-- Formats
CREATE TABLE IF NOT EXISTS public.formats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tcg_id UUID NOT NULL REFERENCES public.tcgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tcg_id, slug)
);

ALTER TABLE public.formats ENABLE ROW LEVEL SECURITY;

-- Game Stores
CREATE TABLE IF NOT EXISTS public.game_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  country TEXT NOT NULL DEFAULT 'Brasil',
  state TEXT NOT NULL DEFAULT 'Ceará',
  city TEXT NOT NULL DEFAULT 'Fortaleza',
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  phone TEXT,
  website TEXT,
  logo_path TEXT,
  created_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.game_stores ENABLE ROW LEVEL SECURITY;

-- Store Memberships
CREATE TABLE IF NOT EXISTS public.store_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.game_stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_store_memberships_one_owner
  ON public.store_memberships (store_id) WHERE role = 'owner';

ALTER TABLE public.store_memberships ENABLE ROW LEVEL SECURITY;

-- Events (unified: matches, tournaments, trading sessions)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('match', 'tournament', 'trading')),
  created_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organizer_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  organizer_store_id UUID REFERENCES public.game_stores(id) ON DELETE SET NULL,
  country TEXT NOT NULL DEFAULT 'Brasil',
  state TEXT NOT NULL DEFAULT 'Ceará',
  city TEXT NOT NULL DEFAULT 'Fortaleza',
  custom_location_name TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  name TEXT,
  description TEXT,
  details TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'challenged', 'confirmed', 'in_progress', 'active', 'completed', 'cancelled', 'draft', 'planned')),
  tcg_id UUID REFERENCES public.tcgs(id) ON DELETE SET NULL,
  tcg_name TEXT,
  format_id UUID REFERENCES public.formats(id) ON DELETE SET NULL,
  format_name TEXT,
  max_participants INT,
  bracket_type TEXT CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss', 'pool_play')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT events_organizer_check CHECK (
    (organizer_user_id IS NOT NULL AND organizer_store_id IS NULL)
    OR (organizer_user_id IS NULL AND organizer_store_id IS NOT NULL)
  )
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Event Participants
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('opponent', 'participant')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'checked_in')),
  confirmed_at TIMESTAMPTZ,
  score TEXT,
  placement INT,
  seed INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Bracket Rounds
CREATE TABLE IF NOT EXISTS public.bracket_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bracket_rounds ENABLE ROW LEVEL SECURITY;

-- Bracket Matches
CREATE TABLE IF NOT EXISTS public.bracket_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.bracket_rounds(id) ON DELETE CASCADE,
  player1_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  score_player1 INT,
  score_player2 INT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'walkover')),
  next_match_id UUID REFERENCES public.bracket_matches(id) ON DELETE SET NULL,
  next_match_player_slot INT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bracket_matches ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Push Subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('store', 'user', 'event')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
