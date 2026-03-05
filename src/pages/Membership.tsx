import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, ArrowLeft, CreditCard, Calendar, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Membership = () => {
  const { user, isPremium, subscriptionEnd, loading, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [portalLoading, setPortalLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) checkSubscription();
  }, [user, checkSubscription]);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error('Portal error:', e);
      toast.error('Could not open subscription management. You may not have an active subscription.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleRestoreMembership = async () => {
    setRestoreLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;

      if (data?.subscribed === true) {
        await checkSubscription();
        toast.success('Membership restored. Unlimited puzzles are active.');
        navigate('/');
        return;
      }

      toast.info('No active membership was found for this account yet.');
    } catch (e) {
      console.error('Restore membership error:', e);
      toast.error('Could not restore membership right now.');
    } finally {
      setRestoreLoading(false);
    }
  };

  const formattedEnd = subscriptionEnd
    ? new Date(subscriptionEnd).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User';

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(38 92% 50% / 0.15), transparent 60%)',
        }}
      />

      <div className="relative container max-w-2xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to puzzles</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-foreground mb-1">Membership</h1>
          <p className="text-muted-foreground">Manage your plan and subscription</p>
        </div>

        {/* Current Plan Card */}
        <div className="chess-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Current Plan</h2>
            {isPremium ? (
              <Badge className="bg-primary/20 text-primary border-primary/30">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            ) : (
              <Badge variant="secondary">Free</Badge>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isPremium ? 'Unlimited Puzzles' : 'Free Plan'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPremium
                    ? '$9/month · Unlimited daily puzzles with AI analysis'
                    : '3 puzzles per day · Upgrade for unlimited access'}
                </p>
              </div>
            </div>

            {isPremium && formattedEnd && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Next billing date</p>
                  <p className="text-xs text-muted-foreground">{formattedEnd}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Info Card */}
        <div className="chess-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Account</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="text-foreground font-medium">{displayName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground font-medium">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isPremium ? (
          <div className="chess-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Manage Subscription</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Cancel, pause, or update your payment method through the billing portal.
            </p>
            <Button onClick={handleManageSubscription} disabled={portalLoading} className="gap-2">
              {portalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              {portalLoading ? 'Opening...' : 'Open Billing Portal'}
            </Button>
          </div>
        ) : (
          <div className="chess-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Upgrade to Premium</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Get unlimited puzzles every day with full AI-powered analysis for $9/month.
            </p>
            <Button
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke('create-checkout');
                  if (error) throw error;
                  if (data?.url) window.open(data.url, '_blank');
                } catch {
                  toast.error('Failed to start checkout.');
                }
              }}
              className="gap-2 w-full"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Premium
            </Button>
            <Button
              variant="outline"
              onClick={handleRestoreMembership}
              disabled={restoreLoading}
              className="w-full mt-3"
            >
              {restoreLoading ? 'Checking membership...' : 'Already subscribed? Restore Membership'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Membership;
