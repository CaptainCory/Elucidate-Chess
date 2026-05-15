import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getRandomQuote } from '@/data/chessQuotes';
import { THEMES } from '@/data/themes';

export const ChessQuoteFooter = () => {
  const quote = useMemo(() => getRandomQuote(), []);

  return (
    <footer className="mt-12 pb-8">
      {/* Sitemap-style link grid for SEO + UX */}
      <nav aria-label="Site map" className="border-t border-border/40 pt-10 pb-10">
        <div className="max-w-5xl mx-auto px-6 grid gap-8 sm:grid-cols-2 md:grid-cols-4 text-sm">
          <div>
            <h3 className="font-display font-semibold text-foreground mb-3">Practice</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/play" className="hover:text-primary transition-colors">Solve chess positions</Link></li>
              <li><Link to="/daily" className="hover:text-primary transition-colors">Daily chess challenge</Link></li>
              <li><Link to="/leaderboard" className="hover:text-primary transition-colors">Top chess thinkers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground mb-3">Learn</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/how-it-works" className="hover:text-primary transition-colors">How the reasoning method works</Link></li>
              <li><Link to="/vocabulary" className="hover:text-primary transition-colors">Chess tactics vocabulary</Link></li>
              <li><Link to="/quotes" className="hover:text-primary transition-colors">Chess quotes</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground mb-3">Tactical Themes</h3>
            <ul className="space-y-2 text-muted-foreground">
              {THEMES.slice(0, 6).map((t) => (
                <li key={t.slug}>
                  <Link to={`/positions/theme/${t.slug}`} className="hover:text-primary transition-colors">
                    {t.title} positions
                  </Link>
                </li>
              ))}
              <li><Link to="/vocabulary" className="text-primary hover:underline">All 16 themes →</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground mb-3">Account</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/membership" className="hover:text-primary transition-colors">Membership</Link></li>
              <li><Link to="/profile" className="hover:text-primary transition-colors">Your profile</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="text-center text-muted-foreground space-y-3">
        <blockquote className="max-w-xl mx-auto italic text-lg leading-relaxed">
          "{quote.text}"
        </blockquote>
        <p className="text-sm font-semibold text-primary/70">— {quote.author}</p>
        <p className="text-xs pt-2">Powered by AI • Practice Makes Progress</p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <Link to="/quotes" className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">
            Quotes
          </Link>
          <span className="text-muted-foreground/20">•</span>
          <Link to="/admin" className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">Admin</Link>
        </div>
      </div>
    </footer>
  );
};
