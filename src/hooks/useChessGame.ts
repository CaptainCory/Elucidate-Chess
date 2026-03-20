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
  const [streak, setStreak] = useState(0);
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

      let newStreak: number;
      if (analysisResult.score >= 70) {
        newStreak = streak + 1;
        setStreak(newStreak);
      } else {
        newStreak = 0;
        setStreak(0);
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
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze your response. Please try again.');
      setGameState('thinking');
    }
  }, [puzzle, selectedMove, scores, streak, user, isPremium, isDifficultyLocked, queryClient]);

  const handleNext = useCallback(async () => {
    // Mark current puzzle as seen in DB (for logged-in users)
    if (user) {
      await supabase.from('user_seen_puzzles').upsert(
        { user_id: user.id, puzzle_id: puzzle.id },
        { onConflict: 'user_id,puzzle_id' }
      );
    }

    // Get user's current difficulty level and performance
    let userDifficulty = 'beginner';
    let userAvgAtLevel = 0;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_difficulty, beginner_avg_score, intermediate_avg_score, advanced_avg_score')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profile?.current_difficulty) {
        // Free users stay on beginner regardless of their profile difficulty
        userDifficulty = isPremium ? profile.current_difficulty : 'beginner';
        // Get avg score at current level for adaptive selection
        if (userDifficulty === 'intermediate') userAvgAtLevel = profile.intermediate_avg_score ?? 0;
        else if (userDifficulty === 'advanced') userAvgAtLevel = profile.advanced_avg_score ?? 0;
        else userAvgAtLevel = profile.beginner_avg_score ?? 0;
      }
    }

    // Adaptive difficulty: if struggling at current level (avg < 50), mix in easier puzzles
    let targetDifficulty = userDifficulty;
    if (userDifficulty === 'intermediate' && userAvgAtLevel < 50) {
      // 50% chance of getting a beginner puzzle to rebuild confidence
      targetDifficulty = Math.random() < 0.5 ? 'beginner' : 'intermediate';
    } else if (userDifficulty === 'advanced' && userAvgAtLevel < 50) {
      targetDifficulty = Math.random() < 0.5 ? 'intermediate' : 'advanced';
    }

    // Fetch all puzzles at user's level
    const { data: allAtLevel } = await supabase
      .from('puzzles')
      .select('id')
      .eq('difficulty', userDifficulty);
    const allIds = (allAtLevel || []).map(p => p.id);

    // Fetch seen puzzle IDs for this user
    let seenIds: string[] = [];
    if (user) {
      const { data: seen } = await supabase
        .from('user_seen_puzzles')
        .select('puzzle_id')
        .eq('user_id', user.id);
      seenIds = (seen || []).map(s => s.puzzle_id);
    }

    // Filter to unseen puzzles at this difficulty
    let candidates = allIds.filter(id => !seenIds.includes(id) && id !== puzzle.id);

    // If all puzzles at this level have been seen, reset and start fresh
    if (candidates.length === 0) {
      if (user) {
        const idsToReset = allIds;
        await supabase
          .from('user_seen_puzzles')
          .delete()
          .eq('user_id', user.id)
          .in('puzzle_id', idsToReset);
      }
      candidates = allIds.filter(id => id !== puzzle.id);
    }

    // Fallback: any beginner puzzle
    if (candidates.length === 0) {
      const { data: anyData } = await supabase.from('puzzles').select('id').eq('difficulty', 'beginner').limit(100);
      candidates = (anyData || []).map(p => p.id).filter(id => id !== puzzle.id);
    }

    // Last fallback: any puzzle
    if (candidates.length === 0) {
      const { data: anyData } = await supabase.from('puzzles').select('id').limit(100);
      candidates = (anyData || []).map(p => p.id).filter(id => id !== puzzle.id);
    }

    if (candidates.length > 0) {
      const nextId = candidates[Math.floor(Math.random() * candidates.length)];
      navigate(`/position/${nextId}`);
    } else {
      onReset?.();
    }
  }, [puzzle.id, isPremium, navigate, user, onReset]);

  return {
    gameState,
    analysis,
    solvedPuzzles,
    scores,
    streak,
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
  };
}
