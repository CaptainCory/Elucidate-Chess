
CREATE TABLE public.user_seen_puzzles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id text NOT NULL,
  seen_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, puzzle_id)
);

ALTER TABLE public.user_seen_puzzles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own seen puzzles"
  ON public.user_seen_puzzles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own seen puzzles"
  ON public.user_seen_puzzles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own seen puzzles"
  ON public.user_seen_puzzles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
