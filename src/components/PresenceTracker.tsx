import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Joins a global presence channel so admins can see live visitor counts.
 * Mounted once at app root; one presence entry per browser tab.
 */
export function PresenceTracker() {
  useEffect(() => {
    const key = `visitor-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
    const channel = supabase.channel('global-presence', {
      config: { presence: { key } },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          path: window.location.pathname,
          joined_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
