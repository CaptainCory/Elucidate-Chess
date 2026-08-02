import { LiveVisitorsBadge } from '@/components/LiveVisitorsBadge';
import { AnalyzingSequence } from '@/components/AnalyzingSequence';
import { useState, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ChessPuzzle } from '@/data/chessPuzzles';
import { mapDbPuzzle } from '@/data/chessPuzzles';
import { supabase } from '@/integrations/supabase/client';
import { ChessBoard } from '@/components/ChessBoard';
import { ExploreBoard } from '@/components/ExploreBoard';
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
import { Brain, Crown, Sparkles, Trophy, LogIn, HelpCircle, Plus, Loader2, BookOpen, ChevronRight } from 'lucide-react';
import { THEME_BY_SLUG } from '@/data/themes';
import { MobileNav } from '@/components/MobileNav';
import { ShareButton } from '@/components/ShareButton';
import { ChessQuoteFooter } from '@/components/ChessQuoteFooter';
import { GraduationProgress } from '@/components/GraduationProgress';
import { GraduationCelebration } from '@/components/GraduationCelebration';
import { AchievementToast } from '@/components/AchievementToast';
import { EmailCaptureModal } from '@/components/EmailCaptureModal';
import { PageSEO } from '@/components/PageSEO';

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
    supabase.from('puzzles').select('id, name, fen, previous_fen, difficulty, explanation, themes').eq('id', id).maybeSingle().then(({ data, error }) => {
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
    return <Navigate to="/play" replace />;
  }

  return <PositionView key={`${puzzle.id}-${resetKey}`} puzzle={puzzle} user={user} onReset={() => setResetKey(k => k + 1)} />;
};

// Separate component so the hook resets when puzzle changes via key prop
function PositionView({ puzzle, user, onReset }: { puzzle: ChessPuzzle; user: any; onReset: () => void }) {
  const game = useChessGame(puzzle, onReset);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  // Show email capture after 3rd guest solve
  useEffect(() => {
    if (user) return; // signed-in users skip
    if (localStorage.getItem('email_subscribed') === 'true') return;
    if (game.gameState !== 'result') return;

    const count = parseInt(localStorage.getItem('guest_solves') || '0', 10) + 1;
    localStorage.setItem('guest_solves', String(count));

    // Show on 3rd solve, then every 5 after
    if (count === 3 || (count > 3 && (count - 3) % 5 === 0)) {
      const timer = setTimeout(() => setShowEmailCapture(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [game.gameState, user]);
  const boardOrientation = useMemo(() => {
    try { return new Chess(puzzle.fen).turn() === 'b' ? 'black' : 'white'; } catch { return 'white'; }
  }, [puzzle.fen]);

  // Fetch persisted profile stats from DB
  const { data: profile } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('puzzles_solved, average_score, best_streak, current_streak, current_difficulty, beginner_solved, intermediate_solved, advanced_solved, beginner_avg_score, intermediate_avg_score, advanced_avg_score')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Sibling positions within same difficulty (for prev/next links)
  const { data: siblings } = useQuery({
    queryKey: ['siblings', puzzle.difficulty],
    queryFn: async () => {
      const { data } = await supabase
        .from('puzzles')
        .select('id, name')
        .eq('difficulty', puzzle.difficulty)
        .order('id');
      return (data || []) as Array<{ id: string; name: string }>;
    },
  });

  const idx = siblings?.findIndex((s) => s.id === puzzle.id) ?? -1;
  const prev = idx > 0 ? siblings![idx - 1] : null;
  const next = idx >= 0 && siblings && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const themesText = puzzle.themes?.length ? puzzle.themes.join(', ') : 'tactical';
  const seoTitle = `${puzzle.name} — ${puzzle.difficulty.charAt(0).toUpperCase() + puzzle.difficulty.slice(1)} Chess Position`;
  const seoDesc = `Solve "${puzzle.name}" — a ${puzzle.difficulty} chess position featuring ${themesText}. Explain your reasoning and get AI coaching feedback.`;
  const positionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: puzzle.name,
    about: { '@type': 'Thing', name: 'Chess tactics' },
    educationalLevel: puzzle.difficulty,
    learningResourceType: 'Chess puzzle',
    keywords: [puzzle.difficulty, 'chess puzzle', 'chess tactics', ...(puzzle.themes || [])].join(', '),
    inLanguage: 'en',
    url: `https://elucidatechess.com/position/${puzzle.id}`,
    isPartOf: { '@type': 'WebSite', name: 'Elucidate Chess', url: 'https://elucidatechess.com' },
  };

  return (
    <div className="min-h-screen bg-background">
      <PageSEO title={seoTitle} description={seoDesc} jsonLd={positionJsonLd} jsonLdId={`puzzle-${puzzle.id}`} />
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(38 92% 50% / 0.15), transparent 60%)',
        }}
      />

      <div className="relative container max-w-6xl mx-auto px-3 py-2 lg:px-4 lg:py-4">
        {/* Header */}
        <header className="text-center mb-2 lg:mb-4 animate-fade-in relative">
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
              <LiveVisitorsBadge />
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

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap justify-center lg:justify-start">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/play" className="hover:text-primary">Positions</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="capitalize text-foreground/70">{puzzle.difficulty}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground truncate max-w-[200px]">{puzzle.name}</span>
        </nav>


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
              highScores={
                (profile.current_difficulty ?? 'beginner') === 'beginner'
                  ? ((profile as any).beginner_high_scores ?? 0)
                  : (profile.current_difficulty ?? 'beginner') === 'intermediate'
                    ? ((profile as any).intermediate_high_scores ?? 0)
                    : ((profile as any).advanced_high_scores ?? 0)
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
                <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground text-center leading-tight">
                  {puzzle.name}
                </h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TurnIndicator fen={puzzle.fen} />
                    <DifficultyBadge difficulty={puzzle.difficulty} />
                  </div>
                  <span className="text-sm text-muted-foreground">Position #{puzzle.id}</span>
                  <ShareButton puzzleId={puzzle.id} puzzleName={puzzle.name} />
                </div>

                {game.gameState === 'result' ? (
                  <ExploreBoard
                    startFen={(() => {
                      try {
                        const g = new Chess(puzzle.fen);
                        if (game.selectedMove) g.move(game.selectedMove);
                        return g.fen();
                      } catch {
                        return puzzle.fen;
                      }
                    })()}
                    initialFen={puzzle.fen}
                    initialMoveSan={game.selectedMove ?? undefined}
                    orientation={boardOrientation}
                  />
                ) : (
                  <ChessBoard
                    fen={puzzle.fen}
                    previousFen={puzzle.previousFen}
                    orientation={boardOrientation}
                    interactive={game.gameState === 'thinking' && !game.isDifficultyLocked}
                    onMove={game.handleMove}
                  />
                )}

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
                  <ThinkingInput
                    onSubmit={(t) => {
                      try { localStorage.setItem('ec_first_puzzle_done', '1'); } catch {}
                      game.handleSubmit(t);
                    }}
                    isLoading={false}
                    moveSelected={!!game.selectedMove}
                    skipTyping={!user && (() => {
                      try { return localStorage.getItem('ec_first_puzzle_done') !== '1'; } catch { return false; }
                    })()}
                  />
                )}

                {game.gameState === 'analyzing' && <AnalyzingSequence stage={game.analyzeStage} />}

                {game.gameState === 'result' && game.analysis && (
                  <AnalysisResult
                    analysis={game.analysis}
                    onNext={game.handleNext}
                    onRetry={game.handleRetry}
                    puzzleContext={{
                      fen: puzzle.fen,
                      puzzleId: puzzle.id,
                      explanation: puzzle.explanation,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })()}

        {/* Internal links: themes + sibling nav */}
        <section className="mt-10 max-w-3xl mx-auto space-y-6">
          {puzzle.themes && puzzle.themes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Tactical themes in this position</h3>
              <div className="flex flex-wrap gap-2">
                {puzzle.themes.map((slug) => {
                  const t = THEME_BY_SLUG[slug];
                  const label = t?.title ?? slug;
                  return (
                    <Link
                      key={slug}
                      to={`/positions/theme/${slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title={`Practice more ${label} positions`}
                    >
                      {label}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                New to these patterns? <Link to="/vocabulary" className="text-primary hover:underline">Learn the chess tactics vocabulary →</Link>
              </p>
            </div>
          )}

          <div className="flex items-stretch justify-between gap-3 pt-4 border-t border-border/50">
            {prev ? (
              <Link to={`/position/${prev.id}`} className="flex-1 chess-card p-3 rounded-xl hover:border-primary/40 border border-border/50 transition-colors">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">← Previous {puzzle.difficulty}</div>
                <div className="text-sm font-semibold text-foreground truncate mt-0.5">{prev.name}</div>
              </Link>
            ) : <div className="flex-1" />}
            <Link to="/play" className="self-center px-4 py-2 rounded-lg bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
              All positions
            </Link>
            {next ? (
              <Link to={`/position/${next.id}`} className="flex-1 chess-card p-3 rounded-xl hover:border-primary/40 border border-border/50 transition-colors text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Next {puzzle.difficulty} →</div>
                <div className="text-sm font-semibold text-foreground truncate mt-0.5">{next.name}</div>
              </Link>
            ) : <div className="flex-1" />}
          </div>
        </section>

        <ChessQuoteFooter />
      </div>

      <UpgradeOverlay open={game.showUpgradeOverlay} onClose={() => game.setShowUpgradeOverlay(false)} />
      {game.graduatedTo && (
        <GraduationCelebration
          newDifficulty={game.graduatedTo}
          onDismiss={() => game.setGraduatedTo(null)}
        />
      )}
      {game.newAchievements.length > 0 && (
        <AchievementToast
          achievementKeys={game.newAchievements}
          onDone={() => game.setNewAchievements([])}
        />
      )}
      <AuthModal open={showSignIn} onOpenChange={setShowSignIn} />
      <EmailCaptureModal open={showEmailCapture} onOpenChange={setShowEmailCapture} />
    </div>
  );
}

export default PositionPage;
