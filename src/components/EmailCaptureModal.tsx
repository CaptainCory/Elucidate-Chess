import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Crown, Mail, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailCaptureModal({ open, onOpenChange }: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('email_subscribers').insert({ email: trimmed });
    setLoading(false);

    if (error) {
      if (error.code === '23505') {
        toast.info("You're already subscribed!");
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } else {
      toast.success('Subscribed! Check your inbox for daily positions.');
      localStorage.setItem('email_subscribed', 'true');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogTitle className="sr-only">Subscribe to daily positions</DialogTitle>
        <div className="flex flex-col items-center text-center space-y-4 py-2">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <Crown className="w-7 h-7 text-primary" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold font-display text-foreground">
              You're getting good! ♟️
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Get a fresh chess position in your inbox every morning. Free forever — sharpen your thinking daily.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 bg-secondary border-border"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={loading} className="shrink-0">
              {loading ? '...' : 'Subscribe'}
            </Button>
          </form>

          <button
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            No thanks, maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
