
CREATE OR REPLACE FUNCTION public.increment_puzzle_stats(
  p_user_id uuid,
  p_score integer,
  p_streak integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_solved integer;
  current_avg integer;
BEGIN
  SELECT puzzles_solved, average_score INTO current_solved, current_avg
  FROM profiles WHERE user_id = p_user_id;

  UPDATE profiles SET
    puzzles_solved = current_solved + 1,
    average_score = CASE 
      WHEN current_solved = 0 THEN p_score
      ELSE ((current_avg * current_solved) + p_score) / (current_solved + 1)
    END,
    best_streak = GREATEST(best_streak, p_streak)
  WHERE user_id = p_user_id;
END;
$$;
