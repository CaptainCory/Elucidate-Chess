
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
BEGIN
  SELECT * INTO profile_row FROM profiles WHERE user_id = p_user_id;

  -- Increment overall stats
  UPDATE profiles SET
    puzzles_solved = profile_row.puzzles_solved + 1,
    average_score = CASE 
      WHEN profile_row.puzzles_solved = 0 THEN p_score
      ELSE ((profile_row.average_score * profile_row.puzzles_solved) + p_score) / (profile_row.puzzles_solved + 1)
    END,
    best_streak = GREATEST(profile_row.best_streak, p_streak)
  WHERE user_id = p_user_id;

  -- Increment per-difficulty stats
  IF p_difficulty = 'beginner' THEN
    new_diff_solved := profile_row.beginner_solved + 1;
    new_diff_avg := CASE WHEN profile_row.beginner_solved = 0 THEN p_score
      ELSE ((profile_row.beginner_avg_score * profile_row.beginner_solved) + p_score) / new_diff_solved END;
    UPDATE profiles SET beginner_solved = new_diff_solved, beginner_avg_score = new_diff_avg WHERE user_id = p_user_id;
  ELSIF p_difficulty = 'intermediate' THEN
    new_diff_solved := profile_row.intermediate_solved + 1;
    new_diff_avg := CASE WHEN profile_row.intermediate_solved = 0 THEN p_score
      ELSE ((profile_row.intermediate_avg_score * profile_row.intermediate_solved) + p_score) / new_diff_solved END;
    UPDATE profiles SET intermediate_solved = new_diff_solved, intermediate_avg_score = new_diff_avg WHERE user_id = p_user_id;
  ELSIF p_difficulty = 'advanced' THEN
    new_diff_solved := profile_row.advanced_solved + 1;
    new_diff_avg := CASE WHEN profile_row.advanced_solved = 0 THEN p_score
      ELSE ((profile_row.advanced_avg_score * profile_row.advanced_solved) + p_score) / new_diff_solved END;
    UPDATE profiles SET advanced_solved = new_diff_solved, advanced_avg_score = new_diff_avg WHERE user_id = p_user_id;
  END IF;

  -- Re-read after updates
  SELECT * INTO profile_row FROM profiles WHERE user_id = p_user_id;

  -- Check graduation: requires BOTH solve count AND average score threshold
  -- Beginner → Intermediate: 3 solves + avg ≥ 60
  -- Intermediate → Advanced: 5 solves + avg ≥ 65
  new_difficulty := profile_row.current_difficulty;

  IF profile_row.current_difficulty = 'beginner' 
     AND profile_row.beginner_solved >= 3
     AND profile_row.beginner_avg_score >= 60 THEN
    new_difficulty := 'intermediate';
    did_graduate := true;
    UPDATE profiles SET current_difficulty = 'intermediate' WHERE user_id = p_user_id;
  ELSIF profile_row.current_difficulty = 'intermediate' 
     AND profile_row.intermediate_solved >= 5
     AND profile_row.intermediate_avg_score >= 65 THEN
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
    'advanced_avg_score', profile_row.advanced_avg_score
  );
END;
$function$;
