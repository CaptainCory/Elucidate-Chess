import { useNavigate } from 'react-router-dom';
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
import { LogOut, Crown, CreditCard } from 'lucide-react';

export function UserMenu() {
  const { user, isPremium, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User';
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-12 w-12 rounded-full">
          <Avatar className="h-12 w-12 border-2 border-border">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">{initials}</AvatarFallback>
          </Avatar>
          {isPremium && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
              <Crown className="h-3.5 w-3.5 text-primary-foreground" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              {isPremium && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                  <Crown className="w-2.5 h-2.5" />
                  Premium
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/membership')}>
          <CreditCard className="mr-2 h-4 w-4" />
          {isPremium ? 'Premium Membership' : 'Membership'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
