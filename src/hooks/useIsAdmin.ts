import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/** Returns whether the current authenticated user has the admin role. */
export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });
      if (cancelled) return;
      if (error) {
        console.error('has_role failed:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  return { isAdmin, loading: authLoading || isAdmin === null };
}
