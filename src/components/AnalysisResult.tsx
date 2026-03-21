import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ArrowRight, Trophy, Target, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FollowUpChat } from '@/components/FollowUpChat';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { AnimatedScore } from '@/components/AnimatedScore';

export interface PositionPiece {
  square: string;
  piece: 'King' | 'Queen' | 'Rook' | 'Bishop' | 'Knight' | 'Pawn';
  color: 'white' | 'black';
}

export interface PositionVerification {
  pieces: PositionPiece[];
  whitePieceCount: number;
  blackPieceCount: number;
  sideToMove: 'white' | 'black';
  castlingRights: string;
  enPassantTarget: string;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  legalMovesCount: number;
  userMoveLegal: boolean;
  bestMoveLegal: boolean;
  bestMoveLeadsToMate: boolean;
}

export interface AnalysisData {
  score: number;
  moveCorrect: boolean;
  userMove: string;
  bestMove: string;
  reasoningFeedback: string;
  keyInsights: string[];
  improvement: string;
  positionVerification?: PositionVerification;
}

interface AnalysisResultProps {
  analysis: AnalysisData;
  onNext: () => void;
  puzzleContext?: {
    fen: string;
    bestMove: string;
    explanation: string;
  };
}

export function AnalysisResult({ analysis, onNext, puzzleContext }: AnalysisResultProps) {
  const { isSpeaking, toggle: toggleSpeech } = useTextToSpeech();

  const buildSpeechText = () => {
    const parts: string[] = [];
    parts.push(analysis.moveCorrect ? 'Correct move!' : 'Incorrect move.');
    parts.push(`Score: ${analysis.score} out of 100.`);
    parts.push(analysis.reasoningFeedback);
    if (analysis.keyInsights.length > 0) {
      parts.push('Key insights: ' + analysis.keyInsights.slice(0, 2).join('. '));
    }
    if (analysis.improvement) {
      parts.push('To improve: ' + analysis.improvement);
    }
    return parts.join(' ');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return;
      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-accent';
    return 'text-destructive';
  };

  const getGrade = (score: number) => {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 67) return 'D+';
    if (score >= 63) return 'D';
    if (score >= 60) return 'D-';
    return 'F';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent!';
    if (score >= 80) return 'Great Job!';
    if (score >= 60) return 'Good Thinking';
    if (score >= 40) return 'Keep Practicing';
    return 'Room for Growth';
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  } as const;

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
  };

  return (
    <motion.div
      className="space-y-6"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Score Badge */}
      <motion.div variants={fadeUp}>
        <AnimatedScore
          score={analysis.score}
          grade={getGrade(analysis.score)}
          label={getScoreLabel(analysis.score)}
          colorClass={getScoreColor(analysis.score)}
        />
        <div className="text-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSpeech(buildSpeechText())}
            className="mx-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isSpeaking ? 'Stop' : 'Listen to Feedback'}
          </Button>
        </div>
      </motion.div>

      {/* Move Comparison */}
      <motion.div variants={fadeUp} className="chess-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {analysis.moveCorrect ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive" />
            )}
            <span className="font-medium">Your Move:</span>
            <code className="px-2 py-1 bg-muted rounded font-mono">{analysis.userMove}</code>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-medium">Best Move:</span>
          <code className="px-2 py-1 bg-primary/20 rounded font-mono text-primary">{analysis.bestMove}</code>
        </div>
      </motion.div>

      {/* Next Position (top) */}
      <motion.div variants={fadeUp}>
        <Button
          onClick={onNext}
          className="w-full py-6 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 focus-guide"
          size="lg"
        >
          Next Position
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>

      {/* Reasoning Feedback */}
      <motion.div variants={fadeUp} className="chess-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-foreground">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold font-display">Analysis Feedback</h3>
        </div>
        <div className="text-secondary-foreground prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{analysis.reasoningFeedback}</ReactMarkdown>
        </div>
      </motion.div>

      {/* Follow-up Chat */}
      {puzzleContext && (
        <motion.div variants={fadeUp}>
          <FollowUpChat
            fen={puzzleContext.fen}
            userMove={analysis.userMove}
            bestMove={puzzleContext.bestMove}
            puzzleExplanation={puzzleContext.explanation}
            analysisScore={analysis.score}
            analysisFeedback={analysis.reasoningFeedback}
          />
        </motion.div>
      )}

      {/* Improvement Suggestion */}
      {analysis.improvement && (
        <motion.div variants={fadeUp} className="chess-card p-4 border-primary/30 bg-primary/5">
          <p className="text-sm text-secondary-foreground">
            <span className="font-semibold text-primary">💡 To improve:</span> {analysis.improvement}
          </p>
        </motion.div>
      )}

      {/* Next Button */}
      <motion.div variants={fadeUp}>
        <Button
          onClick={onNext}
          className="w-full py-6 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 focus-guide"
          size="lg"
        >
          Next Position
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
