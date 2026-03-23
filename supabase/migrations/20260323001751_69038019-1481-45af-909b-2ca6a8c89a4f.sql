CREATE OR REPLACE FUNCTION public.get_next_puzzle(p_user_id uuid, p_current_puzzle_id text, p_is_premium boolean DEFAULT false)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_difficulty text := 'beginner';
  v_avg_at_level integer := 0;
  v_target_difficulty text;
  v_next_id text;
  v_profile profiles%ROWTYPE;
  v_is_anonymous boolean;
BEGIN
  -- Check if user is anonymous (fake UUID)
  v_is_anonymous := (p_user_id IS NULL OR p_user_id = '00000000-0000-0000-0000-000000000000');

  -- 1. Mark current puzzle as seen (only for real users)
  IF NOT v_is_anonymous THEN
    INSERT INTO user_seen_puzzles (user_id, puzzle_id)
    VALUES (p_user_id, p_current_puzzle_id)
    ON CONFLICT (user_id, puzzle_id) DO NOTHING;
  END IF;

  -- 2. Get user's difficulty and avg score
  IF NOT v_is_anonymous THEN
    SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id;
    IF FOUND THEN
      v_difficulty := CASE WHEN p_is_premium THEN v_profile.current_difficulty ELSE 'beginner' END;
      v_avg_at_level := CASE v_difficulty
        WHEN 'intermediate' THEN v_profile.intermediate_avg_score
        WHEN 'advanced' THEN v_profile.advanced_avg_score
        ELSE v_profile.beginner_avg_score
      END;
    END IF;
  END IF;

  -- 3. Adaptive difficulty
  v_target_difficulty := v_difficulty;
  IF v_difficulty = 'intermediate' AND v_avg_at_level < 50 AND random() < 0.5 THEN
    v_target_difficulty := 'beginner';
  ELSIF v_difficulty = 'advanced' AND v_avg_at_level < 50 AND random() < 0.5 THEN
    v_target_difficulty := 'intermediate';
  END IF;

  -- 4. Pick random unseen puzzle at target difficulty
  IF v_is_anonymous THEN
    -- Anonymous: just pick any random puzzle excluding current
    SELECT p.id INTO v_next_id
    FROM puzzles p
    WHERE p.difficulty = v_target_difficulty
      AND p.id != p_current_puzzle_id
    ORDER BY random()
    LIMIT 1;
  ELSE
    SELECT p.id INTO v_next_id
    FROM puzzles p
    WHERE p.difficulty = v_target_difficulty
      AND p.id != p_current_puzzle_id
      AND NOT EXISTS (
        SELECT 1 FROM user_seen_puzzles usp
        WHERE usp.user_id = p_user_id AND usp.puzzle_id = p.id
      )
    ORDER BY random()
    LIMIT 1;

    -- 5. If all seen, reset and pick again
    IF v_next_id IS NULL THEN
      DELETE FROM user_seen_puzzles
      WHERE user_id = p_user_id
        AND puzzle_id IN (SELECT id FROM puzzles WHERE difficulty = v_target_difficulty);

      SELECT p.id INTO v_next_id
      FROM puzzles p
      WHERE p.difficulty = v_target_difficulty
        AND p.id != p_current_puzzle_id
      ORDER BY random()
      LIMIT 1;
    END IF;
  END IF;

  -- 6. Fallback: any beginner puzzle
  IF v_next_id IS NULL THEN
    SELECT p.id INTO v_next_id
    FROM puzzles p
    WHERE p.difficulty = 'beginner'
      AND p.id != p_current_puzzle_id
    ORDER BY random()
    LIMIT 1;
  END IF;

  -- 7. Last fallback: any puzzle
  IF v_next_id IS NULL THEN
    SELECT p.id INTO v_next_id
    FROM puzzles p
    WHERE p.id != p_current_puzzle_id
    ORDER BY random()
    LIMIT 1;
  END IF;

  RETURN v_next_id;
END;
$function$