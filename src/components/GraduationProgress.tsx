import { motion } from 'framer-motion';
import { Lock, TrendingUp } from 'lucide-react';

const THRESHOLDS: Record<string, { target: number; scoreReq: number; next: string }> = {
  beginner: { target: 3, scoreReq: 60, next: 'Intermediate' },
  intermediate: { target: 5, scoreReq: 65, next: 'Advanced' },
  advanced: { target: 0, scoreReq: 0, next: '' },
};

interface GraduationProgressProps {
  difficulty: string;
  solved: number;
  avgScore: number;
  isPremium: boolean;
}

export function GraduationProgress({ difficulty, solved, avgScore, isPremium }: GraduationProgressProps) {
  const tier = THRESHOLDS[difficulty];
  if (!tier || tier.target === 0) return null;

  const solveProgress = Math.min(solved / tier.target, 1);
  const scoreProgress = Math.min(avgScore / tier.scoreReq, 1);
  const remaining = Math.max(0, tier.target - solved);
  const scoreMet = avgScore >= tier.scoreReq;
  const solvesMet = solved >= tier.target;

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      {/* Solves progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground capitalize">
            {difficulty} positions
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {!isPremium && difficulty === 'beginner' && remaining > 0 && (
              <Lock className="w-3 h-3" />
            )}
            {remaining > 0
              ? `${remaining} more to unlock ${tier.next}`
              : `${solved}/${tier.target} solved ✓`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${solveProgress * 100}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {Array.from({ length: tier.target }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                i < solved ? 'bg-primary' : 'bg-muted-foreground/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Score requirement */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Avg score
          </span>
          <span className={`text-xs font-medium ${scoreMet ? 'text-green-500' : 'text-muted-foreground'}`}>
            {solved > 0 ? `${avgScore}%` : '—'} / {tier.scoreReq}% needed
            {scoreMet && ' ✓'}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${scoreMet ? 'bg-green-500' : 'bg-amber-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${(solved > 0 ? scoreProgress : 0) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Status message */}
      {solvesMet && !scoreMet && (
        <p className="text-xs text-amber-500 text-center mt-1">
          Keep improving your score to graduate — need {tier.scoreReq}% avg
        </p>
      )}
    </div>
  );
}
