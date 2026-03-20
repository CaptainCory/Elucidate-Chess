import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GraduationCelebrationProps {
  newDifficulty: string;
  onDismiss: () => void;
}

export function GraduationCelebration({ newDifficulty, onDismiss }: GraduationCelebrationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.6,
      size: 4 + Math.random() * 8,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-background/85 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
      />

      {/* Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute pointer-events-none"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.5],
            y: [20, -40, -80, -120],
          }}
          transition={{
            duration: 2,
            delay: p.delay,
            ease: 'easeOut',
          }}
        >
          <Star
            className="text-primary"
            style={{ width: p.size, height: p.size }}
            fill="currentColor"
          />
        </motion.div>
      ))}

      <motion.div
        className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-primary/30 bg-card p-8 shadow-2xl text-center"
        initial={{ opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        <motion.div
          className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-5"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Crown className="w-10 h-10 text-primary" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold font-display text-foreground mb-2">
            🎓 Graduated!
          </h2>
          <p className="text-muted-foreground text-sm mb-1">
            You've unlocked
          </p>
          <p className="text-xl font-bold font-display text-primary capitalize mb-4">
            {newDifficulty} Positions
          </p>
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-6">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Harder puzzles, deeper thinking</span>
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button onClick={onDismiss} className="w-full gap-2" size="lg">
            <Sparkles className="w-4 h-4" />
            Let's Go
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
