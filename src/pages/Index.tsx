import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChessBoard } from '@/components/ChessBoard';
import { TurnIndicator } from '@/components/TurnIndicator';
import { ThinkingInput } from '@/components/ThinkingInput';
import { AnalysisResult, AnalysisData } from '@/components/AnalysisResult';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { ProgressStats } from '@/components/ProgressStats';
import { PlanBadge } from '@/components/PlanBadge';
import { UserMenu } from '@/components/UserMenu';
import { UpgradeOverlay } from '@/components/UpgradeOverlay';
import { getRandomPuzzle, getNextDifficulty, ChessPuzzle } from '@/data/chessPuzzles';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Brain, Crown, Sparkles, Trophy } from 'lucide-react';

const DAILY_PUZZLE_LIMIT = 3;

const getDailyKey = () => `chess_daily_${new Date().toISOString().slice(0, 10)}`;

const getDailySolvedCount = (): number => {
  try {
    return parseInt(localStorage.getItem(getDailyKey()) || '0', 10);
  } catch { return 0; }
};

const incrementDailySolved = () => {
  try {
    const key = getDailyKey();
    localStorage.setItem(key, String(getDailySolvedCount() + 1));
  } catch {}
};

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
  const [showUpgradeOverlay, setShowUpgradeOverlay] = useState(false);
  const [dailySolved, setDailySolved] = useState(getDailySolvedCount);

  const averageScore = scores.length > 0 
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
    : 0;

  // Daily limit applies to all non-premium users (signed in or not)
  const isLimited = !isPremium && dailySolved >= DAILY_PUZZLE_LIMIT;

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
      const newScores = [...scores, analysisResult.score];
      setScores(newScores);
      
      let newStreak: number;
      if (analysisResult.score >= 70) {
        newStreak = streak + 1;
        setStreak(newStreak);
      } else {
        newStreak = 0;
        setStreak(0);
      }

      // Persist stats to DB for signed-in users
      if (user) {
        const avgScore = Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length);
        const newSolvedCount = solvedPuzzles.length + 1;
        supabase
          .from('profiles')
          .update({
            puzzles_solved: newSolvedCount,
            average_score: avgScore,
            best_streak: Math.max(newStreak, streak),
          })
          .eq('user_id', user.id)
          .then(({ error }) => {
            if (error) console.error('Failed to update stats:', error);
          });
      }

      setGameState('result');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze your response. Please try again.');
      setGameState('thinking');
    }
  }, [currentPuzzle, selectedMove, scores, streak, solvedPuzzles, user]);

  const handleNext = useCallback(() => {
    const newDifficulty = analysis ? getNextDifficulty(currentDifficulty, analysis.score) : currentDifficulty;
    setCurrentDifficulty(newDifficulty);
    
    const newSolvedPuzzles = [...solvedPuzzles, currentPuzzle.id];
    setSolvedPuzzles(newSolvedPuzzles);

    // Track daily usage for all non-premium users
    if (!isPremium) {
      incrementDailySolved();
      const newDaily = getDailySolvedCount();
      setDailySolved(newDaily);
      if (newDaily >= DAILY_PUZZLE_LIMIT) {
        setShowUpgradeOverlay(true);
        return;
      }
    }
    
    const nextPuzzle = getRandomPuzzle(newSolvedPuzzles, newDifficulty);
    setCurrentPuzzle(nextPuzzle);
    setAnalysis(null);
    setSelectedMove(null);
    setGameState('thinking');
  }, [analysis, currentDifficulty, currentPuzzle.id, solvedPuzzles, isPremium]);

  const remaining = DAILY_PUZZLE_LIMIT - dailySolved;

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
            <div className="flex items-center gap-3">
              <PlanBadge />
              <Link to="/leaderboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium text-muted-foreground hover:text-foreground">
                <Trophy className="w-4 h-4 text-primary" />
                Leaderboard
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Crown className="w-10 h-10 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground">
                Elucidate Chess
              </h1>
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <div>
              {user && <UserMenu />}
            </div>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Sharpen your chess thinking. Drag pieces to make your move, explain your reasoning, and receive AI-powered feedback.
          </p>
          {!isPremium && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
              <span className="text-xs font-medium text-muted-foreground">
                {remaining > 0
                  ? `${remaining} puzzle${remaining !== 1 ? 's' : ''} remaining today`
                  : 'Daily limit reached'}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: DAILY_PUZZLE_LIMIT }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${i < dailySolved ? 'bg-primary scale-125' : 'bg-muted-foreground/30 scale-100'}`}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            </div>
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
              interactive={gameState === 'thinking' && !isLimited}
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
                {isLimited && 'Daily limit reached'}
                {!isLimited && gameState === 'thinking' && "What's the best move?"}
                {gameState === 'analyzing' && 'Analyzing your response...'}
                {gameState === 'result' && 'Analysis Complete'}
              </h2>
            </div>

            {isLimited && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  You've reached your daily limit of {DAILY_PUZZLE_LIMIT} puzzles.
                </p>
                <button
                  onClick={() => setShowUpgradeOverlay(true)}
                  className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  Upgrade to Premium
                </button>
              </div>
            )}

            {!isLimited && gameState === 'thinking' && (
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
          <p>Powered by AI • Practice Makes Progress</p>
        </footer>
      </div>

      <UpgradeOverlay open={showUpgradeOverlay} onClose={() => setShowUpgradeOverlay(false)} />
    </div>
  );
};

export default Index;
