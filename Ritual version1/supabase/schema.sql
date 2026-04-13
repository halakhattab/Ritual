-- ────────────────────────────────────────────────────────────
-- Ritual — Supabase Schema
-- Run this in your Supabase SQL editor to set up the database
-- ────────────────────────────────────────────────────────────

-- ─── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name      TEXT DEFAULT '',
  city      TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Rituals ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rituals (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  start_time TIME,
  end_time   TIME,
  category   TEXT CHECK (category IN ('Mind', 'Body', 'Spirit', 'Rest')) DEFAULT 'Mind',
  "order"    INTEGER DEFAULT 0,
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rituals_user_id_idx ON public.rituals(user_id);

-- ─── Ritual Logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ritual_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ritual_id    UUID NOT NULL REFERENCES public.rituals(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  completed    BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, ritual_id, date)
);

CREATE INDEX IF NOT EXISTS ritual_logs_user_date_idx ON public.ritual_logs(user_id, date);

-- ─── Mood Logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mood_logs (
  id      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date    DATE NOT NULL,
  mood    TEXT CHECK (mood IN ('Energized', 'Calm', 'Foggy', 'Motivated', 'Anxious', 'Tired')),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS mood_logs_user_date_idx ON public.mood_logs(user_id, date);

-- ─── Journal Entries ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  content    TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS journal_entries_user_date_idx ON public.journal_entries(user_id, date);

-- ─── AI Cache ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_cache (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  content      TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_cache_user_type_idx ON public.ai_cache(user_id, type);

-- ────────────────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rituals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cache       ENABLE ROW LEVEL SECURITY;

-- Users: own row only
CREATE POLICY "users_own" ON public.users
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Rituals: own rows only
CREATE POLICY "rituals_own" ON public.rituals
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ritual logs: own rows only
CREATE POLICY "ritual_logs_own" ON public.ritual_logs
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Mood logs: own rows only
CREATE POLICY "mood_logs_own" ON public.mood_logs
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Journal entries: own rows only
CREATE POLICY "journal_entries_own" ON public.journal_entries
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- AI cache: own rows only
CREATE POLICY "ai_cache_own" ON public.ai_cache
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- Auto-create user profile on signup
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, city)
  VALUES (NEW.id, '', '')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
