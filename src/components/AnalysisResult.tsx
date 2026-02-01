import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ArrowRight, Trophy, Target, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export interface AnalysisData {
  score: number;
  moveCorrect: boolean;
  userMove: string;
  bestMove: string;
  reasoningFeedback: string;
  keyInsights: string[];
  improvement: string;
}

interface AnalysisResultProps {
  analysis: AnalysisData;
  onNext: () => void;
}

export function AnalysisResult({ analysis, onNext }: AnalysisResultProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-accent';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent!';
    if (score >= 80) return 'Great Job!';
    if (score >= 60) return 'Good Thinking';
    if (score >= 40) return 'Keep Practicing';
    return 'Room for Growth';
  };

  return (
    <div className="space-y-6 animate-scale-in">
      {/* Score Badge */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-card border-4 border-primary animate-pulse-glow">
          <span className={`text-4xl font-bold font-display ${getScoreColor(analysis.score)}`}>
            {analysis.score}
          </span>
        </div>
        <p className={`text-xl font-semibold ${getScoreColor(analysis.score)}`}>
          {getScoreLabel(analysis.score)}
        </p>
      </div>

      {/* Move Comparison */}
      <div className="chess-card p-4 space-y-3">
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
      </div>

      {/* Reasoning Feedback */}
      <div className="chess-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-foreground">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold font-display">Analysis Feedback</h3>
        </div>
        <div className="text-secondary-foreground prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{analysis.reasoningFeedback}</ReactMarkdown>
        </div>
      </div>

      {/* Key Insights */}
      {analysis.keyInsights.length > 0 && (
        <div className="chess-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-foreground">
            <Lightbulb className="w-5 h-5 text-accent" />
            <h3 className="font-semibold font-display">Key Insights</h3>
          </div>
          <ul className="space-y-2">
            {analysis.keyInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-secondary-foreground">
                <span className="text-primary mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvement Suggestion */}
      {analysis.improvement && (
        <div className="chess-card p-4 border-primary/30 bg-primary/5">
          <p className="text-sm text-secondary-foreground">
            <span className="font-semibold text-primary">💡 To improve:</span> {analysis.improvement}
          </p>
        </div>
      )}

      {/* Next Button */}
      <Button
        onClick={onNext}
        className="w-full py-6 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
        size="lg"
      >
        Next Position
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}
