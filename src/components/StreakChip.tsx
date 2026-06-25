import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flame } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Compact streak indicator for the top nav. Links to /daily.
 * Only renders when the signed-in user has a streak >= 1.
 */
export function StreakChip({ className = '' }: { className?: string }) {
  const { user } = useAuth();

  const { data: streak } = useQuery({
    queryKey: ['nav-streak', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('current_streak')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data?.current_streak ?? 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  if (!user || !streak || streak < 1) return null;

  return (
    <Link
      to="/daily"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold hover:bg-accent/25 transition-colors ${className}`}
      title={`${streak}-day streak — keep it alive on the Daily Challenge`}
    >
      <Flame className="w-3.5 h-3.5" />
      <span>{streak}</span>
    </Link>
  );
}
