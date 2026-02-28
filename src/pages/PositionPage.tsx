import { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { chessPuzzles } from '@/data/chessPuzzles';
import { ChessBoard } from '@/components/ChessBoard';
import { TurnIndicator } from '@/components/TurnIndicator';
import { ThinkingInput } from '@/components/ThinkingInput';
import { AnalysisResult } from '@/components/AnalysisResult';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { ProgressStats } from '@/components/ProgressStats';
import { PlanBadge } from '@/components/PlanBadge';
import { UserMenu } from '@/components/UserMenu';
import { UpgradeOverlay } from '@/components/UpgradeOverlay';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { useChessGame } from '@/hooks/useChessGame';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, Crown, Sparkles, Trophy, LogIn, HelpCircle } from 'lucide-react';

const PositionPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const puzzle = chessPuzzles.find((p) => p.id === id);

  if (!puzzle) {
    return <Navigate to="/" replace />;
  }

  return <PositionView key={puzzle.id} puzzle={puzzle} user={user} />;
};

// Separate component so the hook resets when puzzle changes via key prop
function PositionView({ puzzle, user }: { puzzle: (typeof chessPuzzles)[number]; user: any }) {
  const game = useChessGame(puzzle);
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(38 92% 50% / 0.15), transparent 60%)',
        }}
      />

      <div className="relative container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <PlanBadge />
            </div>
            <div className="flex items-center gap-3">
              <Crown className="w-10 h-10 text-primary" />
              <Link
                to="/"
                className="text-4xl md:text-5xl font-bold font-display text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Elucidate Chess
              </Link>
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/how-it-works"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="w-4 h-4 text-primary" />
                How It Works
              </Link>
              <Link
                to="/leaderboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Trophy className="w-4 h-4 text-primary" />
                Leaderboard
              </Link>
              {user ? (
                <UserMenu />
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowSignIn(true)}>
                  <LogIn className="w-4 h-4 mr-1" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Sharpen your chess thinking. Drag pieces to make your move, explain your reasoning, and receive AI-powered feedback.
          </p>
          {!game.isPremium && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
              <span className="text-xs font-medium text-muted-foreground">
                {game.remaining > 0
                  ? `${game.remaining} position${game.remaining !== 1 ? 's' : ''} remaining today`
                  : 'Daily limit reached'}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: game.DAILY_PUZZLE_LIMIT }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${i < game.dailySolved ? 'bg-primary scale-125' : 'bg-muted-foreground/30 scale-100'}`}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Progress Stats */}
        <div className="mb-8 max-w-md mx-auto">
          <ProgressStats puzzlesSolved={game.solvedPuzzles.length} averageScore={game.averageScore} streak={game.streak} />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Chess Board */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TurnIndicator fen={puzzle.fen} />
                <DifficultyBadge difficulty={puzzle.difficulty} />
              </div>
              <span className="text-sm text-muted-foreground">Position #{puzzle.id}</span>
            </div>

            <ChessBoard
              fen={puzzle.fen}
              previousFen={puzzle.previousFen}
              orientation="white"
              interactive={game.gameState === 'thinking' && !game.isLimited}
              onMove={game.handleMove}
            />

            {puzzle.name && <p className="text-center text-sm text-muted-foreground font-medium">{puzzle.name}</p>}
          </div>

          {/* Interaction Section */}
          <div className="chess-card p-6 space-y-6">
            <div className="flex items-center gap-2 text-foreground">
              <Brain className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold font-display">
                {game.isLimited && 'Daily limit reached'}
                {!game.isLimited && game.gameState === 'thinking' && "What's the best move?"}
                {game.gameState === 'analyzing' && 'Analyzing your response...'}
                {game.gameState === 'result' && 'Analysis Complete'}
              </h2>
            </div>

            {game.isLimited && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">You've reached your daily limit of {game.DAILY_PUZZLE_LIMIT} positions.</p>
                <button
                  onClick={() => game.setShowUpgradeOverlay(true)}
                  className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  Upgrade to Premium
                </button>
              </div>
            )}

            {!game.isLimited && game.gameState === 'thinking' && (
              <ThinkingInput onSubmit={game.handleSubmit} isLoading={false} moveSelected={!!game.selectedMove} />
            )}

            {game.gameState === 'analyzing' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <p className="text-muted-foreground">Analyzing your chess thinking...</p>
              </div>
            )}

            {game.gameState === 'result' && game.analysis && (
              <AnalysisResult analysis={game.analysis} onNext={game.handleNext} />
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Powered by AI • Practice Makes Progress</p>
        </footer>
      </div>

      <UpgradeOverlay open={game.showUpgradeOverlay} onClose={() => game.setShowUpgradeOverlay(false)} />
      <AuthModal open={showSignIn} onOpenChange={setShowSignIn} />
    </div>
  );
}

export default PositionPage;
