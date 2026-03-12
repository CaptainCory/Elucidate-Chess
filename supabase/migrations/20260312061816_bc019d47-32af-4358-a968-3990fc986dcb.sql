
-- Add progression columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_difficulty text NOT NULL DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS beginner_solved integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS beginner_avg_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS intermediate_solved integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS intermediate_avg_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advanced_solved integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advanced_avg_score integer NOT NULL DEFAULT 0;
