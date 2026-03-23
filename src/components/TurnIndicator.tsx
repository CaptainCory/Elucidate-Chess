import { Chess } from 'chess.js';
import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface TurnIndicatorProps {
  fen: string;
}

export function TurnIndicator({ fen }: TurnIndicatorProps) {
  const turn = useMemo(() => {
    try {
      const game = new Chess(fen);
      return game.turn();
    } catch {
      return 'w';
    }
  }, [fen]);

  const isWhite = turn === 'w';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-lg border-2 font-semibold text-sm tracking-wide shadow-md"
      style={{
        backgroundColor: isWhite ? 'hsl(45, 20%, 92%)' : 'hsl(220, 15%, 18%)',
        borderColor: isWhite ? 'hsl(38, 50%, 65%)' : 'hsl(220, 10%, 35%)',
        color: isWhite ? 'hsl(220, 20%, 15%)' : 'hsl(45, 20%, 90%)',
      }}
    >
      <motion.span
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="w-3 h-3 rounded-full shadow-sm border"
        style={{
          backgroundColor: isWhite ? 'hsl(45, 20%, 95%)' : 'hsl(220, 15%, 12%)',
          borderColor: isWhite ? 'hsl(38, 30%, 60%)' : 'hsl(220, 10%, 40%)',
        }}
      />
      <span className="uppercase">{isWhite ? 'White' : 'Black'} to move</span>
    </motion.div>
  );
}
