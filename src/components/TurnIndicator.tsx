import { Chess } from 'chess.js';
import { useMemo } from 'react';

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
    <div className={`turn-indicator ${isWhite ? 'turn-white' : 'turn-black'}`}>
      <span
        className={`w-3 h-3 rounded-full ${
          isWhite ? 'bg-foreground' : 'bg-foreground'
        }`}
        style={{
          backgroundColor: isWhite ? 'hsl(220, 20%, 15%)' : 'hsl(45, 20%, 90%)',
        }}
      />
      <span>{isWhite ? 'White' : 'Black'} to move</span>
    </div>
  );
}
