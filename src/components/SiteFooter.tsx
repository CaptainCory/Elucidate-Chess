import { Link } from 'react-router-dom';
import { THEMES } from '@/data/themes';

// Sitemap-style internal-link footer rendered above ChessQuoteFooter on key pages.
export const SiteFooter = () => {
  return (
    <nav aria-label="Site map" className="mt-16 border-t border-border/40 pt-10 pb-6">
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
  );
};
