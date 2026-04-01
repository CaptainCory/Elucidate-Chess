import { Trophy, Target, Flame, TrendingUp } from 'lucide-react';

interface ProgressStatsProps {
  puzzlesSolved: number;
  averageScore: number;
  currentStreak: number;
  bestStreak: number;
}

export function ProgressStats({ puzzlesSolved, averageScore, currentStreak, bestStreak }: ProgressStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="chess-card p-3 text-center">
        <Trophy className="w-5 h-5 mx-auto mb-1 text-primary" />
        <p className="text-2xl font-bold font-mono text-foreground">{puzzlesSolved}</p>
        <p className="text-xs text-muted-foreground">Solved</p>
      </div>
      <div className="chess-card p-3 text-center">
        <Target className="w-5 h-5 mx-auto mb-1 text-accent" />
        <p className="text-2xl font-bold font-mono text-foreground">{averageScore}</p>
        <p className="text-xs text-muted-foreground">Avg Score</p>
      </div>
      <div className="chess-card p-3 text-center">
        <Flame className="w-5 h-5 mx-auto mb-1 text-destructive" />
        <p className="text-2xl font-bold font-mono text-foreground">{currentStreak}</p>
        <p className="text-xs text-muted-foreground">Current Streak</p>
      </div>
      <div className="chess-card p-3 text-center">
        <TrendingUp className="w-5 h-5 mx-auto mb-1 text-success" />
        <p className="text-2xl font-bold font-mono text-foreground">{bestStreak}</p>
        <p className="text-xs text-muted-foreground">Best Streak</p>
      </div>
    </div>
  );
}
