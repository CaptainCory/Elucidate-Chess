import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import type { AnalyzeStage } from '@/hooks/useChessGame';

const KNIGHT_URL = 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg';

const STEPS: { key: Exclude<AnalyzeStage, 'idle'>; label: string }[] = [
  { key: 'sending', label: 'Reading the position' },
  { key: 'thinking', label: 'Engine evaluating candidate moves' },
  { key: 'finalizing', label: 'Drafting your feedback' },
  { key: 'done', label: 'Analysis ready' },
];

interface Props {
  stage?: AnalyzeStage;
}

export function AnalyzingSequence({ stage = 'sending' }: Props) {
  // Elapsed time counter for the "thinking" phase
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (stage === 'idle' || stage === 'done') return;
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 100) / 10), 100);
    return () => clearInterval(t);
  }, [stage]);

  const activeIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.key === stage),
  );
  const progressPct = ((activeIndex + (stage === 'done' ? 1 : 0.5)) / STEPS.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      {/* Knight emblem */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{ borderTopColor: 'hsl(var(--primary))' }}
        />
        <motion.img
          src={KNIGHT_URL}
          alt=""
          aria-hidden
          draggable={false}
          className="relative w-12 h-12"
          style={{ filter: 'drop-shadow(0 3px 4px hsl(var(--foreground) / 0.35))' }}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Determinate progress bar */}
      <div className="w-full max-w-xs space-y-2">
        <div className="relative h-1.5 rounded-full overflow-hidden bg-secondary">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>Step {Math.min(activeIndex + 1, STEPS.length)} of {STEPS.length}</span>
          <span>{elapsed.toFixed(1)}s</span>
        </div>
      </div>

      {/* Step checklist */}
      <ul className="w-full max-w-xs space-y-2">
        {STEPS.map((step, i) => {
          const completed = i < activeIndex || stage === 'done';
          const active = i === activeIndex && stage !== 'done';
          return (
            <li key={step.key} className="flex items-center gap-3 text-sm">
              <span className="flex items-center justify-center w-5 h-5 shrink-0">
                <AnimatePresence mode="wait">
                  {completed ? (
                    <motion.span
                      key="done"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground"
                    >
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </motion.span>
                  ) : active ? (
                    <Loader2 key="spin" className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <span key="pending" className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                  )}
                </AnimatePresence>
              </span>
              <span
                className={
                  completed
                    ? 'text-foreground'
                    : active
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                }
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
