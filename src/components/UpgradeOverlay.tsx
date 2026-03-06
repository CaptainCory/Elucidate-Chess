import { useState } from 'react';
import { Crown, Zap, Brain, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UpgradeOverlayProps {
  open: boolean;
  onClose: () => void;
}

export const UpgradeOverlay = ({ open, onClose }: UpgradeOverlayProps) => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!open) return null;

  const handleUpgrade = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
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
              <Crown className="w-8 h-8 text-primary" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-display text-foreground">
                You're out of positions today
              </h2>
              <p className="text-muted-foreground text-sm">
                Upgrade to Premium for unlimited positions and AI analysis every day.
              </p>
            </div>

            <div className="w-full space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm text-foreground">
                <Zap className="w-4 h-4 text-primary shrink-0" />
                <span>Unlimited positions daily</span>
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

            <div className="w-full space-y-3">
              <Button onClick={handleUpgrade} className="w-full gap-2" size="lg">
                <Crown className="w-4 h-4" />
                {user ? 'Upgrade for $9/month' : 'Sign in & Upgrade for $9/month'}
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
