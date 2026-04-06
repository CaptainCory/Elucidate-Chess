
CREATE TABLE public.email_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed boolean NOT NULL DEFAULT false,
  CONSTRAINT email_subscribers_email_key UNIQUE (email)
);

ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (anon or authenticated)
CREATE POLICY "Anyone can subscribe"
  ON public.email_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only service role can read subscribers (for sending emails)
-- No public SELECT policy
