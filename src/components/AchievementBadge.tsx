import { Trophy, Star, Flame, Target, Award, Zap, GraduationCap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: typeof Trophy;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: 'first_solve', name: 'First Steps', description: 'Solve your first puzzle', icon: Star },
  { key: 'perfect_score', name: 'Perfect Score', description: 'Score 100 on a puzzle', icon: Target },
  { key: 'streak_5', name: 'Hot Streak', description: 'Get 5 scores of 70+ in a row', icon: Flame },
  { key: 'streak_10', name: 'Unstoppable', description: 'Get 10 scores of 70+ in a row', icon: Zap },
  { key: 'ten_solved', name: 'Dedicated', description: 'Solve 10 puzzles', icon: Award },
  { key: 'fifty_solved', name: 'Veteran', description: 'Solve 50 puzzles', icon: Trophy },
  { key: 'beginner_graduate', name: 'Rising Star', description: 'Graduate to Intermediate', icon: GraduationCap },
  { key: 'advanced_graduate', name: 'Chess Master', description: 'Graduate to Advanced', icon: Crown },
];

interface AchievementBadgeProps {
  achievement: AchievementDef;
  unlocked: boolean;
  className?: string;
}

export function AchievementBadge({ achievement, unlocked, className }: AchievementBadgeProps) {
  const Icon = achievement.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all',
        unlocked
          ? 'border-primary/30 bg-primary/5'
          : 'border-border/30 bg-muted/20 opacity-40 grayscale',
        className
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          unlocked ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground">{achievement.name}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{achievement.description}</p>
      </div>
    </div>
  );
}
