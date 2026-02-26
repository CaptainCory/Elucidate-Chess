
-- Add leaderboard columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS average_score integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS best_streak integer NOT NULL DEFAULT 0;

-- Allow anyone to read display_name, puzzles_solved, average_score, best_streak for leaderboard
-- Drop old restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Users can view all profiles (needed for leaderboard)
CREATE POLICY "Anyone can view profiles"
ON public.profiles FOR SELECT
USING (true);
