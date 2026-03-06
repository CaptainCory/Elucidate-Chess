import { Trophy, Target, TrendingUp } from 'lucide-react';

interface ProgressStatsProps {
  puzzlesSolved: number;
  averageScore: number;
  streak: number;
}

export function ProgressStats({ puzzlesSolved, averageScore, streak }: ProgressStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="chess-card p-3 text-center">
        <Trophy className="w-5 h-5 mx-auto mb-1 text-primary" />
        <p className="text-2xl font-bold font-mono text-foreground">{puzzlesSolved}</p>
        <p className="text-xs text-muted-foreground">Solved</p>
      </div>
      <div className="chess-card p-3 text-center">
        <Target className="w-5 h-5 mx-auto mb-1 text-accent" />
        <p className="text-2xl font-bold font-display text-foreground">{averageScore}</p>
        <p className="text-xs text-muted-foreground">Avg Score</p>
      </div>
      <div className="chess-card p-3 text-center">
        <TrendingUp className="w-5 h-5 mx-auto mb-1 text-success" />
        <p className="text-2xl font-bold font-display text-foreground">{streak}</p>
        <p className="text-xs text-muted-foreground">Streak</p>
      </div>
    </div>
  );
}
