import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPremium: boolean;
  subscriptionEnd: string | null;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isPremium: false,
  subscriptionEnd: null,
  signOut: async () => {},
  checkSubscription: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const stripeCheckInFlight = useRef(false);
  const lastStripeCheck = useRef(0);

  // Fast: read is_premium from the database (already synced by edge function)
  const loadPremiumFromProfile = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('user_id', userId)
      .maybeSingle();

    if (profile) {
      setIsPremium(profile.is_premium === true);
    }
  }, []);

  // Slow: verify with Stripe (deduplicated, max once per 5 minutes)
  const checkSubscription = useCallback(async () => {
    if (!user) {
      setIsPremium(false);
      setSubscriptionEnd(null);
      return;
    }

    const now = Date.now();
    if (stripeCheckInFlight.current || now - lastStripeCheck.current < 300_000) {
      return;
    }

    stripeCheckInFlight.current = true;
    lastStripeCheck.current = now;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (!error && data) {
        setIsPremium(data.subscribed === true);
        setSubscriptionEnd(data.subscription_end || null);
      }
    } catch (e) {
      console.error('Subscription check failed:', e);
    } finally {
      stripeCheckInFlight.current = false;
    }
  }, [user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Instantly load premium from DB
          await loadPremiumFromProfile(session.user.id);
          // Background Stripe sync (deferred)
          setTimeout(() => checkSubscription(), 2000);
        } else {
          setIsPremium(false);
          setSubscriptionEnd(null);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadPremiumFromProfile(session.user.id);
      }
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription, loadPremiumFromProfile]);

  // Background re-check every 5 minutes (not 60s)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 300_000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isPremium, subscriptionEnd, signOut, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}
