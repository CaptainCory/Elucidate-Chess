import Chessboard from 'chessboardjsx';

interface ChessBoardProps {
  fen: string;
  orientation?: 'white' | 'black';
}

export function ChessBoard({ fen, orientation = 'white' }: ChessBoardProps) {
  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="rounded-xl overflow-hidden shadow-lg ring-1 ring-border">
        <Chessboard
          position={fen}
          orientation={orientation}
          draggable={false}
          boardStyle={{
            borderRadius: '0.75rem',
          }}
          darkSquareStyle={{
            backgroundColor: 'hsl(25, 25%, 35%)',
          }}
          lightSquareStyle={{
            backgroundColor: 'hsl(35, 30%, 75%)',
          }}
          calcWidth={({ screenWidth }) => Math.min(500, screenWidth - 32)}
        />
      </div>
    </div>
  );
}
