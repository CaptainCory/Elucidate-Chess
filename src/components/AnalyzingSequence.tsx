import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const KNIGHT_URL = 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg';

const STATUS_LINES = [
  'Reading the position…',
  'Counting material and tempo…',
  'Looking for tactics…',
  'Checking candidate moves…',
  'Weighing your reasoning…',
  'Comparing to the strongest line…',
  'Drafting your feedback…',
];

export function AnalyzingSequence() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStatusIndex((i) => (i + 1) % STATUS_LINES.length), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-7">
      {/* Knight emblem with orbiting rings */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Outer rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary) / 0.6) 90deg, transparent 180deg)`,
            mask: 'radial-gradient(circle, transparent 46%, black 47%, black 50%, transparent 51%)',
            WebkitMask: 'radial-gradient(circle, transparent 46%, black 47%, black 50%, transparent 51%)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        />
        {/* Inner counter-rotating ring */}
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{
            background: `conic-gradient(from 180deg, transparent 0deg, hsl(var(--accent) / 0.5) 70deg, transparent 140deg)`,
            mask: 'radial-gradient(circle, transparent 44%, black 45%, black 48%, transparent 49%)',
            WebkitMask: 'radial-gradient(circle, transparent 44%, black 45%, black 48%, transparent 49%)',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
        />
        {/* Pulsing glow */}
        <motion.div
          className="absolute inset-4 rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.25), transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Knight */}
        <motion.img
          src={KNIGHT_URL}
          alt=""
          aria-hidden
          draggable={false}
          className="relative w-14 h-14"
          style={{ filter: 'drop-shadow(0 4px 6px hsl(var(--foreground) / 0.4))' }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Cycling status line */}
      <div className="h-6 flex items-center justify-center min-w-[260px]">
        <AnimatePresence mode="wait">
          <motion.p
            key={statusIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="font-display text-base text-muted-foreground italic"
          >
            {STATUS_LINES[statusIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Sleek shimmer progress bar */}
      <div className="relative w-56 h-1 rounded-full overflow-hidden bg-secondary">
        <motion.div
          className="absolute inset-y-0 w-1/3 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), hsl(var(--accent)), transparent)',
          }}
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}
