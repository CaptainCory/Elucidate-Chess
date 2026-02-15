import { useState, useCallback } from 'react';
import { ChessBoard } from '@/components/ChessBoard';
import { TurnIndicator } from '@/components/TurnIndicator';
import { ThinkingInput } from '@/components/ThinkingInput';
import { AnalysisResult, AnalysisData } from '@/components/AnalysisResult';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { ProgressStats } from '@/components/ProgressStats';
import { getRandomPuzzle, getNextDifficulty, ChessPuzzle } from '@/data/chessPuzzles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Brain, Crown, Sparkles } from 'lucide-react';

type GameState = 'thinking' | 'analyzing' | 'result';

const Index = () => {
  const [currentPuzzle, setCurrentPuzzle] = useState<ChessPuzzle>(() => getRandomPuzzle());
  const [gameState, setGameState] = useState<GameState>('thinking');
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [solvedPuzzles, setSolvedPuzzles] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState<ChessPuzzle['difficulty']>('beginner');
  const [selectedMove, setSelectedMove] = useState<string | null>(null);

  const averageScore = scores.length > 0 
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
    : 0;

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
    
    const nextPuzzle = getRandomPuzzle(newSolvedPuzzles, newDifficulty);
    setCurrentPuzzle(nextPuzzle);
    setAnalysis(null);
    setSelectedMove(null);
    setGameState('thinking');
  }, [analysis, currentDifficulty, currentPuzzle.id, solvedPuzzles]);

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
          <div className="flex items-center justify-center gap-3 mb-3">
            <Crown className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground">
              Chess Mind
            </h1>
            <Sparkles className="w-8 h-8 text-accent" />
          </div>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Sharpen your chess thinking. Drag pieces to make your move, explain your reasoning, and receive AI-powered feedback.
          </p>
        </header>

        {/* Progress Stats */}
        <div className="mb-8 max-w-md mx-auto animate-slide-up">
          <ProgressStats 
            puzzlesSolved={solvedPuzzles.length} 
            averageScore={averageScore} 
            streak={streak} 
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Chess Board Section */}
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TurnIndicator fen={currentPuzzle.fen} />
                <DifficultyBadge difficulty={currentPuzzle.difficulty} />
              </div>
              <span className="text-sm text-muted-foreground">
                #{solvedPuzzles.length + 1}
              </span>
            </div>
            
            <ChessBoard 
              fen={currentPuzzle.fen} 
              orientation="white"
              interactive={gameState === 'thinking'}
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
                {gameState === 'thinking' && 'What\'s the best move?'}
                {gameState === 'analyzing' && 'Analyzing your response...'}
                {gameState === 'result' && 'Analysis Complete'}
              </h2>
            </div>

            {gameState === 'thinking' && (
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
    </div>
  );
};

export default Index;
