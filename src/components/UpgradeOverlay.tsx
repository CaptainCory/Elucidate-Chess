import { useState } from 'react';
import { Crown, Zap, Brain, X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UpgradeOverlayProps {
  open: boolean;
  onClose: () => void;
}

export const UpgradeOverlay = ({ open, onClose }: UpgradeOverlayProps) => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');

  if (!open) return null;

  const handleUpgrade = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error('Failed to start checkout.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

        <div className="relative z-10 w-full max-w-xl mx-4 rounded-2xl border border-primary/20 bg-card p-10 shadow-2xl animate-fade-in">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-display text-foreground">
                Unlock Intermediate & Advanced
              </h2>
              <p className="text-muted-foreground text-sm">
                Free users get unlimited beginner positions. Upgrade to Premium to access all difficulty levels and accelerate your improvement.
              </p>
            </div>

            {/* Plan toggle */}
            <div className="w-full flex gap-3">
              <button
                onClick={() => setPlan('monthly')}
                className={cn(
                  'flex-1 rounded-xl border p-4 text-left transition-all',
                  plan === 'monthly'
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-muted-foreground/40'
                )}
              >
                <p className="text-sm font-semibold text-foreground">Monthly</p>
                <p className="text-lg font-bold text-foreground">$9<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
              </button>
              <button
                onClick={() => setPlan('annual')}
                className={cn(
                  'flex-1 rounded-xl border p-4 text-left transition-all relative',
                  plan === 'annual'
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-muted-foreground/40'
                )}
              >
                <span className="absolute -top-2.5 right-3 text-[10px] font-bold uppercase tracking-wide bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  Save 18%
                </span>
                <p className="text-sm font-semibold text-foreground">Annual</p>
                <p className="text-lg font-bold text-foreground">$89<span className="text-xs font-normal text-muted-foreground">/yr</span></p>
              </button>
            </div>

            <div className="w-full space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm text-foreground">
                <Zap className="w-4 h-4 text-primary shrink-0" />
                <span>Intermediate & Advanced positions</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground">
                <Brain className="w-4 h-4 text-primary shrink-0" />
                <span>Full AI-powered reasoning feedback</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground">
                <Crown className="w-4 h-4 text-primary shrink-0" />
                <span>Unlock all difficulty levels</span>
              </div>
            </div>

            <div className="w-full space-y-3">
              <Button onClick={handleUpgrade} className="w-full gap-2" size="lg">
                <Crown className="w-4 h-4" />
                {user
                  ? plan === 'monthly'
                    ? 'Upgrade for $9/month'
                    : 'Upgrade for $89/year'
                  : plan === 'monthly'
                    ? 'Sign in & Upgrade for $9/month'
                    : 'Sign in & Upgrade for $89/year'}
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

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
};
