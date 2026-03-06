// Chess puzzle types and database query helpers

export type ChessTheme =
  | 'fork'
  | 'pin'
  | 'skewer'
  | 'discovered-attack'
  | 'double-check'
  | 'deflection'
  | 'decoy'
  | 'overloading'
  | 'removing-the-defender'
  | 'zwischenzug'
  | 'trapped-piece'
  | 'back-rank-checkmate'
  | 'smothered-mate'
  | 'checkmate'
  | 'sacrifice'
  | 'hanging-piece'
  | 'x-ray'
  | 'promotion'
  | 'endgame'
  | 'battery'
  | 'quiet-move'
  | 'open-position'
  | 'closed-position'
  | 'rook-on-open-file'
  | 'developed'
  | 'undeveloped'
  | 'check';

export interface ChessPuzzle {
  id: string;
  name: string;
  fen: string;
  previousFen: string;
  bestMove: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master';
  explanation: string;
  themes: ChessTheme[];
}

export function getNextDifficulty(current: ChessPuzzle['difficulty'], score: number): ChessPuzzle['difficulty'] {
  const difficulties: ChessPuzzle['difficulty'][] = ['beginner', 'intermediate', 'advanced', 'master'];
  const currentIndex = difficulties.indexOf(current);

  if (score >= 80 && currentIndex < difficulties.length - 1) {
    return difficulties[currentIndex + 1];
  } else if (score < 40 && currentIndex > 0) {
    return difficulties[currentIndex - 1];
  }

  return current;
}

/** Map a DB row to a ChessPuzzle */
export function mapDbPuzzle(data: {
  id: string;
  name: string;
  fen: string;
  previous_fen: string;
  best_move: string;
  difficulty: string;
  explanation: string;
  themes: string[];
}): ChessPuzzle {
  return {
    id: data.id,
    name: data.name,
    fen: data.fen,
    previousFen: data.previous_fen,
    bestMove: data.best_move,
    difficulty: data.difficulty as ChessPuzzle['difficulty'],
    explanation: data.explanation,
    themes: (data.themes || []) as ChessTheme[],
  };
}
