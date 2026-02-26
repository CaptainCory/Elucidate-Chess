import { useState, useCallback } from 'react';
import { ChessBoard } from '@/components/ChessBoard';
import { TurnIndicator } from '@/components/TurnIndicator';
import { ThinkingInput } from '@/components/ThinkingInput';
import { AnalysisResult, AnalysisData } from '@/components/AnalysisResult';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { ProgressStats } from '@/components/ProgressStats';
import { PlanBadge } from '@/components/PlanBadge';
import { UserMenu } from '@/components/UserMenu';
import { AuthModal } from '@/components/AuthModal';
import { getRandomPuzzle, getNextDifficulty, ChessPuzzle } from '@/data/chessPuzzles';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Brain, Crown, Sparkles } from 'lucide-react';

const FREE_PUZZLE_LIMIT = 3;

type GameState = 'thinking' | 'analyzing' | 'result';

const Index = () => {
  const { user, isPremium } = useAuth();
  const [currentPuzzle, setCurrentPuzzle] = useState<ChessPuzzle>(() => getRandomPuzzle());
  const [gameState, setGameState] = useState<GameState>('thinking');
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [solvedPuzzles, setSolvedPuzzles] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState<ChessPuzzle['difficulty']>('beginner');
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const averageScore = scores.length > 0 
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
    : 0;

  // Check if user has hit the free puzzle limit
  const isGated = !user && solvedPuzzles.length >= FREE_PUZZLE_LIMIT;
  // Signed-in but not premium: allow limited extra puzzles per session (10 total)
  const isSessionLimited = user && !isPremium && solvedPuzzles.length >= 10;

  const handleMove = useCallback((move: string) => {
    setSelectedMove(move);
  }, []);

  const handleSubmit = useCallback(async (thinking: string) => {
    if (!selectedMove) return;
    setGameState('analyzing');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-chess', {
        body: {
          fen: currentPuzzle.fen,
          userThinking: thinking,
          userMove: selectedMove,
          bestMove: currentPuzzle.bestMove,
          puzzleExplanation: currentPuzzle.explanation,
          puzzleDifficulty: currentPuzzle.difficulty,
        },
      });

      if (error) throw error;

      const analysisResult: AnalysisData = {
        score: data.score,
        moveCorrect: data.moveCorrect,
        userMove: selectedMove,
        bestMove: currentPuzzle.bestMove,
        reasoningFeedback: data.reasoningFeedback,
        keyInsights: data.keyInsights || [],
        improvement: data.improvement || '',
        positionVerification: data.positionVerification,
      };

      setAnalysis(analysisResult);
      setScores(prev => [...prev, analysisResult.score]);
      
      if (analysisResult.score >= 70) {
        setStreak(prev => prev + 1);
      } else {
        setStreak(0);
      }

      setGameState('result');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze your response. Please try again.');
      setGameState('thinking');
    }
  }, [currentPuzzle, selectedMove]);

  const handleNext = useCallback(() => {
    const newDifficulty = analysis ? getNextDifficulty(currentDifficulty, analysis.score) : currentDifficulty;
    setCurrentDifficulty(newDifficulty);
    
    const newSolvedPuzzles = [...solvedPuzzles, currentPuzzle.id];
    setSolvedPuzzles(newSolvedPuzzles);

    // Check gate after solving
    if (!user && newSolvedPuzzles.length >= FREE_PUZZLE_LIMIT) {
      setShowAuthModal(true);
      return;
    }

    if (user && !isPremium && newSolvedPuzzles.length >= 10) {
      toast.info("You've reached your session limit. Upgrade to premium for unlimited puzzles!");
      return;
    }
    
    const nextPuzzle = getRandomPuzzle(newSolvedPuzzles, newDifficulty);
    setCurrentPuzzle(nextPuzzle);
    setAnalysis(null);
    setSelectedMove(null);
    setGameState('thinking');
  }, [analysis, currentDifficulty, currentPuzzle.id, solvedPuzzles, user, isPremium]);

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow effect */}
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
            <PlanBadge />
            <div className="flex items-center gap-3">
              <Crown className="w-10 h-10 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground">
                Elucidate Chess
              </h1>
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <div className="w-24 flex justify-end">
              <UserMenu />
            </div>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Sharpen your chess thinking. Drag pieces to make your move, explain your reasoning, and receive AI-powered feedback.
          </p>
          {!user && (
            <p className="text-xs text-muted-foreground mt-2">
              {FREE_PUZZLE_LIMIT - solvedPuzzles.length > 0
                ? `${FREE_PUZZLE_LIMIT - solvedPuzzles.length} free puzzle${FREE_PUZZLE_LIMIT - solvedPuzzles.length !== 1 ? 's' : ''} remaining`
                : 'Sign in to continue'}
            </p>
          )}
        </header>

        {/* Progress Stats */}
        <div className="mb-8 max-w-md mx-auto">
          <ProgressStats 
            puzzlesSolved={solvedPuzzles.length} 
            averageScore={averageScore} 
            streak={streak} 
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Chess Board Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TurnIndicator fen={currentPuzzle.fen} />
                <DifficultyBadge difficulty={currentPuzzle.difficulty} />
              </div>
              <span className="text-sm text-muted-foreground">
                Puzzle #{currentPuzzle.id}
              </span>
            </div>
            
            <ChessBoard 
              fen={currentPuzzle.fen} 
              previousFen={currentPuzzle.previousFen}
              orientation="white"
              interactive={gameState === 'thinking' && !isGated && !isSessionLimited}
              onMove={handleMove}
            />

            {currentPuzzle.name && (
              <p className="text-center text-sm text-muted-foreground font-medium">
                {currentPuzzle.name}
              </p>
            )}
          </div>

          {/* Interaction Section */}
          <div className="chess-card p-6 space-y-6">
            <div className="flex items-center gap-2 text-foreground">
              <Brain className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold font-display">
                {isGated && 'Sign in to continue'}
                {isSessionLimited && 'Session limit reached'}
                {!isGated && !isSessionLimited && gameState === 'thinking' && "What's the best move?"}
                {gameState === 'analyzing' && 'Analyzing your response...'}
                {gameState === 'result' && 'Analysis Complete'}
              </h2>
            </div>

            {isGated && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  You've solved {FREE_PUZZLE_LIMIT} free puzzles! Sign in to keep improving.
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  Sign in to continue
                </button>
              </div>
            )}

            {isSessionLimited && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  You've reached your session limit. Upgrade to premium for unlimited puzzles!
                </p>
              </div>
            )}

            {!isGated && !isSessionLimited && gameState === 'thinking' && (
              <ThinkingInput 
                onSubmit={handleSubmit} 
                isLoading={false}
                moveSelected={!!selectedMove}
              />
            )}

            {gameState === 'analyzing' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <p className="text-muted-foreground">
                  Analyzing your chess thinking...
                </p>
              </div>
            )}

            {gameState === 'result' && analysis && (
              <AnalysisResult 
                analysis={analysis} 
                onNext={handleNext} 
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Powered by AI • Practice makes perfect</p>
        </footer>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
};

export default Index;
