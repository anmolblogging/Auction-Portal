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
