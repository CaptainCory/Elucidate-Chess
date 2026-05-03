import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const KNIGHT_URL = 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg';
const PAWN_URL = 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg';

// Knight L-tour around a 4x4 mini board (col, row), 0-indexed from top-left
const KNIGHT_PATH: Array<[number, number]> = [
  [0, 3],
  [2, 2],
  [0, 1],
  [1, 3],
  [3, 2],
  [2, 0],
  [0, 1],
  [1, 3],
];

const STATUS_LINES = [
  'Reading the position…',
  'Counting material and tempo…',
  'Looking for tactics…',
  'Checking candidate moves…',
  'Weighing your reasoning…',
  'Comparing to the strongest line…',
  'Drafting your feedback…',
];

const SQUARE = 28; // px
const BOARD_SIZE = 4;

export function AnalyzingSequence() {
  const [hopIndex, setHopIndex] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [pawnSquare, setPawnSquare] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHopIndex((i) => (i + 1) % KNIGHT_PATH.length), 850);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setStatusIndex((i) => (i + 1) % STATUS_LINES.length), 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPawnSquare((i) => (i + 1) % 8), 280);
    return () => clearInterval(t);
  }, []);

  const [col, row] = KNIGHT_PATH[hopIndex];

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      {/* Mini 4x4 board with hopping knight */}
      <div
        className="relative rounded-md overflow-hidden shadow-md"
        style={{ width: SQUARE * BOARD_SIZE, height: SQUARE * BOARD_SIZE }}
      >
        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
          const r = Math.floor(i / BOARD_SIZE);
          const c = i % BOARD_SIZE;
          const isLight = (r + c) % 2 === 0;
          return (
            <div
              key={i}
              className={isLight ? 'bg-board-light' : 'bg-board-dark'}
              style={{
                position: 'absolute',
                left: c * SQUARE,
                top: r * SQUARE,
                width: SQUARE,
                height: SQUARE,
              }}
            />
          );
        })}
        <motion.img
          src={KNIGHT_URL}
          alt=""
          aria-hidden
          draggable={false}
          animate={{ x: col * SQUARE, y: row * SQUARE, scale: [1, 1.08, 1] }}
          transition={{
            x: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
            y: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
            scale: { duration: 0.55, times: [0, 0.5, 1] },
          }}
          style={{
            position: 'absolute',
            width: SQUARE,
            height: SQUARE,
            top: 0,
            left: 0,
            filter: 'drop-shadow(0 2px 2px hsl(var(--foreground) / 0.35))',
          }}
        />
      </div>

      {/* Cycling status line */}
      <div className="h-6 flex items-center justify-center min-w-[240px]">
        <AnimatePresence mode="wait">
          <motion.p
            key={statusIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="font-display text-base text-muted-foreground italic"
          >
            {STATUS_LINES[statusIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Pawn-march progress strip (8 squares) */}
      <div className="relative flex rounded-sm overflow-hidden shadow-sm">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={i % 2 === 0 ? 'bg-board-light' : 'bg-board-dark'}
            style={{ width: 18, height: 18 }}
          />
        ))}
        <motion.img
          src={PAWN_URL}
          alt=""
          aria-hidden
          draggable={false}
          animate={{ x: pawnSquare * 18 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 18,
            height: 18,
            filter: 'drop-shadow(0 1px 1px hsl(var(--foreground) / 0.35))',
          }}
        />
      </div>
    </div>
  );
}
