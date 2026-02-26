import { Crown, Zap, Brain, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UpgradeOverlayProps {
  open: boolean;
  onClose: () => void;
}

export const UpgradeOverlay = ({ open, onClose }: UpgradeOverlayProps) => {
  if (!open) return null;

  const handleUpgrade = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch {
      toast.error('Failed to start checkout.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-primary/20 bg-card p-8 shadow-2xl animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
            <Crown className="w-8 h-8 text-primary" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display text-foreground">
              You're out of puzzles today
            </h2>
            <p className="text-muted-foreground text-sm">
              Upgrade to Premium for unlimited puzzles and AI analysis every day.
            </p>
          </div>

          {/* Benefits */}
          <div className="w-full space-y-3 text-left">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <span>Unlimited puzzles daily</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Brain className="w-4 h-4 text-primary shrink-0" />
              <span>Full AI-powered reasoning feedback</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Crown className="w-4 h-4 text-primary shrink-0" />
              <span>All difficulty levels unlocked</span>
            </div>
          </div>

          {/* Price + CTA */}
          <div className="w-full space-y-3">
            <Button onClick={handleUpgrade} className="w-full gap-2" size="lg">
              <Crown className="w-4 h-4" />
              Upgrade for $9/month
            </Button>
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
