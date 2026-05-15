import { LiveVisitorsBadge } from '@/components/LiveVisitorsBadge';
import { Link } from 'react-router-dom';
import { Leaderboard } from '@/components/Leaderboard';
import { PlanBadge } from '@/components/PlanBadge';
import { UserMenu } from '@/components/UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Sparkles, ArrowLeft } from 'lucide-react';
import { ChessQuoteFooter } from '@/components/ChessQuoteFooter';
import { PageSEO } from '@/components/PageSEO';

const LeaderboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <PageSEO
        title="Leaderboard — Elucidate Chess"
        description="Top Elucidate Chess players ranked by total solves, average reasoning score, and current streak."
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(38 92% 50% / 0.15), transparent 60%)',
        }}
      />

      <main className="relative container max-w-3xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <Link to="/play" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Puzzles</span>
          </Link>
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" />
            <a href="/" className="text-lg font-bold font-display text-foreground hover:text-primary transition-colors cursor-pointer">Elucidate Chess</a>
            <LiveVisitorsBadge />
          </div>
          <div className="flex items-center gap-3">
            <PlanBadge />
            {user && <UserMenu />}
          </div>
        </header>

        <Leaderboard />
        <ChessQuoteFooter />
      </main>
    </div>
  );
};

export default LeaderboardPage;
