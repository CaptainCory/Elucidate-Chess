import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Lock, Sparkles } from 'lucide-react';

const THRESHOLDS: Record<string, { target: number; next: string }> = {
  beginner: { target: 3, next: 'Intermediate' },
  intermediate: { target: 5, next: 'Advanced' },
  advanced: { target: 0, next: '' },
};

interface GraduationProgressProps {
  difficulty: string;
  solved: number;
  isPremium: boolean;
}

export function GraduationProgress({ difficulty, solved, isPremium }: GraduationProgressProps) {
  const tier = THRESHOLDS[difficulty];
  if (!tier || tier.target === 0) return null;

  const progress = Math.min(solved / tier.target, 1);
  const remaining = Math.max(0, tier.target - solved);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-muted-foreground capitalize">
          {difficulty}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          {!isPremium && difficulty === 'beginner' && remaining > 0 && (
            <Lock className="w-3 h-3" />
          )}
          {remaining > 0
            ? `${remaining} more to unlock ${tier.next}`
            : `${tier.next} unlocked!`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
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
  );
}
