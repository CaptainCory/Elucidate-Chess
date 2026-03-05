
-- 1. Create puzzle_attempts table for server-side usage tracking
CREATE TABLE public.puzzle_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  puzzle_id text NOT NULL,
  attempted_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_hash text
);

ALTER TABLE public.puzzle_attempts ENABLE ROW LEVEL SECURITY;

-- Users can read their own attempts
CREATE POLICY "Users can read own attempts"
  ON public.puzzle_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "Users can insert own attempts"
  ON public.puzzle_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- No update or delete allowed

-- 2. Create index for efficient daily count queries
CREATE INDEX idx_puzzle_attempts_user_date
  ON public.puzzle_attempts (user_id, attempted_at);

-- 3. Trigger to prevent client-side is_premium tampering
CREATE OR REPLACE FUNCTION public.protect_is_premium()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  -- If is_premium is being changed and the caller is NOT the service role,
  -- revert the change. Service role bypasses RLS entirely so this trigger
  -- only fires for normal authenticated users.
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    -- Check if current role is the service_role (edge functions use this)
    IF current_setting('role') != 'service_role' THEN
      NEW.is_premium := OLD.is_premium;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_is_premium_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_is_premium();

-- 4. Function to count today's attempts for a user
CREATE OR REPLACE FUNCTION public.get_daily_attempt_count(p_user_id uuid)
  RETURNS integer
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM public.puzzle_attempts
  WHERE user_id = p_user_id
    AND attempted_at >= (CURRENT_DATE AT TIME ZONE 'UTC');
$$;
