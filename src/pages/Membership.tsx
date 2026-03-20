import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, ArrowLeft, CreditCard, Calendar, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ChessQuoteFooter } from '@/components/ChessQuoteFooter';

const Membership = () => {
  const { user, isPremium, subscriptionEnd, loading, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [portalLoading, setPortalLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');

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
      await supabase.auth.refreshSession();
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

  const handleUpgrade = async () => {
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
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(38 92% 50% / 0.15), transparent 60%)',
        }}
      />

      <div className="relative container max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to puzzles</span>
        </button>

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
                  {isPremium ? 'All Difficulty Levels' : 'Free Plan'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPremium
                    ? 'Unlimited puzzles at all difficulty levels with AI analysis'
                    : 'Unlimited beginner positions · Upgrade for intermediate & advanced'}
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
              Unlock intermediate and advanced positions with full AI-powered analysis.
            </p>

            {/* Plan toggle */}
            <div className="flex gap-3 mb-4">
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

            <Button onClick={handleUpgrade} className="gap-2 w-full">
              <Crown className="w-4 h-4" />
              {plan === 'monthly' ? 'Upgrade for $9/month' : 'Upgrade for $89/year'}
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
      <ChessQuoteFooter />
    </div>
  );
};

export default Membership;
