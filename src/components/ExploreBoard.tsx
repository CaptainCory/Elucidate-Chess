import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import Chessboard from 'chessboardjsx';
import { Chess, Square } from 'chess.js';
import { RotateCcw, Undo2, Compass } from 'lucide-react';

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

interface ExploreBoardProps {
  startFen: string;
  orientation?: 'white' | 'black';
  /** Original puzzle FEN to rewind to via undo/reset. Defaults to startFen. */
  initialFen?: string;
  /** SAN of the move that led from initialFen to startFen, shown in history. */
  initialMoveSan?: string;
}

/**
 * Free-play board for exploring continuations after a puzzle is solved.
 * Enforces chess rules, alternates turns, supports undo and reset.
 */
export function ExploreBoard({ startFen, orientation = 'white', initialFen, initialMoveSan }: ExploreBoardProps) {
  const buildInitialHistory = () =>
    initialFen && initialFen !== startFen ? [initialFen, startFen] : [startFen];
  const buildInitialSans = () =>
    initialFen && initialFen !== startFen && initialMoveSan ? [initialMoveSan] : [];

  const [history, setHistory] = useState<string[]>(buildInitialHistory);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Record<string, React.CSSProperties>>({});
  const [moveSans, setMoveSans] = useState<string[]>(buildInitialSans);

  // Reset internal state if the starting position changes
  useEffect(() => {
    setHistory(buildInitialHistory());
    setSelectedSquare(null);
    setHighlights({});
    setMoveSans(buildInitialSans());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startFen, initialFen, initialMoveSan]);


  const fen = history[history.length - 1];
  const game = useMemo(() => {
    try { return new Chess(fen); } catch { return new Chess(); }
  }, [fen]);

  const status = useMemo(() => {
    if (game.isCheckmate()) return 'Checkmate';
    if (game.isStalemate()) return 'Stalemate';
    if (game.isDraw()) return 'Draw';
    if (game.inCheck()) return 'Check';
    return null;
  }, [game]);

  const playClick = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const len = Math.floor(ctx.sampleRate * 0.03);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const t = i / ctx.sampleRate;
        d[i] = Math.exp(-t * 180) * (Math.random() * 2 - 1) * 0.6;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start();
    } catch {}
  }, []);

  const tryMove = useCallback((from: string, to: string) => {
    const g = new Chess(fen);
    try {
      const move = g.move({ from: from as Square, to: to as Square, promotion: 'q' });
      if (move) {
        playClick();
        setHistory(h => [...h, g.fen()]);
        setMoveSans(m => [...m, move.san]);
        setSelectedSquare(null);
        setHighlights({
          [from]: { backgroundColor: 'hsla(38, 92%, 50%, 0.4)' },
          [to]: { backgroundColor: 'hsla(38, 92%, 50%, 0.6)' },
        });
        return true;
      }
    } catch {}
    return false;
  }, [fen, playClick]);

  const handleDrop = useCallback(({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string }) => {
    tryMove(sourceSquare, targetSquare);
  }, [tryMove]);

  const showMoves = useCallback((square: string) => {
    const piece = game.get(square as Square);
    if (!piece || piece.color !== game.turn()) return false;
    const moves = game.moves({ square: square as Square, verbose: true });
    const h: Record<string, React.CSSProperties> = {
      [square]: { backgroundColor: 'hsla(38, 92%, 50%, 0.5)' },
    };
    moves.forEach(m => {
      h[m.to] = { backgroundColor: 'hsla(120, 50%, 50%, 0.3)' };
    });
    setSelectedSquare(square);
    setHighlights(h);
    return true;
  }, [game]);

  const handleSquareClick = useCallback((square: string) => {
    if (selectedSquare) {
      if (tryMove(selectedSquare, square)) return;
      if (!showMoves(square)) {
        setSelectedSquare(null);
        setHighlights({});
      }
    } else {
      showMoves(square);
    }
  }, [selectedSquare, tryMove, showMoves]);

  const undo = () => {
    if (history.length <= 1) return;
    setHistory(h => h.slice(0, -1));
    setMoveSans(m => m.slice(0, -1));
    setSelectedSquare(null);
    setHighlights({});
  };

  const reset = () => {
    const baseFen = initialFen || startFen;
    setHistory([baseFen]);
    setMoveSans([]);
    setSelectedSquare(null);
    setHighlights({});
  };

  const turn = game.turn() === 'w' ? 'White' : 'Black';

  return (
    <motion.div
      className="w-full max-w-[480px] mx-auto"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <Compass className="w-4 h-4 text-primary" />
          <span>Explore continuations</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={history.length <= 1}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" /> Undo
          </button>
          <button
            onClick={reset}
            disabled={history.length <= 1}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden shadow-lg ring-1 ring-border">
        <Chessboard
          position={fen}
          orientation={orientation}
          draggable={!game.isGameOver()}
          onDrop={handleDrop}
          onSquareClick={handleSquareClick}
          transitionDuration={250}
          boardStyle={{ borderRadius: '0.75rem' }}
          darkSquareStyle={{ backgroundColor: 'hsl(28, 35%, 52%)' }}
          lightSquareStyle={{ backgroundColor: 'hsl(40, 45%, 85%)' }}
          squareStyles={highlights}
          calcWidth={({ screenWidth }) => Math.min(480, screenWidth - 32)}
          pieces={Object.fromEntries(
            Object.entries(pieceImages).map(([piece, src]) => [
              piece,
              ({ squareWidth }: { squareWidth: number }) => (
                <img src={src} alt={piece} style={{ width: squareWidth, height: squareWidth }} />
              ),
            ])
          )}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {status ? <span className="font-semibold text-primary">{status}</span> : <>{turn} to move</>}
        </span>
        {moveSans.length > 0 && (
          <span className="font-mono text-muted-foreground truncate max-w-[60%] text-right">
            {moveSans.slice(-6).join(' · ')}
          </span>
        )}
      </div>
    </motion.div>
  );
}
