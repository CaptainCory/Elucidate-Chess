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
  const initialized = useRef(false);

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
    // 1. Set up the listener FIRST (required by Supabase docs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('[Auth] onAuthStateChange:', event, !!newSession?.user);
        
        // Skip the INITIAL_SESSION from the listener if getSession already handled it
        if (event === 'INITIAL_SESSION' && initialized.current) {
          return;
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        initialized.current = true;

        if (newSession?.user) {
          // Use setTimeout to avoid calling Supabase inside the callback synchronously
          setTimeout(() => {
            void loadPremiumFromProfile(newSession.user.id);
          }, 0);
        } else {
          setIsPremium(false);
          setSubscriptionEnd(null);
        }
      }
    );

    // 2. Then restore session from storage
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('[Auth] getSession:', !!currentSession?.user);
      
      // Only apply if the listener hasn't already set a real session
      if (!initialized.current) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        initialized.current = true;

        if (currentSession?.user) {
          void loadPremiumFromProfile(currentSession.user.id);
        }
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deferred Stripe check when user becomes available
  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(() => {
      void checkSubscription();
    }, 2000);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Background re-check every 5 minutes
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 300_000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }

    const clearAuthStorage = (storage: Storage) => {
      Object.keys(storage).forEach((key) => {
        if ((key.startsWith('sb-') && key.endsWith('-auth-token')) || key === 'supabase.auth.token') {
          storage.removeItem(key);
        }
      });
    };

    clearAuthStorage(window.localStorage);
    clearAuthStorage(window.sessionStorage);

    setUser(null);
    setSession(null);
    setIsPremium(false);
    setSubscriptionEnd(null);
    initialized.current = false;

    window.location.replace(`/?signed_out=${Date.now()}`);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isPremium, subscriptionEnd, signOut, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}
