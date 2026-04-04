import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENTS } from './AchievementBadge';

interface AchievementToastProps {
  achievementKeys: string[];
  onDone: () => void;
}

export function AchievementToast({ achievementKeys, onDone }: AchievementToastProps) {
  const achievements = achievementKeys
    .map(key => ACHIEVEMENTS.find(a => a.key === key))
    .filter(Boolean);

  if (achievements.length === 0) return null;

  return (
    <AnimatePresence onExitComplete={onDone}>
      <motion.div
        className="fixed top-6 right-6 z-50 space-y-2"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 60 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {achievements.map((a) => {
          const Icon = a!.icon;
          return (
            <motion.div
              key={a!.key}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-primary/30 shadow-lg shadow-primary/10"
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Achievement Unlocked!</p>
                <p className="text-sm font-semibold text-foreground">{a!.name}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
