
-- Convert get_next_puzzle to SECURITY INVOKER (RLS does the right thing
-- because the only writes happen on the caller's own rows in user_seen_puzzles)
CREATE OR REPLACE FUNCTION public.get_next_puzzle(p_user_id uuid, p_current_puzzle_id text)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $function$
DECLARE
  v_difficulty text := 'beginner';
  v_avg_at_level integer := 0;
  v_target_difficulty text;
  v_next_id text;
  v_profile profiles%ROWTYPE;
  v_is_anonymous boolean;
  v_is_premium boolean := false;
BEGIN
  v_is_anonymous := (p_user_id IS NULL OR p_user_id = '00000000-0000-0000-0000-000000000000');

  IF NOT v_is_anonymous THEN
    INSERT INTO user_seen_puzzles (user_id, puzzle_id)
    VALUES (p_user_id, p_current_puzzle_id)
    ON CONFLICT (user_id, puzzle_id) DO NOTHING;

    SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id;
    IF FOUND THEN
      v_is_premium := v_profile.is_premium;
      v_difficulty := CASE WHEN v_is_premium THEN v_profile.current_difficulty ELSE 'beginner' END;
      v_avg_at_level := CASE v_difficulty
        WHEN 'intermediate' THEN v_profile.intermediate_avg_score
        WHEN 'advanced' THEN v_profile.advanced_avg_score
        ELSE v_profile.beginner_avg_score
      END;
    END IF;
  END IF;

  v_target_difficulty := v_difficulty;
  IF v_difficulty = 'intermediate' AND v_avg_at_level < 50 AND random() < 0.5 THEN
    v_target_difficulty := 'beginner';
  ELSIF v_difficulty = 'advanced' AND v_avg_at_level < 50 AND random() < 0.5 THEN
    v_target_difficulty := 'intermediate';
  END IF;

  IF v_is_anonymous THEN
    SELECT p.id INTO v_next_id FROM puzzles p
    WHERE p.difficulty = v_target_difficulty AND p.id != p_current_puzzle_id
    ORDER BY random() LIMIT 1;
  ELSE
    SELECT p.id INTO v_next_id FROM puzzles p
    WHERE p.difficulty = v_target_difficulty AND p.id != p_current_puzzle_id
      AND NOT EXISTS (SELECT 1 FROM user_seen_puzzles usp WHERE usp.user_id = p_user_id AND usp.puzzle_id = p.id)
    ORDER BY random() LIMIT 1;
    IF v_next_id IS NULL THEN
      DELETE FROM user_seen_puzzles WHERE user_id = p_user_id AND puzzle_id IN (SELECT id FROM puzzles WHERE difficulty = v_target_difficulty);
      SELECT p.id INTO v_next_id FROM puzzles p
      WHERE p.difficulty = v_target_difficulty AND p.id != p_current_puzzle_id
      ORDER BY random() LIMIT 1;
    END IF;
  END IF;

  IF v_next_id IS NULL THEN
    SELECT p.id INTO v_next_id FROM puzzles p WHERE p.difficulty = 'beginner' AND p.id != p_current_puzzle_id ORDER BY random() LIMIT 1;
  END IF;
  IF v_next_id IS NULL THEN
    SELECT p.id INTO v_next_id FROM puzzles p WHERE p.id != p_current_puzzle_id ORDER BY random() LIMIT 1;
  END IF;
  RETURN v_next_id;
END;
$function$;
