import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChessPuzzle, getNextDifficulty, getRandomPuzzle } from '@/data/chessPuzzles';
import { AnalysisData } from '@/components/AnalysisResult';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DAILY_PUZZLE_LIMIT = 3;

const getDailyKey = () => `chess_daily_${new Date().toISOString().slice(0, 10)}`;

const getDailySolvedCount = (): number => {
  try {
    return parseInt(localStorage.getItem(getDailyKey()) || '0', 10);
  } catch { return 0; }
};

const incrementDailySolved = () => {
  try {
    localStorage.setItem(getDailyKey(), String(getDailySolvedCount() + 1));
  } catch {}
};

export type GameState = 'thinking' | 'analyzing' | 'result';

export function useChessGame(puzzle: ChessPuzzle) {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
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

  const isLimited = !isPremium && dailySolved >= DAILY_PUZZLE_LIMIT;
  const remaining = DAILY_PUZZLE_LIMIT - dailySolved;

  const handleMove = useCallback((move: string) => {
    setSelectedMove(move);
  }, []);

  const handleSubmit = useCallback(async (thinking: string) => {
    if (!selectedMove) return;
    setGameState('analyzing');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-chess', {
        body: {
          fen: puzzle.fen,
          userThinking: thinking,
          userMove: selectedMove,
          bestMove: puzzle.bestMove,
          puzzleExplanation: puzzle.explanation,
          puzzleDifficulty: puzzle.difficulty,
        },
      });

      if (error) throw error;
      if (!data || typeof data.score === 'undefined') throw new Error('Invalid analysis response');

      const analysisResult: AnalysisData = {
        score: data.score,
        moveCorrect: data.moveCorrect,
        userMove: selectedMove,
        bestMove: puzzle.bestMove,
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
  }, [puzzle, selectedMove, scores, streak, solvedPuzzles, user]);

  const handleNext = useCallback(() => {
    const newDifficulty = analysis ? getNextDifficulty(currentDifficulty, analysis.score) : currentDifficulty;
    setCurrentDifficulty(newDifficulty);

    const newSolvedPuzzles = [...solvedPuzzles, puzzle.id];
    setSolvedPuzzles(newSolvedPuzzles);

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
    navigate(`/position/${nextPuzzle.id}`);
  }, [analysis, currentDifficulty, puzzle.id, solvedPuzzles, isPremium, navigate]);

  return {
    gameState,
    analysis,
    solvedPuzzles,
    scores,
    streak,
    averageScore,
    selectedMove,
    isLimited,
    remaining,
    showUpgradeOverlay,
    setShowUpgradeOverlay,
    dailySolved,
    handleMove,
    handleSubmit,
    handleNext,
    DAILY_PUZZLE_LIMIT,
    isPremium,
  };
}
