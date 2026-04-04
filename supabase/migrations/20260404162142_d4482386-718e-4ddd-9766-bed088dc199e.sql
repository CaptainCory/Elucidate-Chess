
-- 1. Daily challenges table
CREATE TABLE public.daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id text NOT NULL,
  challenge_date date NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily challenges"
  ON public.daily_challenges FOR SELECT
  TO public
  USING (true);

-- 2. Daily challenge scores table
CREATE TABLE public.daily_challenge_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_date date NOT NULL,
  score integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_date)
);

ALTER TABLE public.daily_challenge_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily scores"
  ON public.daily_challenge_scores FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Auth users insert own daily scores"
  ON public.daily_challenge_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. User achievements table
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_key text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_key)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view achievements for leaderboard"
  ON public.user_achievements FOR SELECT
  TO public
  USING (true);

-- 4. Update increment_puzzle_stats to check and grant achievements
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
  v_new_achievements text[] := '{}';
BEGIN
  SELECT * INTO profile_row FROM profiles WHERE user_id = p_user_id;

  IF p_score >= 70 THEN
    v_new_streak := profile_row.current_streak + 1;
  ELSE
    v_new_streak := 0;
  END IF;

  UPDATE profiles SET
    puzzles_solved = profile_row.puzzles_solved + 1,
    average_score = CASE 
      WHEN profile_row.puzzles_solved = 0 THEN p_score
      ELSE ((profile_row.average_score * profile_row.puzzles_solved) + p_score) / (profile_row.puzzles_solved + 1)
    END,
    current_streak = v_new_streak,
    best_streak = GREATEST(profile_row.best_streak, v_new_streak)
  WHERE user_id = p_user_id;

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

  -- Achievement checks
  -- first_solve
  IF profile_row.puzzles_solved = 1 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'first_solve') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'first_solve'); END IF;
  END IF;

  -- perfect_score
  IF p_score = 100 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'perfect_score') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'perfect_score'); END IF;
  END IF;

  -- streak_5
  IF v_new_streak >= 5 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'streak_5') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'streak_5'); END IF;
  END IF;

  -- streak_10
  IF v_new_streak >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'streak_10') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'streak_10'); END IF;
  END IF;

  -- ten_solved
  IF profile_row.puzzles_solved = 10 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'ten_solved') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'ten_solved'); END IF;
  END IF;

  -- fifty_solved
  IF profile_row.puzzles_solved = 50 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'fifty_solved') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'fifty_solved'); END IF;
  END IF;

  -- beginner_graduate
  IF did_graduate AND new_difficulty = 'intermediate' THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'beginner_graduate') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'beginner_graduate'); END IF;
  END IF;

  -- advanced_graduate
  IF did_graduate AND new_difficulty = 'advanced' THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'advanced_graduate') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'advanced_graduate'); END IF;
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
    'best_streak', GREATEST(profile_row.best_streak, v_new_streak),
    'new_achievements', to_jsonb(v_new_achievements)
  );
END;
$function$;
