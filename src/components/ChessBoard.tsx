import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  previousFen?: string;
  orientation?: 'white' | 'black';
  onMove?: (move: string) => void;
  interactive?: boolean;
  externalSquareStyles?: Record<string, React.CSSProperties>;
}

export function ChessBoard({ fen, previousFen, orientation = 'white', onMove, interactive = false, externalSquareStyles }: ChessBoardProps) {
  const [userMove, setUserMove] = useState<string | null>(null);
  const [highlightSquares, setHighlightSquares] = useState<Record<string, React.CSSProperties>>({});
  const [displayFen, setDisplayFen] = useState(previousFen || fen);
  const [isAnimatingIntro, setIsAnimatingIntro] = useState(!!previousFen);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  // Reset when fen prop changes (new puzzle)
  const [prevFen, setPrevFen] = useState(fen);
  if (fen !== prevFen) {
    setPrevFen(fen);
    setDisplayFen(previousFen || fen);
    setUserMove(null);
    setHighlightSquares({});
    setIsAnimatingIntro(!!previousFen);
    setSelectedSquare(null);
  }

  // Animate from previousFen to current fen after a short delay
  useEffect(() => {
    if (!isAnimatingIntro || !previousFen) return;

    const timer = setTimeout(() => {
      setDisplayFen(fen);
      try {
        const prevGame = new Chess(previousFen);
        const currGame = new Chess(fen);
        const prevBoard = prevGame.board();
        const currBoard = currGame.board();
        let fromSquare: string | null = null;
        let toSquare: string | null = null;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const prevPiece = prevBoard[r][c];
            const currPiece = currBoard[r][c];
            const pStr = prevPiece ? `${prevPiece.color}${prevPiece.type}` : '';
            const cStr = currPiece ? `${currPiece.color}${currPiece.type}` : '';
            if (pStr !== cStr) {
              const file = String.fromCharCode(97 + c);
              const rank = 8 - r;
              const sq = `${file}${rank}`;
              if (prevPiece && !currPiece) {
                fromSquare = sq;
              } else if (currPiece) {
                toSquare = sq;
              }
            }
          }
        }
        const highlights: Record<string, React.CSSProperties> = {};
        if (fromSquare) {
          highlights[fromSquare] = { backgroundColor: 'hsla(30, 70%, 45%, 0.35)' };
        }
        if (toSquare) {
          highlights[toSquare] = { backgroundColor: 'hsla(30, 90%, 55%, 0.6)' };
        }
        setHighlightSquares(highlights);
      } catch {
        // ignore
      }

      setIsAnimatingIntro(false);
    }, 720);

    return () => clearTimeout(timer);
  }, [isAnimatingIntro, previousFen, fen]);

  const playClickSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const len = Math.floor(ctx.sampleRate * 0.035);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const t = i / ctx.sampleRate;
        const click = Math.exp(-t * 200) * (Math.random() * 2 - 1);
        const tap = Math.exp(-t * 120) * Math.sin(2 * Math.PI * 800 * t) * 0.3;
        const body = Math.exp(-t * 80) * Math.sin(2 * Math.PI * 2200 * t) * 0.15;
        d[i] = (click * 0.7 + tap + body) * 0.9;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = 1.2;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 400;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 6000;
      src.connect(hp);
      hp.connect(lp);
      lp.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch {}
  }, []);

  const makeMove = useCallback((sourceSquare: string, targetSquare: string) => {
    if (!interactive || userMove || isAnimatingIntro) return false;

    const game = new Chess(fen);
    try {
      const move = game.move({
        from: sourceSquare as Square,
        to: targetSquare as Square,
        promotion: 'q',
      });

      if (move) {
        playClickSound();
        const moveNotation = move.san;
        setUserMove(moveNotation);
        setDisplayFen(game.fen());
        setSelectedSquare(null);
        setHighlightSquares({
          [sourceSquare]: { backgroundColor: 'hsla(38, 92%, 50%, 0.4)' },
          [targetSquare]: { backgroundColor: 'hsla(38, 92%, 50%, 0.6)' },
        });
        onMove?.(moveNotation);
        return true;
      }
    } catch {
      // Invalid move
    }
    return false;
  }, [fen, interactive, userMove, isAnimatingIntro, onMove, playClickSound]);

  const handleDrop = useCallback(({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string }) => {
    makeMove(sourceSquare, targetSquare);
  }, [makeMove]);

  const handleSquareClick = useCallback((square: string) => {
    if (!interactive || userMove || isAnimatingIntro) return;

    const game = new Chess(fen);
    const piece = game.get(square as Square);

    if (selectedSquare) {
      const moved = makeMove(selectedSquare, square);
      if (!moved) {
        const turn = game.turn();
        if (piece && piece.color === turn) {
          setSelectedSquare(square);
          const moves = game.moves({ square: square as Square, verbose: true });
          const highlights: Record<string, React.CSSProperties> = {
            [square]: { backgroundColor: 'hsla(38, 92%, 50%, 0.5)' },
          };
          moves.forEach(m => {
            highlights[m.to] = { backgroundColor: 'hsla(120, 50%, 50%, 0.3)' };
          });
          setHighlightSquares(highlights);
        } else {
          setSelectedSquare(null);
          setHighlightSquares({});
        }
      }
    } else {
      const turn = game.turn();
      if (piece && piece.color === turn) {
        setSelectedSquare(square);
        const moves = game.moves({ square: square as Square, verbose: true });
        const highlights: Record<string, React.CSSProperties> = {
          [square]: { backgroundColor: 'hsla(38, 92%, 50%, 0.5)' },
        };
        moves.forEach(m => {
          highlights[m.to] = { backgroundColor: 'hsla(120, 50%, 50%, 0.3)' };
        });
        setHighlightSquares(highlights);
      }
    }
  }, [fen, interactive, userMove, isAnimatingIntro, selectedSquare, makeMove]);

  return (
    <motion.div
      className="w-full max-w-[480px] mx-auto"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="rounded-xl overflow-hidden shadow-lg ring-1 ring-border relative">
        {isAnimatingIntro && (
          <motion.div
            className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-muted/90 text-xs font-medium text-muted-foreground backdrop-blur-sm"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            Opponent's last move...
          </motion.div>
        )}
        <Chessboard
          position={displayFen}
          orientation={orientation}
          draggable={interactive && !userMove && !isAnimatingIntro}
          onDrop={handleDrop}
          onSquareClick={handleSquareClick}
          transitionDuration={isAnimatingIntro ? 720 : 300}
          boardStyle={{
            borderRadius: '0.75rem',
          }}
          darkSquareStyle={{
            backgroundColor: 'hsl(160, 18%, 25%)',
          }}
          lightSquareStyle={{
            backgroundColor: 'hsl(38, 40%, 78%)',
          }}
          squareStyles={highlightSquares}
          calcWidth={({ screenWidth }) => Math.min(480, screenWidth - 32)}
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
        <motion.div
          className="mt-3 text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-mono font-semibold">
            Your move: {userMove}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
