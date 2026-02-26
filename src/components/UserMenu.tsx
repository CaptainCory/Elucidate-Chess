import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Crown, CreditCard, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function UserMenu() {
  const { user, isPremium, subscriptionEnd, signOut } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User';
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (e) {
      console.error('Portal error:', e);
      toast.error('Could not open subscription management. You may not have an active subscription.');
    } finally {
      setPortalLoading(false);
    }
  };

  const formattedEnd = subscriptionEnd
    ? new Date(subscriptionEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          {isPremium && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
              <Crown className="h-2.5 w-2.5 text-primary-foreground" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Subscription Info */}
        <div className="px-2 py-2">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Subscription</span>
          </div>
          {isPremium ? (
            <div className="space-y-1 pl-5.5">
              <div className="flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold text-primary">Premium</span>
              </div>
              {formattedEnd && (
                <p className="text-xs text-muted-foreground">Renews {formattedEnd}</p>
              )}
            </div>
          ) : (
            <div className="pl-5.5">
              <span className="text-sm text-muted-foreground">Free plan · 3 puzzles/day</span>
            </div>
          )}
        </div>

        {isPremium && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleManageSubscription} disabled={portalLoading}>
              <ExternalLink className="mr-2 h-4 w-4" />
              {portalLoading ? 'Opening...' : 'Manage Subscription'}
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
