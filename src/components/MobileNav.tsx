import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, HelpCircle, Swords, Trophy, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/UserMenu';

interface MobileNavProps {
  user: any;
  onSignIn: () => void;
}

export function MobileNav({ user, onSignIn }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
        aria-label="Toggle menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed top-16 left-4 right-4 z-50 p-4 rounded-xl bg-card border border-border shadow-lg animate-scale-in space-y-2">
            <Link
              to="/how-it-works"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="w-4 h-4 text-primary" />
              How It Works
            </Link>
            <Link
              to="/themes"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <Swords className="w-4 h-4 text-primary" />
              Themes
            </Link>
            <Link
              to="/leaderboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <Trophy className="w-4 h-4 text-primary" />
              Leaderboard
            </Link>
            <div className="border-t border-border pt-2 mt-2">
              {user ? (
                <UserMenu />
              ) : (
                <Button variant="outline" size="sm" className="w-full" onClick={() => { onSignIn(); setOpen(false); }}>
                  <LogIn className="w-4 h-4 mr-1" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
