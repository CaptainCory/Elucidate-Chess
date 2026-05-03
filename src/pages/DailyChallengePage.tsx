import { LiveVisitorsBadge } from '@/components/LiveVisitorsBadge';
import { useState, useMemo, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChessBoard } from '@/components/ChessBoard';
import { TurnIndicator } from '@/components/TurnIndicator';
import { ThinkingInput } from '@/components/ThinkingInput';
import { AnalysisResult, AnalysisData } from '@/components/AnalysisResult';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { AuthModal } from '@/components/AuthModal';
import { ChessQuoteFooter } from '@/components/ChessQuoteFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Calendar, Trophy, ArrowLeft, Loader2, LogIn, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { mapDbPuzzle, ChessPuzzle } from '@/data/chessPuzzles';
import { PageSEO } from '@/components/PageSEO';

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="w-4 h-4" />
      <span>Next challenge in {timeLeft}</span>
    </div>
  );
}

export default function DailyChallengePage() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'thinking' | 'analyzing' | 'result'>('thinking');
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Ensure today's challenge exists
  const { data: challenge, isLoading: challengeLoading } = useQuery({
    queryKey: ['daily-challenge', today],
    queryFn: async () => {
      // Try to get today's challenge
      let { data } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('challenge_date', today)
        .maybeSingle();

      if (!data) {
        // Trigger the edge function to create one
        await supabase.functions.invoke('set-daily-challenge');
        const res = await supabase
          .from('daily_challenges')
          .select('*')
          .eq('challenge_date', today)
          .maybeSingle();
        data = res.data;
      }
      return data;
    },
  });

  // Fetch the puzzle
  const { data: puzzle, isLoading: puzzleLoading } = useQuery({
    queryKey: ['daily-puzzle', challenge?.puzzle_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('puzzles')
        .select('*')
        .eq('id', challenge!.puzzle_id)
        .maybeSingle();
      return data ? mapDbPuzzle(data) : null;
    },
    enabled: !!challenge?.puzzle_id,
  });

  // Check if user already solved today
  const { data: existingScore } = useQuery({
    queryKey: ['daily-score', user?.id, today],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_challenge_scores')
        .select('*')
        .eq('user_id', user!.id)
        .eq('challenge_date', today)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Daily leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ['daily-leaderboard', today],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_challenge_scores')
        .select('user_id, score, created_at')
        .eq('challenge_date', today)
        .order('score', { ascending: false })
        .limit(10);

      if (!data?.length) return [];

      // Fetch display names
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const nameMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

      return data.map((d, i) => ({
        rank: i + 1,
        name: nameMap.get(d.user_id) || 'Anonymous',
        score: d.score,
      }));
    },
  });

  const boardOrientation = useMemo(() => {
    if (!puzzle) return 'white' as const;
    try { return new Chess(puzzle.fen).turn() === 'b' ? 'black' as const : 'white' as const; } catch { return 'white' as const; }
  }, [puzzle?.fen]);

  const alreadySolved = !!existingScore;

  const handleSubmit = async (thinking: string) => {
    if (!selectedMove || !puzzle || !user) return;
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
      if (!data || typeof data.score === 'undefined') throw new Error('Invalid response');

      const result: AnalysisData = {
        score: data.score,
        moveCorrect: data.moveCorrect,
        userMove: selectedMove,
        bestMove: puzzle.bestMove,
        reasoningFeedback: data.reasoningFeedback,
        keyInsights: data.keyInsights || [],
        improvement: data.improvement || '',
        positionVerification: data.positionVerification,
      };

      setAnalysis(result);

      // Save score
      await supabase.from('daily_challenge_scores').insert({
        user_id: user.id,
        challenge_date: today,
        score: result.score,
      });

      setGameState('result');
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error('Failed to analyze. Please try again.');
      setGameState('thinking');
    }
  };

  const isLoading = challengeLoading || puzzleLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No daily challenge available. Check back later!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageSEO title="Daily Challenge — Elucidate Chess" description="Solve today's chess position and compete on the daily leaderboard." />
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(38 92% 50% / 0.15), transparent 60%)' }} />

      <div className="relative container max-w-6xl mx-auto px-4 py-4">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold font-display text-foreground">Daily Challenge</h1>
            <LiveVisitorsBadge />
          </div>
          <CountdownTimer />
        </header>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Board */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TurnIndicator fen={puzzle.fen} />
                <DifficultyBadge difficulty={puzzle.difficulty} />
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(today).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <ChessBoard
              fen={puzzle.fen}
              previousFen={puzzle.previousFen}
              orientation={boardOrientation}
              interactive={gameState === 'thinking' && !alreadySolved}
              onMove={setSelectedMove}
            />
          </div>

          {/* Interaction */}
          <div className="space-y-6">
            {!user ? (
              <Card>
                <CardContent className="pt-6 text-center space-y-4">
                  <p className="text-muted-foreground">Sign in to solve today's challenge and compete on the leaderboard.</p>
                  <Button onClick={() => setShowAuth(true)} className="gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In to Play
                  </Button>
                </CardContent>
              </Card>
            ) : alreadySolved && !analysis ? (
              <Card>
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/15 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-lg font-semibold text-foreground">Already Solved!</p>
                  <p className="text-muted-foreground">Your score: <span className="text-primary font-bold">{existingScore.score}</span></p>
                  <p className="text-sm text-muted-foreground">Come back tomorrow for a new challenge.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="chess-card p-6 space-y-6">
                {gameState === 'thinking' && (
                  <ThinkingInput onSubmit={handleSubmit} isLoading={false} moveSelected={!!selectedMove} />
                )}
                {gameState === 'analyzing' && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <p className="text-muted-foreground">Analyzing your chess thinking...</p>
                  </div>
                )}
                {gameState === 'result' && analysis && (
                  <AnalysisResult
                    analysis={analysis}
                    onNext={() => {}}
                    puzzleContext={{ fen: puzzle.fen, bestMove: puzzle.bestMove, explanation: puzzle.explanation }}
                  />
                )}
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard && leaderboard.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Today's Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leaderboard.map((entry) => (
                      <motion.div
                        key={entry.rank}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: entry.rank * 0.05 }}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 text-center font-bold text-sm ${entry.rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                            {entry.rank}
                          </span>
                          <span className="text-sm text-foreground">{entry.name}</span>
                        </div>
                        <span className="font-mono font-semibold text-sm text-primary">{entry.score}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <ChessQuoteFooter />
      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
}
