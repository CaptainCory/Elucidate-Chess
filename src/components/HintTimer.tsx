import { useState, useEffect, useRef } from 'react';
import { Lightbulb } from 'lucide-react';

interface HintTimerProps {
  /** Whether hints should be active (beginner + thinking + no move yet) */
  active: boolean;
  /** Delay in ms before first hint appears */
  delayMs?: number;
}

const GUIDING_QUESTIONS = [
  {
    id: 'material',
    question: 'Look at the material — is the player ahead, behind, or roughly equal?',
  },
  // Add more guiding questions here later
];

export function HintTimer({ active, delayMs = 10_000 }: HintTimerProps) {
  const [visibleHints, setVisibleHints] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reset when not active
    if (!active) {
      setVisibleHints(0);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Start timer for first hint
    if (visibleHints === 0) {
      timerRef.current = setTimeout(() => {
        setVisibleHints(1);
      }, delayMs);
    }

    // Future: chain additional hints with further timeouts here
    // e.g. if (visibleHints === 1 && GUIDING_QUESTIONS.length > 1) { ... }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, visibleHints, delayMs]);

  if (!active || visibleHints === 0) return null;

  const hintsToShow = GUIDING_QUESTIONS.slice(0, visibleHints);

  return (
    <div className="space-y-3 animate-fade-in">
      {hintsToShow.map((hint, i) => (
        <div
          key={hint.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20"
          style={{ animationDelay: `${i * 200}ms` }}
        >
          <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground font-medium">{hint.question}</p>
        </div>
      ))}
    </div>
  );
}
