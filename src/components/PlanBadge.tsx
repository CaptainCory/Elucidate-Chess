import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

export function PlanBadge() {
  const { user, isPremium } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      toast.error('Please sign in first to upgrade.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (e) {
      console.error('Checkout error:', e);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isPremium) {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
          <Crown className="w-3 h-3 mr-1" />
          Unlimited Puzzles
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-muted-foreground">
        Free · 3 puzzles/day
      </Badge>
      <Button
        size="sm"
        onClick={handleUpgrade}
        disabled={loading}
        className="gap-1 text-xs h-7"
      >
        <Sparkles className="w-3 h-3" />
        {loading ? 'Loading...' : 'Upgrade to Unlimited Puzzles'}
      </Button>
    </div>
  );
}
