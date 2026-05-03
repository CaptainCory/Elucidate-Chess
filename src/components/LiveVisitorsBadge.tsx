import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Small live indicator showing how many people are currently on the site.
 * Subscribes to the same 'global-presence' channel used by PresenceTracker.
 */
export function LiveVisitorsBadge({ className = '' }: { className?: string }) {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const channel = supabase.channel('global-presence');

    const sync = () => {
      const state = channel.presenceState();
      setCount(Object.keys(state).length);
    };

    channel
      .on('presence', { event: 'sync' }, sync)
      .on('presence', { event: 'join' }, sync)
      .on('presence', { event: 'leave' }, sync)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (count < 1) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium ${className}`}
      title={`${count} ${count === 1 ? 'person is' : 'people are'} on Elucidate Chess right now`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
      </span>
      <span>{count} online</span>
    </div>
  );
}
