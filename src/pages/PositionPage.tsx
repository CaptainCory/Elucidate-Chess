import { useState, useEffect } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ChessPuzzle } from '@/data/chessPuzzles';
import { mapDbPuzzle } from '@/data/chessPuzzles';
import { supabase } from '@/integrations/supabase/client';
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
import { Brain, Crown, Sparkles, Trophy, LogIn, HelpCircle, Plus, Loader2 } from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { ShareButton } from '@/components/ShareButton';
import { ChessQuoteFooter } from '@/components/ChessQuoteFooter';

const PositionPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [puzzle, setPuzzle] = useState<ChessPuzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    setPuzzle(null);
    supabase.from('puzzles').select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
      if (error || !data) {
        setNotFound(true);
      } else {
        setPuzzle(mapDbPuzzle(data));
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!puzzle || notFound) {
    return <Navigate to="/" replace />;
  }

  return <PositionView key={puzzle.id} puzzle={puzzle} user={user} />;
};

// Separate component so the hook resets when puzzle changes via key prop
function PositionView({ puzzle, user }: { puzzle: ChessPuzzle; user: any }) {
  const game = useChessGame(puzzle);
  const [showSignIn, setShowSignIn] = useState(false);

  // Fetch persisted profile stats from DB
  const { data: profile } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('puzzles_solved, average_score, best_streak')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(38 92% 50% / 0.15), transparent 60%)',
        }}
      />

      <div className="relative container max-w-6xl mx-auto px-3 py-4 lg:px-4 lg:py-8">
        {/* Header */}
        <header className="text-center mb-4 lg:mb-8 animate-fade-in relative">
          <div className="flex items-center justify-between mb-3">
            {/* Mobile: hamburger + plan badge */}
            <div className="flex items-center gap-2 lg:gap-3">
              <MobileNav user={user} onSignIn={() => setShowSignIn(true)} />
              <PlanBadge />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/how-it-works"
                    className="hidden lg:flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>How It Works</TooltipContent>
              </Tooltip>
            </div>
            {/* Title - compact on mobile */}
            <div className="flex items-center gap-2 lg:gap-3">
              <Crown className="w-7 h-7 lg:w-10 lg:h-10 text-primary" />
              <Link
                to="/"
                className="text-xl md:text-3xl lg:text-5xl font-bold font-display text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Elucidate Chess
              </Link>
              <Sparkles className="w-5 h-5 lg:w-8 lg:h-8 text-accent hidden sm:block" />
            </div>
            {/* Desktop nav links + auth */}
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/leaderboard"
                    className="hidden lg:flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Trophy className="w-4 h-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Leaderboard</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/add-puzzle"
                    className="hidden lg:flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Add Puzzle</TooltipContent>
              </Tooltip>
              <div className="hidden lg:block">
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
          </div>


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

        {/* Progress Stats - hidden on mobile */}
        <div className="mb-4 lg:mb-8 max-w-md mx-auto hidden md:block">
          <ProgressStats puzzlesSolved={(profile?.puzzles_solved ?? 0) + game.solvedPuzzles.length} averageScore={profile?.average_score ?? game.averageScore} streak={Math.max(profile?.best_streak ?? 0, game.streak)} />
        </div>

        {/* Main Content */}
        {(() => {
          // Determine which section should have the attention guide
          const boardFocused = game.gameState === 'thinking' && !game.selectedMove && !game.isLimited;
          const inputFocused = game.gameState === 'thinking' && !!game.selectedMove && !game.isLimited;
          const resultFocused = game.gameState === 'result';

          return (
            <div className="grid lg:grid-cols-2 gap-8 items-start relative z-0">
              {/* Chess Board */}
              <div className={`space-y-4 rounded-xl transition-shadow duration-500 ${boardFocused ? 'focus-guide p-2 -m-2' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TurnIndicator fen={puzzle.fen} />
                    <DifficultyBadge difficulty={puzzle.difficulty} />
                  </div>
                  <span className="text-sm text-muted-foreground">Position #{puzzle.id}</span>
                  <ShareButton puzzleId={puzzle.id} puzzleName={puzzle.name} />
                </div>

                <ChessBoard
                  fen={puzzle.fen}
                  previousFen={puzzle.previousFen}
                  orientation="white"
                  interactive={game.gameState === 'thinking' && !game.isLimited}
                  onMove={game.handleMove}
                />

                {/* Theme Tags */}
                {puzzle.themes && puzzle.themes.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {puzzle.themes.map((theme) => (
                      <Link
                        key={theme}
                        to="/themes"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                      >
                        <Swords className="w-3 h-3" />
                        {theme.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Interaction Section */}
              <div className={`chess-card p-6 space-y-6 transition-shadow duration-500 ${inputFocused || resultFocused ? 'focus-guide' : ''}`}>
                <div className="flex items-center gap-2 text-foreground">
                  <Brain className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-semibold font-display">
                    {game.isLimited && 'Daily limit reached'}
                    {!game.isLimited && game.gameState === 'thinking' && 'Elucidation'}
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
                  <ThinkingInput onSubmit={game.handleSubmit} isLoading={false} moveSelected={!!game.selectedMove} themes={puzzle.themes} />
                )}

                {game.gameState === 'analyzing' && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <p className="text-muted-foreground">Analyzing your chess thinking...</p>
                  </div>
                )}

                {game.gameState === 'result' && game.analysis && (
                  <AnalysisResult
                    analysis={game.analysis}
                    onNext={game.handleNext}
                    puzzleContext={{
                      fen: puzzle.fen,
                      bestMove: puzzle.bestMove,
                      explanation: puzzle.explanation,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })()}

        <ChessQuoteFooter />
      </div>

      <UpgradeOverlay open={game.showUpgradeOverlay} onClose={() => game.setShowUpgradeOverlay(false)} />
      <AuthModal open={showSignIn} onOpenChange={setShowSignIn} />
    </div>
  );
}

export default PositionPage;
