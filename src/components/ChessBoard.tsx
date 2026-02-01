import { Chessboard } from 'react-chessboard';

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
          boardOrientation={orientation}
          arePiecesDraggable={false}
          customBoardStyle={{
            borderRadius: '0.75rem',
          }}
          customDarkSquareStyle={{
            backgroundColor: 'hsl(25, 25%, 35%)',
          }}
          customLightSquareStyle={{
            backgroundColor: 'hsl(35, 30%, 75%)',
          }}
        />
      </div>
    </div>
  );
}
