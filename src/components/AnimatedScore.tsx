import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ScoreConfetti } from '@/components/ScoreConfetti';

interface AnimatedScoreProps {
  score: number;
  grade: string;
  label: string;
  colorClass: string;
}

export function AnimatedScore({ score, grade, label, colorClass }: AnimatedScoreProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [displayScore, setDisplayScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const controls = animate(count, score, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = rounded.on('change', (v) => setDisplayScore(v));

    if (score >= 90) {
      const timer = setTimeout(() => setShowConfetti(true), 600);
      return () => { controls.stop(); unsub(); clearTimeout(timer); };
    }

    return () => { controls.stop(); unsub(); };
  }, [score, count, rounded]);

  const shakeAnimation = score < 40 ? {
    x: [0, -3, 3, -2, 2, 0],
    transition: { duration: 0.4, delay: 1.2 },
  } : {};

  return (
    <motion.div
      className="text-center space-y-2 relative"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1, ...shakeAnimation }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <ScoreConfetti trigger={showConfetti} />

      <motion.div
        className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-card border-4 ${score >= 90 ? 'border-primary shadow-[0_0_30px_hsl(42_75%_50%/0.4)]' : 'border-primary'}`}
        initial={{ boxShadow: '0 0 0px hsl(42 75% 50% / 0)' }}
        animate={{
          boxShadow: score >= 70 ? [
            '0 0 0px hsl(42 75% 50% / 0)',
            '0 0 40px hsl(42 75% 50% / 0.5)',
            '0 0 20px hsl(42 75% 50% / 0.3)',
          ] : '0 0 0px hsl(42 75% 50% / 0)',
        }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        {/* Sparkle ring for 70-89 */}
        {score >= 70 && score < 90 && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent, hsl(42 75% 50% / 0.2), transparent, hsl(42 75% 50% / 0.15), transparent)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}
        <span className={`text-4xl font-bold font-mono ${colorClass}`}>
          {displayScore}
        </span>
      </motion.div>

      <motion.p
        className={`text-2xl font-bold font-mono ${colorClass}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        {grade}
      </motion.p>

      <motion.p
        className={`text-sm font-semibold ${colorClass}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.4 }}
      >
        {label}
      </motion.p>
    </motion.div>
  );
}
