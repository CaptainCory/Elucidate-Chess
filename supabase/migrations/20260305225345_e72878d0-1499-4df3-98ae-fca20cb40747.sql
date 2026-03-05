
CREATE TABLE public.puzzles (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  fen TEXT NOT NULL,
  previous_fen TEXT NOT NULL,
  best_move TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'master')),
  explanation TEXT NOT NULL,
  themes TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.puzzles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view puzzles" ON public.puzzles FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert puzzles" ON public.puzzles FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
