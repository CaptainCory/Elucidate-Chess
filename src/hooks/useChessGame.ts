import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChessPuzzle, getNextDifficulty } from '@/data/chessPuzzles';
import { AnalysisData } from '@/components/AnalysisResult';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DAILY_PUZZLE_LIMIT = 3;

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
  const [dailySolved, setDailySolved] = useState(0);
  const [isLimited, setIsLimited] = useState(false);

  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const remaining = DAILY_PUZZLE_LIMIT - dailySolved;

  // Check access server-side on mount and when user changes
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('validate-puzzle-access');
        if (!error && data) {
          if (data.isPremium) {
            setIsLimited(false);
            setDailySolved(0);
          } else {
            const count = data.dailyCount ?? (DAILY_PUZZLE_LIMIT - (data.remaining ?? DAILY_PUZZLE_LIMIT));
            setDailySolved(count);
            setIsLimited(!data.allowed);
          }
        }
      } catch (e) {
        console.error('Access check failed:', e);
      }
    };
    checkAccess();
  }, [user]);

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
          puzzleId: puzzle.id,
        },
      });

      if (error) throw error;

      if (data?.error && !data.score && data.error.includes('limit')) {
        setIsLimited(true);
        setShowUpgradeOverlay(true);
        setGameState('thinking');
        toast.error('Daily puzzle limit reached. Upgrade to Premium for unlimited access.');
        return;
      }

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

      setDailySolved(prev => prev + 1);
      if (!isPremium && dailySolved + 1 >= DAILY_PUZZLE_LIMIT) {
        setIsLimited(true);
      }

      if (user) {
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('increment_puzzle_stats', {
            p_user_id: user.id,
            p_score: analysisResult.score,
            p_streak: newStreak,
            p_difficulty: puzzle.difficulty,
          });

        if (rpcError) {
          console.error('Failed to update stats:', rpcError);
        } else if (rpcResult?.graduated) {
          toast.success(`🎓 Congratulations! You've graduated to ${rpcResult.current_difficulty} positions!`);
        }
      }

      setGameState('result');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze your response. Please try again.');
      setGameState('thinking');
    }
  }, [puzzle, selectedMove, scores, streak, solvedPuzzles, user, isPremium, dailySolved]);

  const handleNext = useCallback(async () => {
    const newDifficulty = analysis ? getNextDifficulty(currentDifficulty, analysis.score) : currentDifficulty;
    setCurrentDifficulty(newDifficulty);

    const newSolvedPuzzles = [...solvedPuzzles, puzzle.id];
    setSolvedPuzzles(newSolvedPuzzles);

    if (!isPremium && dailySolved >= DAILY_PUZZLE_LIMIT) {
      setIsLimited(true);
      setShowUpgradeOverlay(true);
      return;
    }

    // Fetch next puzzle from DB, filtering by difficulty and excluding solved ones
    let query = supabase.from('puzzles').select('id');

    // Try with difficulty filter first
    const { data } = await query.eq('difficulty', newDifficulty).limit(100);
    let candidates = (data || []).filter(p => !newSolvedPuzzles.includes(p.id));

    // If no candidates with that difficulty, try any difficulty
    if (candidates.length === 0) {
      const { data: allData } = await supabase.from('puzzles').select('id').limit(100);
      candidates = (allData || []).filter(p => !newSolvedPuzzles.includes(p.id));
    }

    // If still empty, allow repeats
    if (candidates.length === 0) {
      const { data: allData } = await supabase.from('puzzles').select('id').limit(100);
      candidates = allData || [];
    }

    if (candidates.length > 0) {
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      navigate(`/position/${next.id}`);
    }
  }, [analysis, currentDifficulty, puzzle.id, solvedPuzzles, isPremium, navigate, dailySolved]);

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
