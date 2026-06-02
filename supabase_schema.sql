-- Supabase SQL Schema for Sports Auction Room

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Public Profile)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sport TEXT NOT NULL,
    tournament TEXT NOT NULL,
    budget BIGINT NOT NULL DEFAULT 0,
    squad_size INTEGER NOT NULL DEFAULT 11,
    enable_bots BOOLEAN DEFAULT false,
    phase TEXT NOT NULL DEFAULT 'scheduled' CHECK (phase IN ('scheduled', 'lobby', 'bidding', 'sold', 'unsold', 'done')),
    host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    player_idx INTEGER DEFAULT 0,
    current_bid BIGINT DEFAULT 0,
    current_bidder UUID, -- Will reference teams(id) once created
    ends_at BIGINT, -- Timestamp in ms
    scheduled_at BIGINT, -- Timestamp in ms
    passed_by JSONB NOT NULL DEFAULT '[]'::jsonb, -- Team IDs that passed on the current player
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Teams Table (Participants)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Null implies a bot
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#000000',
    photo TEXT,
    budget BIGINT NOT NULL DEFAULT 0,
    spent BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(room_id, name)
);

-- Add foreign key back to rooms for current_bidder now that teams exists
ALTER TABLE public.rooms 
  ADD CONSTRAINT fk_rooms_current_bidder 
  FOREIGN KEY (current_bidder) REFERENCES public.teams(id) ON DELETE SET NULL;

-- 4. Players Table
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    role TEXT NOT NULL,
    tier TEXT NOT NULL,
    base_price BIGINT NOT NULL DEFAULT 0,
    sold_price BIGINT,
    status TEXT NOT NULL DEFAULT 'unsold' CHECK (status IN ('unsold', 'sold', 'current')),
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    image TEXT,
    nat TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Bids Table
CREATE TABLE IF NOT EXISTS public.bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON public.rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_teams_room_id ON public.teams(room_id);
CREATE INDEX IF NOT EXISTS idx_players_room_id ON public.players(room_id);
CREATE INDEX IF NOT EXISTS idx_bids_room_id ON public.bids(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Simple policies (Allow all for anon for easy local dev, but should be secured in production)
-- Replace with proper `auth.uid()` checks when adding Supabase Auth.
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Enable insert for all rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all rooms" ON public.rooms FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Enable insert for all teams" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all teams" ON public.teams FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Enable insert for all players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all players" ON public.players FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all bids" ON public.bids FOR SELECT USING (true);
CREATE POLICY "Enable insert for all bids" ON public.bids FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all chats" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Enable insert for all chats" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- ============================================================
-- Realtime: the web app subscribes to live changes on these
-- tables (room phase/timer/bid updates, new chat, new bids).
-- Without this, other players won't see updates until the
-- 3-second fallback poll. Wrapped so re-running is safe.
-- ============================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Atomic Bidding RPC (prevents race conditions)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
CREATE OR REPLACE FUNCTION place_auction_bid(
    p_room_id UUID,
    p_team_id UUID,
    p_player_id UUID,
    p_amount BIGINT,
    p_ends_at BIGINT
) RETURNS JSONB AS $$
DECLARE
    v_current_bid    BIGINT;
    v_team_budget    BIGINT;
    v_team_spent     BIGINT;
    v_phase          TEXT;
BEGIN
    -- Lock the room row to prevent concurrent modifications
    SELECT current_bid, phase
      INTO v_current_bid, v_phase
      FROM public.rooms
     WHERE id = p_room_id
       FOR UPDATE;

    IF v_phase <> 'bidding' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Bidding is not active');
    END IF;

    IF p_amount <= v_current_bid THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Bid amount must exceed current bid');
    END IF;

    -- Lock the team row
    SELECT budget, spent
      INTO v_team_budget, v_team_spent
      FROM public.teams
     WHERE id = p_team_id
       FOR UPDATE;

    IF (v_team_spent + p_amount) > v_team_budget THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Insufficient budget');
    END IF;

    -- Insert the bid record
    INSERT INTO public.bids (room_id, team_id, player_id, amount)
    VALUES (p_room_id, p_team_id, p_player_id, p_amount);

    -- Update room with new bid state and extended timer
    UPDATE public.rooms
       SET current_bid     = p_amount,
           current_bidder  = p_team_id,
           ends_at         = p_ends_at,
           updated_at      = now()
     WHERE id = p_room_id;

    RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql;
