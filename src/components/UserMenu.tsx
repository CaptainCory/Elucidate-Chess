import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Crown } from 'lucide-react';

export function UserMenu() {
  const { user, isPremium, signOut } = useAuth();

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User';
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex items-center gap-3">
      {isPremium && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
          <Crown className="w-3 h-3" />
          Premium
        </span>
      )}
      <Avatar className="w-8 h-8 border border-border">
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">{initials}</AvatarFallback>
      </Avatar>
      <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-foreground">
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
}
