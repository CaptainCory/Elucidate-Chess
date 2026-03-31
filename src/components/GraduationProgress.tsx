import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const THRESHOLDS: Record<string, { highScoresNeeded: number; scoreReq: number; next: string }> = {
  beginner: { highScoresNeeded: 3, scoreReq: 90, next: 'Intermediate' },
  intermediate: { highScoresNeeded: 5, scoreReq: 90, next: 'Advanced' },
  advanced: { highScoresNeeded: 0, scoreReq: 0, next: '' },
};

interface GraduationProgressProps {
  difficulty: string;
  solved: number;
  avgScore: number;
  highScores?: number;
  isPremium: boolean;
}

export function GraduationProgress({ difficulty, highScores = 0, isPremium }: GraduationProgressProps) {
  const tier = THRESHOLDS[difficulty];
  if (!tier || tier.highScoresNeeded === 0) return null;

  const progress = Math.min(highScores / tier.highScoresNeeded, 1);
  const remaining = Math.max(0, tier.highScoresNeeded - highScores);
  const met = highScores >= tier.highScoresNeeded;

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground capitalize flex items-center gap-1">
            <Star className="w-3 h-3" />
            High scores ({tier.scoreReq}%+)
          </span>
          <span className={`text-xs font-medium ${met ? 'text-green-500' : 'text-muted-foreground'}`}>
            {met
              ? `Ready to unlock ${tier.next} ✓`
              : `${remaining} more to unlock ${tier.next}`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${met ? 'bg-green-500' : 'bg-primary'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {Array.from({ length: tier.highScoresNeeded }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                i < highScores ? 'bg-primary' : 'bg-muted-foreground/20'
              }`}
            />
          ))}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        Score 90% or higher on {difficulty} positions to advance
      </p>
    </div>
  );
}
