
-- Add current_streak column
ALTER TABLE public.profiles ADD COLUMN current_streak integer NOT NULL DEFAULT 0;

-- Replace increment_puzzle_stats to handle streak server-side
CREATE OR REPLACE FUNCTION public.increment_puzzle_stats(p_user_id uuid, p_score integer, p_streak integer, p_difficulty text DEFAULT 'beginner'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  profile_row profiles%ROWTYPE;
  new_diff_solved integer;
  new_diff_avg integer;
  new_difficulty text;
  did_graduate boolean := false;
  v_new_streak integer;
BEGIN
  SELECT * INTO profile_row FROM profiles WHERE user_id = p_user_id;

  -- Server-side streak: if score >= 70, increment; otherwise reset
  IF p_score >= 70 THEN
    v_new_streak := profile_row.current_streak + 1;
  ELSE
    v_new_streak := 0;
  END IF;

  -- Update global stats including streak
  UPDATE profiles SET
    puzzles_solved = profile_row.puzzles_solved + 1,
    average_score = CASE 
      WHEN profile_row.puzzles_solved = 0 THEN p_score
      ELSE ((profile_row.average_score * profile_row.puzzles_solved) + p_score) / (profile_row.puzzles_solved + 1)
    END,
    current_streak = v_new_streak,
    best_streak = GREATEST(profile_row.best_streak, v_new_streak)
  WHERE user_id = p_user_id;

  -- Update per-difficulty stats + high score counts
  IF p_difficulty = 'beginner' THEN
    new_diff_solved := profile_row.beginner_solved + 1;
    new_diff_avg := CASE WHEN profile_row.beginner_solved = 0 THEN p_score
      ELSE ((profile_row.beginner_avg_score * profile_row.beginner_solved) + p_score) / new_diff_solved END;
    UPDATE profiles SET 
      beginner_solved = new_diff_solved, 
      beginner_avg_score = new_diff_avg,
      beginner_high_scores = CASE WHEN p_score >= 90 THEN profile_row.beginner_high_scores + 1 ELSE profile_row.beginner_high_scores END
    WHERE user_id = p_user_id;
  ELSIF p_difficulty = 'intermediate' THEN
    new_diff_solved := profile_row.intermediate_solved + 1;
    new_diff_avg := CASE WHEN profile_row.intermediate_solved = 0 THEN p_score
      ELSE ((profile_row.intermediate_avg_score * profile_row.intermediate_solved) + p_score) / new_diff_solved END;
    UPDATE profiles SET 
      intermediate_solved = new_diff_solved, 
      intermediate_avg_score = new_diff_avg,
      intermediate_high_scores = CASE WHEN p_score >= 90 THEN profile_row.intermediate_high_scores + 1 ELSE profile_row.intermediate_high_scores END
    WHERE user_id = p_user_id;
  ELSIF p_difficulty = 'advanced' THEN
    new_diff_solved := profile_row.advanced_solved + 1;
    new_diff_avg := CASE WHEN profile_row.advanced_solved = 0 THEN p_score
      ELSE ((profile_row.advanced_avg_score * profile_row.advanced_solved) + p_score) / new_diff_solved END;
    UPDATE profiles SET 
      advanced_solved = new_diff_solved, 
      advanced_avg_score = new_diff_avg,
      advanced_high_scores = CASE WHEN p_score >= 90 THEN profile_row.advanced_high_scores + 1 ELSE profile_row.advanced_high_scores END
    WHERE user_id = p_user_id;
  END IF;

  -- Re-read profile after updates
  SELECT * INTO profile_row FROM profiles WHERE user_id = p_user_id;

  new_difficulty := profile_row.current_difficulty;

  IF profile_row.current_difficulty = 'beginner' 
     AND profile_row.beginner_high_scores >= 3 THEN
    new_difficulty := 'intermediate';
    did_graduate := true;
    UPDATE profiles SET current_difficulty = 'intermediate' WHERE user_id = p_user_id;
  ELSIF profile_row.current_difficulty = 'intermediate' 
     AND profile_row.intermediate_high_scores >= 5 THEN
    new_difficulty := 'advanced';
    did_graduate := true;
    UPDATE profiles SET current_difficulty = 'advanced' WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'current_difficulty', new_difficulty, 
    'graduated', did_graduate,
    'beginner_solved', profile_row.beginner_solved,
    'intermediate_solved', profile_row.intermediate_solved,
    'advanced_solved', profile_row.advanced_solved,
    'beginner_avg_score', profile_row.beginner_avg_score,
    'intermediate_avg_score', profile_row.intermediate_avg_score,
    'advanced_avg_score', profile_row.advanced_avg_score,
    'beginner_high_scores', profile_row.beginner_high_scores,
    'intermediate_high_scores', profile_row.intermediate_high_scores,
    'advanced_high_scores', profile_row.advanced_high_scores,
    'current_streak', v_new_streak,
    'best_streak', GREATEST(profile_row.best_streak, v_new_streak)
  );
END;
$function$;
