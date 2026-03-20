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
import { HintTimer } from '@/components/HintTimer';
import { AnalysisResult } from '@/components/AnalysisResult';
import { DifficultyBadge } from '@/components/DifficultyBadge';

import { PlanBadge } from '@/components/PlanBadge';
import { UserMenu } from '@/components/UserMenu';
import { UpgradeOverlay } from '@/components/UpgradeOverlay';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { useChessGame } from '@/hooks/useChessGame';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, Crown, Sparkles, Trophy, LogIn, HelpCircle, Plus, Loader2, BookOpen } from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { ShareButton } from '@/components/ShareButton';
import { ChessQuoteFooter } from '@/components/ChessQuoteFooter';
import { GraduationProgress } from '@/components/GraduationProgress';
import { GraduationCelebration } from '@/components/GraduationCelebration';

const PositionPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [puzzle, setPuzzle] = useState<ChessPuzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetKey, setResetKey] = useState(0);
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

  return <PositionView key={`${puzzle.id}-${resetKey}`} puzzle={puzzle} user={user} onReset={() => setResetKey(k => k + 1)} />;
};

// Separate component so the hook resets when puzzle changes via key prop
function PositionView({ puzzle, user, onReset }: { puzzle: ChessPuzzle; user: any; onReset: () => void }) {
  const game = useChessGame(puzzle, onReset);
  const [showSignIn, setShowSignIn] = useState(false);

  // Fetch persisted profile stats from DB
  const { data: profile } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('puzzles_solved, average_score, best_streak, current_difficulty, beginner_solved, intermediate_solved, advanced_solved, beginner_avg_score, intermediate_avg_score, advanced_avg_score')
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/vocabulary"
                    className="hidden lg:flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <BookOpen className="w-4 h-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Vocabulary</TooltipContent>
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
                Free · Beginner only
              </span>
            </div>
          )}
        </header>

        {/* Progress Stats - hidden on mobile */}
        <div className="mb-4 lg:mb-8 max-w-md mx-auto hidden md:block">
          <ProgressStats puzzlesSolved={profile?.puzzles_solved ?? 0} averageScore={profile?.average_score ?? game.averageScore} streak={Math.max(profile?.best_streak ?? 0, game.streak)} />
        </div>

        {/* Graduation Progress */}
        {user && profile && (
          <div className="mb-4 lg:mb-6 max-w-md mx-auto">
            <GraduationProgress
              difficulty={profile.current_difficulty ?? 'beginner'}
              solved={
                (profile.current_difficulty ?? 'beginner') === 'beginner'
                  ? (profile.beginner_solved ?? 0)
                  : (profile.current_difficulty ?? 'beginner') === 'intermediate'
                    ? (profile.intermediate_solved ?? 0)
                    : (profile.advanced_solved ?? 0)
              }
              avgScore={
                (profile.current_difficulty ?? 'beginner') === 'beginner'
                  ? (profile.beginner_avg_score ?? 0)
                  : (profile.current_difficulty ?? 'beginner') === 'intermediate'
                    ? (profile.intermediate_avg_score ?? 0)
                    : (profile.advanced_avg_score ?? 0)
              }
              isPremium={game.isPremium}
            />
          </div>
        )}

        {/* Main Content */}
        {(() => {
          // Determine which section should have the attention guide
          const boardFocused = game.gameState === 'thinking' && !game.selectedMove && !game.isDifficultyLocked;
          const inputFocused = game.gameState === 'thinking' && !!game.selectedMove && !game.isDifficultyLocked;
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
                  interactive={game.gameState === 'thinking' && !game.isDifficultyLocked}
                  onMove={game.handleMove}
                />

                <HintTimer
                  active={
                    puzzle.difficulty === 'beginner' &&
                    game.gameState === 'thinking' &&
                    !game.selectedMove &&
                    !game.isDifficultyLocked
                  }
                />
              </div>

              {/* Interaction Section */}
              <div className={`chess-card p-6 space-y-6 transition-shadow duration-500 ${inputFocused || resultFocused ? 'focus-guide' : ''}`}>
                <div className="flex items-center gap-2 text-foreground">
                  <Brain className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-semibold font-display">
                    {game.isDifficultyLocked && 'Premium Required'}
                    {!game.isDifficultyLocked && game.gameState === 'thinking' && 'Elucidation'}
                    {game.gameState === 'analyzing' && 'Analyzing your response...'}
                    {game.gameState === 'result' && 'Analysis Complete'}
                  </h2>
                </div>

                {game.isDifficultyLocked && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <Crown className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground">This position requires Premium. Upgrade to unlock intermediate and advanced puzzles.</p>
                    <button
                      onClick={() => game.setShowUpgradeOverlay(true)}
                      className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Upgrade to Premium
                    </button>
                  </div>
                )}

                {!game.isDifficultyLocked && game.gameState === 'thinking' && (
                  <ThinkingInput onSubmit={game.handleSubmit} isLoading={false} moveSelected={!!game.selectedMove} />
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
      {game.graduatedTo && (
        <GraduationCelebration
          newDifficulty={game.graduatedTo}
          onDismiss={() => game.setGraduatedTo(null)}
        />
      )}
      <AuthModal open={showSignIn} onOpenChange={setShowSignIn} />
    </div>
  );
}

export default PositionPage;
