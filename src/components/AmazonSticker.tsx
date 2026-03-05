import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

const AFFILIATE_URL = 'https://www.amazon.com/dp/B07KBF9LXS?tag=woodies-20';

export function AmazonSticker() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className="relative bg-card border border-border rounded-xl shadow-lg p-3 w-56 group">
        <button
          onClick={() => setDismissed(true)}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-destructive hover:border-destructive transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>

        <a
          href={AFFILIATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block space-y-2"
        >
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Recommended</p>
          <div className="flex items-start gap-2">
            <span className="text-2xl">♟️</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">Premium Chess Board</p>
              <p className="text-xs text-muted-foreground mt-0.5">Level up your OTB game</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            <span>View on Amazon</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </a>
      </div>
    </div>
  );
}
