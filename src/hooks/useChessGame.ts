import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChessPuzzle } from '@/data/chessPuzzles';
import { AnalysisData } from '@/components/AnalysisResult';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export type GameState = 'thinking' | 'analyzing' | 'result';

export function useChessGame(puzzle: ChessPuzzle, onReset?: () => void) {
  const { user, isPremium } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [gameState, setGameState] = useState<GameState>('thinking');
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [solvedPuzzles, setSolvedPuzzles] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [showUpgradeOverlay, setShowUpgradeOverlay] = useState(false);
  const [isDifficultyLocked, setIsDifficultyLocked] = useState(false);
  const [graduatedTo, setGraduatedTo] = useState<string | null>(null);

  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  // Check if current puzzle's difficulty is locked for free users
  useEffect(() => {
    if (isPremium) {
      setIsDifficultyLocked(false);
      return;
    }
    const locked = puzzle.difficulty !== 'beginner';
    setIsDifficultyLocked(locked);
    if (locked) {
      setShowUpgradeOverlay(true);
    }
  }, [puzzle.difficulty, isPremium]);

  const handleMove = useCallback((move: string) => {
    setSelectedMove(move);
  }, []);

  const handleSubmit = useCallback(async (thinking: string) => {
    if (!selectedMove) return;
    if (isDifficultyLocked) {
      setShowUpgradeOverlay(true);
      return;
    }
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

      if (data?.error && !data.score && (data.error.includes('Premium') || data.error.includes('limit'))) {
        setIsDifficultyLocked(true);
        setShowUpgradeOverlay(true);
        setGameState('thinking');
        toast.error('Upgrade to Premium to access this difficulty level.');
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

      if (user) {
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('increment_puzzle_stats', {
            p_user_id: user.id,
            p_score: analysisResult.score,
            p_streak: 0, // streak is now managed server-side, this param is ignored
            p_difficulty: puzzle.difficulty,
          });

        if (rpcError) {
          console.error('Failed to update stats:', rpcError);
        } else if (rpcResult && typeof rpcResult === 'object' && !Array.isArray(rpcResult)) {
          const result = rpcResult as Record<string, unknown>;
          if (result.graduated) {
            const newDiff = result.current_difficulty as string;
            setGraduatedTo(newDiff);
            if (!isPremium && newDiff !== 'beginner') {
              // Don't toast — the celebration modal handles it
            }
          }
        }

        void queryClient.invalidateQueries({ queryKey: ['profile-stats', user.id] });
        void queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      }

      setGameState('result');

      // Progress cliff: after 10 beginner puzzles, prompt free users to upgrade
      if (!isPremium && user && puzzle.difficulty === 'beginner') {
        const { data: prof } = await supabase
          .from('profiles')
          .select('beginner_solved')
          .eq('user_id', user.id)
          .maybeSingle();
        if (prof && prof.beginner_solved >= 10 && prof.beginner_solved % 5 === 0) {
          // Show upgrade prompt every 5 puzzles after 10
          setTimeout(() => setShowUpgradeOverlay(true), 2500);
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze your response. Please try again.');
      setGameState('thinking');
    }
  }, [puzzle, selectedMove, scores, user, isPremium, isDifficultyLocked, queryClient]);

  const [isNavigating, setIsNavigating] = useState(false);

  const handleNext = useCallback(async () => {
    if (isNavigating) return;
    setIsNavigating(true);

    try {
      const { data: nextId, error } = await supabase.rpc('get_next_puzzle', {
        p_user_id: user?.id ?? '00000000-0000-0000-0000-000000000000',
        p_current_puzzle_id: puzzle.id,
        p_is_premium: isPremium,
      });

      if (error) {
        console.error('get_next_puzzle error:', error);
        toast.error('Could not load next position. Please try again.');
        setIsNavigating(false);
        return;
      }

      if (nextId && nextId !== puzzle.id) {
        navigate(`/position/${nextId}`);
      } else if (nextId) {
        // Same puzzle returned — force remount
        onReset?.();
      } else {
        toast.info('No more positions available right now.');
      }
    } catch (err) {
      console.error('Failed to get next puzzle:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsNavigating(false);
    }
  }, [puzzle.id, isPremium, navigate, user, onReset, isNavigating]);

  return {
    gameState,
    analysis,
    solvedPuzzles,
    scores,
    averageScore,
    averageScore,
    selectedMove,
    isDifficultyLocked,
    showUpgradeOverlay,
    setShowUpgradeOverlay,
    graduatedTo,
    setGraduatedTo,
    handleMove,
    handleSubmit,
    handleNext,
    isPremium,
    isNavigating,
  };
}
