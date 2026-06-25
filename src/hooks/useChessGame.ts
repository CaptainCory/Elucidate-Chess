import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { ChessPuzzle } from '@/data/chessPuzzles';
import { AnalysisData } from '@/components/AnalysisResult';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useStockfish } from '@/hooks/useStockfish';
import {
  centipawnLoss,
  cplToScore,
  normalizeEvalToWhite,
  type EngineEval,
} from '@/lib/engineScore';

export type GameState = 'thinking' | 'analyzing' | 'result';
export type AnalyzeStage = 'idle' | 'sending' | 'thinking' | 'finalizing' | 'done';

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
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [analyzeStage, setAnalyzeStage] = useState<AnalyzeStage>('idle');
  const { getEvaluation: engineEvaluate, state: engineState } = useStockfish(3000);

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
    setAnalyzeStage('sending');

    try {
      // --- 1. Engine analysis (best-effort, runs in browser) ---
      let enginePayload: {
        bestMove: string | null;
        evalBefore: EngineEval;
        evalAfter: EngineEval;
        cpl: number;
        moveScore: number;
      } | null = null;

      try {
        if (engineState !== 'error') {
          setAnalyzeStage('thinking');
          const sideToMove: 'w' | 'b' = puzzle.fen.split(' ')[1] === 'b' ? 'b' : 'w';

          // Apply the user's SAN move with chess.js to get the resulting FEN
          const chess = new Chess(puzzle.fen);
          let fenAfter: string | null = null;
          try {
            const applied = chess.move(selectedMove, { strict: false });
            if (applied) fenAfter = chess.fen();
          } catch {
            fenAfter = null;
          }

          // Run sequentially — the Stockfish worker can only handle one
          // evaluation at a time; parallel calls clobber each other's
          // pending resolver and the first one ends up timing out.
          const rawBefore = await engineEvaluate(puzzle.fen, 14);
          const rawAfter = fenAfter ? await engineEvaluate(fenAfter, 14) : null;

          if (rawBefore && rawAfter) {
            const beforeWhite = normalizeEvalToWhite(rawBefore, sideToMove);
            const afterWhite = normalizeEvalToWhite(rawAfter, sideToMove === 'w' ? 'b' : 'w');
            const cpl = centipawnLoss(beforeWhite, afterWhite, sideToMove);
            const moveScore = cplToScore(cpl);
            enginePayload = {
              bestMove: rawBefore.bestMove,
              evalBefore: { ...rawBefore },
              evalAfter: { ...rawAfter },
              cpl,
              moveScore,
            };
          }
        }
      } catch (engErr) {
        console.warn('Engine analysis failed, falling back to AI-only scoring:', engErr);
      }

      // --- 2. AI analysis (reasoning + feedback) ---
      const { data, error } = await supabase.functions.invoke('analyze-chess', {
        body: {
          fen: puzzle.fen,
          userThinking: thinking,
          userMove: selectedMove,
          bestMove: puzzle.bestMove,
          puzzleExplanation: puzzle.explanation,
          puzzleDifficulty: puzzle.difficulty,
          puzzleId: puzzle.id,
          engine: enginePayload,
        },
      });

      setAnalyzeStage('finalizing');

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
        feedbackTitle: data.feedbackTitle,
        reasoningFeedback: data.reasoningFeedback,
        keyInsights: data.keyInsights || [],
        improvement: data.improvement || '',
        positionVerification: data.positionVerification,
        engine: data.engine ?? enginePayload ?? undefined,
      };

      setAnalysis(analysisResult);
      const newScores = [...scores, analysisResult.score];
      setScores(newScores);

      if (user) {
        const { error: attemptError } = await supabase
          .from('puzzle_attempts')
          .insert({
            user_id: user.id,
            puzzle_id: puzzle.id,
          });

        if (attemptError) {
          console.error('Failed to record puzzle attempt:', attemptError);
        }

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
          }
          // Handle new achievements
          if (Array.isArray(result.new_achievements) && (result.new_achievements as string[]).length > 0) {
            setNewAchievements(result.new_achievements as string[]);
          }
        }

        void queryClient.invalidateQueries({ queryKey: ['profile-stats', user.id] });
        void queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      }

      setAnalyzeStage('done');
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
      setAnalyzeStage('idle');
      setGameState('thinking');
    }
  }, [puzzle, selectedMove, scores, user, isPremium, isDifficultyLocked, queryClient, engineEvaluate, engineState]);

  const [isNavigating, setIsNavigating] = useState(false);

  const handleRetry = useCallback(() => {
    setAnalysis(null);
    setSelectedMove(null);
    setAnalyzeStage('idle');
    setGameState('thinking');
    onReset?.();
  }, [onReset]);

  const handleNext = useCallback(async () => {
    if (isNavigating) return;
    setIsNavigating(true);

    try {
      const { data: nextId, error } = await supabase.rpc('get_next_puzzle', {
        p_user_id: user?.id ?? '00000000-0000-0000-0000-000000000000',
        p_current_puzzle_id: puzzle.id,
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
    selectedMove,
    isDifficultyLocked,
    showUpgradeOverlay,
    setShowUpgradeOverlay,
    graduatedTo,
    setGraduatedTo,
    newAchievements,
    setNewAchievements,
    handleMove,
    handleSubmit,
    handleNext,
    handleRetry,
    isPremium,
    isNavigating,
    analyzeStage,
  };
}
