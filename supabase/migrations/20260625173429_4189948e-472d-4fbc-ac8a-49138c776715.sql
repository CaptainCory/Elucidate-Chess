
-- =====================================================================
-- SECURITY FIXES: roles, RLS hardening, function guards, integrity
-- =====================================================================

-- 1. ROLES SYSTEM ------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Bootstrap existing puzzle creator as admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE id = '10967a0c-b60c-41b2-8f6c-caf034992385'
ON CONFLICT DO NOTHING;


-- 2. PROFILES: prevent premium self-escalation; restrict insert to auth
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Ensure protect_is_premium trigger is attached
DROP TRIGGER IF EXISTS protect_is_premium_trigger ON public.profiles;
CREATE TRIGGER protect_is_premium_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_is_premium();


-- 3. PUZZLES: admin-only writes; redact best_move from anon
DROP POLICY IF EXISTS "Authenticated users can insert puzzles" ON public.puzzles;
DROP POLICY IF EXISTS "Authenticated users can update puzzles" ON public.puzzles;
DROP POLICY IF EXISTS "Authenticated users can delete puzzles" ON public.puzzles;

CREATE POLICY "Admins can insert puzzles" ON public.puzzles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update puzzles" ON public.puzzles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete puzzles" ON public.puzzles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Column-level: hide best_move from anonymous visitors (still readable
-- by authenticated users so admin edit screens keep working; the
-- analyze-chess edge function uses service role to validate moves)
REVOKE SELECT ON public.puzzles FROM anon;
GRANT SELECT (id, name, fen, previous_fen, difficulty, explanation, themes, created_at, created_by)
  ON public.puzzles TO anon;


-- 4. EMAIL SUBSCRIBERS: lock down reads & validate inserts
REVOKE SELECT, UPDATE, DELETE ON public.email_subscribers FROM anon, authenticated;
GRANT INSERT ON public.email_subscribers TO anon, authenticated;
GRANT ALL ON public.email_subscribers TO service_role;

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.email_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.email_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) BETWEEN 5 AND 320
    AND email LIKE '%@%.%'
    AND unsubscribed = false
  );


-- 5. USER_ACHIEVEMENTS: block direct writes (server-side only)
REVOKE INSERT, UPDATE, DELETE ON public.user_achievements FROM anon, authenticated;
GRANT SELECT ON public.user_achievements TO anon, authenticated;
GRANT ALL ON public.user_achievements TO service_role;


-- 6. DAILY_CHALLENGE_SCORES: integrity guards
ALTER TABLE public.daily_challenge_scores
  DROP CONSTRAINT IF EXISTS unique_user_challenge_date;
ALTER TABLE public.daily_challenge_scores
  ADD CONSTRAINT unique_user_challenge_date UNIQUE (user_id, challenge_date);

CREATE OR REPLACE FUNCTION public.validate_daily_score()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.score IS NULL OR NEW.score < 0 OR NEW.score > 100 THEN
    RAISE EXCEPTION 'Invalid score: must be between 0 and 100';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_daily_score_range ON public.daily_challenge_scores;
CREATE TRIGGER check_daily_score_range
  BEFORE INSERT OR UPDATE ON public.daily_challenge_scores
  FOR EACH ROW EXECUTE FUNCTION public.validate_daily_score();


-- 7. INCREMENT_PUZZLE_STATS: guard against cross-user updates
CREATE OR REPLACE FUNCTION public.increment_puzzle_stats(
  p_user_id uuid, p_score integer, p_streak integer, p_difficulty text DEFAULT 'beginner'
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  profile_row profiles%ROWTYPE;
  new_diff_solved integer;
  new_diff_avg integer;
  new_difficulty text;
  did_graduate boolean := false;
  v_new_streak integer;
  v_new_achievements text[] := '{}';
BEGIN
  -- AUTH GUARD: callers can only update their own stats
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot update another user''s stats';
  END IF;

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

  IF profile_row.current_difficulty = 'beginner' AND profile_row.beginner_high_scores >= 3 THEN
    new_difficulty := 'intermediate'; did_graduate := true;
    UPDATE profiles SET current_difficulty = 'intermediate' WHERE user_id = p_user_id;
  ELSIF profile_row.current_difficulty = 'intermediate' AND profile_row.intermediate_high_scores >= 5 THEN
    new_difficulty := 'advanced'; did_graduate := true;
    UPDATE profiles SET current_difficulty = 'advanced' WHERE user_id = p_user_id;
  END IF;

  IF profile_row.puzzles_solved = 1 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'first_solve') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'first_solve'); END IF;
  END IF;
  IF p_score = 100 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'perfect_score') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'perfect_score'); END IF;
  END IF;
  IF v_new_streak >= 5 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'streak_5') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'streak_5'); END IF;
  END IF;
  IF v_new_streak >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'streak_10') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'streak_10'); END IF;
  END IF;
  IF profile_row.puzzles_solved = 10 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'ten_solved') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'ten_solved'); END IF;
  END IF;
  IF profile_row.puzzles_solved = 50 THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'fifty_solved') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'fifty_solved'); END IF;
  END IF;
  IF did_graduate AND new_difficulty = 'intermediate' THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'beginner_graduate') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'beginner_graduate'); END IF;
  END IF;
  IF did_graduate AND new_difficulty = 'advanced' THEN
    INSERT INTO user_achievements (user_id, achievement_key) VALUES (p_user_id, 'advanced_graduate') ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achievements := array_append(v_new_achievements, 'advanced_graduate'); END IF;
  END IF;

  RETURN jsonb_build_object(
    'current_difficulty', new_difficulty, 'graduated', did_graduate,
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

REVOKE ALL ON FUNCTION public.increment_puzzle_stats(uuid, integer, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_puzzle_stats(uuid, integer, integer, text) TO authenticated, service_role;


-- 8. GET_NEXT_PUZZLE: derive premium server-side (drop client-controlled flag)
DROP FUNCTION IF EXISTS public.get_next_puzzle(uuid, text, boolean);

CREATE OR REPLACE FUNCTION public.get_next_puzzle(p_user_id uuid, p_current_puzzle_id text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
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

-- allow anon (guests can navigate to next puzzle)
GRANT EXECUTE ON FUNCTION public.get_next_puzzle(uuid, text) TO anon, authenticated, service_role;


-- 9. LOCK DOWN OTHER SECURITY DEFINER FUNCS FROM ANON/PUBLIC
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_is_premium() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
