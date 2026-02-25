import { useState, useCallback } from 'react';
import Chessboard from 'chessboardjsx';
import { Chess, Square } from 'chess.js';

const pieceImages: Record<string, string> = {
  wK: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  wQ: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  wR: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  wB: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  wN: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  wP: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  bK: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
  bQ: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  bR: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  bB: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  bN: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  bP: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
};

interface ChessBoardProps {
  fen: string;
  orientation?: 'white' | 'black';
  onMove?: (move: string) => void;
  interactive?: boolean;
}

export function ChessBoard({ fen, orientation = 'white', onMove, interactive = false }: ChessBoardProps) {
  const [userMove, setUserMove] = useState<string | null>(null);
  const [highlightSquares, setHighlightSquares] = useState<Record<string, React.CSSProperties>>({});
  const [displayFen, setDisplayFen] = useState(fen);

  // Reset when fen prop changes (new puzzle)
  const [prevFen, setPrevFen] = useState(fen);
  if (fen !== prevFen) {
    setPrevFen(fen);
    setDisplayFen(fen);
    setUserMove(null);
    setHighlightSquares({});
  }

  const handleDrop = useCallback(({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string }) => {
    if (!interactive || userMove) return;

    const game = new Chess(fen);
    try {
      const move = game.move({
        from: sourceSquare as Square,
        to: targetSquare as Square,
        promotion: 'q',
      });

      if (move) {
        const moveNotation = move.san;
        setUserMove(moveNotation);
        setDisplayFen(game.fen());
        setHighlightSquares({
          [sourceSquare]: { backgroundColor: 'hsla(38, 92%, 50%, 0.4)' },
          [targetSquare]: { backgroundColor: 'hsla(38, 92%, 50%, 0.6)' },
        });
        onMove?.(moveNotation);
      }
    } catch {
      // Invalid move, ignore
    }
  }, [fen, interactive, userMove, onMove]);

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="rounded-xl overflow-hidden shadow-lg ring-1 ring-border">
        <Chessboard
          position={displayFen}
          orientation={orientation}
          draggable={interactive && !userMove}
          onDrop={handleDrop}
          boardStyle={{
            borderRadius: '0.75rem',
          }}
          darkSquareStyle={{
            backgroundColor: 'hsl(25, 25%, 35%)',
          }}
          lightSquareStyle={{
            backgroundColor: 'hsl(35, 30%, 75%)',
          }}
          squareStyles={highlightSquares}
          calcWidth={({ screenWidth }) => Math.min(500, screenWidth - 32)}
          pieces={Object.fromEntries(
            Object.entries(pieceImages).map(([piece, src]) => [
              piece,
              ({ squareWidth }: { squareWidth: number }) => (
                <img
                  src={src}
                  alt={piece}
                  style={{ width: squareWidth, height: squareWidth }}
                />
              ),
            ])
          )}
        />
      </div>
      {userMove && (
        <div className="mt-3 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-mono font-semibold">
            Your move: {userMove}
          </span>
        </div>
      )}
    </div>
  );
}
