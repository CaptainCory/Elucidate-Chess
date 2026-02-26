// Collection of famous chess positions with known best moves
// FEN format: piece positions, active color, castling, en passant, halfmove, fullmove

export interface ChessPuzzle {
  id: string;
  name: string;
  fen: string;
  previousFen?: string; // FEN before opponent's last move, for intro animation
  bestMove: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master';
  explanation: string;
  themes: string[];
}

export const chessPuzzles: ChessPuzzle[] = [
  {
    id: '1',
    name: 'Simple Back Rank Mate',
    fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
    bestMove: 'Re8#',
    difficulty: 'beginner',
    explanation: 'White has a simple back rank mate. The black king is trapped on the 8th rank by its own pawns, and the rook delivers checkmate by moving to e8.',
    themes: ['back-rank mate', 'checkmate pattern'],
  },
  {
    id: '2',
    name: 'Queen Fork',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    bestMove: 'Qxf7#',
    difficulty: 'beginner',
    explanation: 'This is the famous Scholar\'s Mate setup. White can deliver checkmate immediately with Qxf7#, as the queen is protected by the bishop and the black king cannot escape.',
    themes: ['checkmate', 'scholars mate'],
  },
  {
    id: '3',
    name: 'Knight Fork',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    bestMove: 'Ng5',
    difficulty: 'intermediate',
    explanation: 'Ng5 attacks the weak f7 pawn, creating threats. The knight also eyes the e6 square and creates tactical opportunities against the uncastled black king.',
    themes: ['attack', 'weak pawn', 'development'],
  },
  {
    id: '4',
    name: 'Discovered Attack',
    fen: 'r2qkb1r/ppp2ppp/2n1bn2/3Np3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 2 6',
    bestMove: 'Nxf6+',
    difficulty: 'intermediate',
    explanation: 'Nxf6+ is a discovered check from the bishop on c4 through to the king, while also winning the knight on f6. Black must deal with the check, allowing White to maintain material advantage.',
    themes: ['discovered attack', 'tactics', 'material gain'],
  },
  {
    id: '5',
    name: 'Greek Gift Sacrifice',
    fen: 'r1bq1rk1/ppp2ppp/2nb1n2/3pp3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 0 7',
    bestMove: 'Bxh7+',
    difficulty: 'advanced',
    explanation: 'The classic Greek Gift sacrifice! Bxh7+ forces the king to capture, then Ng5+ continues the attack. After Kh6, White has Qg4 with a devastating attack.',
    themes: ['sacrifice', 'attack on king', 'classical pattern'],
  },
  {
    id: '6',
    name: 'Smothered Mate Setup',
    fen: 'r1b1k2r/ppppqppp/2n2n2/2b1p1N1/2B1P3/3P4/PPP2PPP/RNBQK2R w KQkq - 5 6',
    bestMove: 'Nxf7',
    difficulty: 'advanced',
    explanation: 'Nxf7 is a powerful fork attacking the queen and rook. If Kxf7, the king becomes exposed. This tactical blow wins significant material.',
    themes: ['fork', 'tactics', 'material gain'],
  },
  {
    id: '7',
    name: 'Positional Squeeze',
    fen: 'r1bq1rk1/pp2bppp/2n1pn2/2pp4/3P4/2PBPN2/PP1N1PPP/R1BQ1RK1 w - - 0 8',
    bestMove: 'dxc5',
    difficulty: 'intermediate',
    explanation: 'Capturing dxc5 opens the d-file and creates an isolated pawn on d5 for Black. White can then target this weakness while maintaining a solid position.',
    themes: ['pawn structure', 'positional play', 'isolated pawn'],
  },
  {
    id: '8',
    name: 'Queen Sacrifice for Mate',
    fen: '2rq1rk1/pp2ppbp/2n3p1/3P4/2P1P3/2N2N1P/PP3PP1/R1BQR1K1 b - - 0 13',
    bestMove: 'Rxc4',
    difficulty: 'advanced',
    explanation: 'Rxc4 wins the c4 pawn while also threatening the knight. Black is exploiting the loose pieces in White\'s position.',
    themes: ['tactics', 'loose pieces', 'material'],
  },
  {
    id: '9',
    name: 'Windmill Tactic',
    fen: '6k1/6p1/8/6K1/8/1r6/8/7R w - - 0 1',
    bestMove: 'Rh8+',
    difficulty: 'master',
    explanation: 'Rh8+ begins a windmill sequence. After Kf7, Rh7+ picks up the g7 pawn. The rook can keep giving checks while winning material.',
    themes: ['windmill', 'perpetual threats', 'tactics'],
  },
  {
    id: '10',
    name: 'Deflection',
    fen: 'r4rk1/ppp2ppp/2n2q2/3p4/3P4/2N2Q2/PPP2PPP/R4RK1 w - - 0 12',
    bestMove: 'Qxf6',
    difficulty: 'beginner',
    explanation: 'Simply trading queens with Qxf6 is the best move, simplifying to a roughly equal endgame.',
    themes: ['simplification', 'exchange'],
  },
  {
    id: '11',
    name: 'Central Pawn Break',
    fen: 'rn1q1rk1/4bppp/ppbppn2/8/PP1PP3/2N1BN2/4BPPP/R2Q1RK1 w - - 1 12',
    previousFen: 'rn1q1rk1/p3bppp/1pbppn2/8/PP1PP3/2N1BN2/4BPPP/R2Q1RK1 b - - 0 11',
    bestMove: 'd5',
    difficulty: 'advanced',
    explanation: 'The pawn push d5 is the strongest move, forcing Black to isolate their d-pawn. The alternative e5 is inferior as it leads to exchanges where Black maintains space and solid structure. Rook to c1 is a mistake because the e4 pawn is attacked twice and only defended once.',
    themes: ['pawn push', 'pawn structure'],
  },
  {
    id: '12',
    name: 'Intermezzo Knight',
    fen: 'rn3rk1/2qn1ppp/ppb1p3/4P3/P4B2/2b2N2/2Q1BPPP/R2R2K1 w - - 0 17',
    bestMove: 'Ng5',
    difficulty: 'advanced',
    explanation: 'The tempting response is to capture the bishop with the queen, restoring material equality instantly. But the advanced move is Ng5, threatening checkmate on h7. Black must respond with g6 to block the checkmate, then you capture the bishop on c3. This has bought you an extra tempo — your knight is now closer to the enemy king and out of the way of the c6 bishop, which now lacks a piece target.',
    themes: ['intermezzo', 'gain tempo'],
  },
];

export function getRandomPuzzle(excludeIds: string[] = [], difficultyFilter?: ChessPuzzle['difficulty']): ChessPuzzle {
  let availablePuzzles = chessPuzzles.filter(p => !excludeIds.includes(p.id));
  
  if (difficultyFilter) {
    availablePuzzles = availablePuzzles.filter(p => p.difficulty === difficultyFilter);
  }
  
  if (availablePuzzles.length === 0) {
    availablePuzzles = chessPuzzles;
  }
  
  return availablePuzzles[Math.floor(Math.random() * availablePuzzles.length)];
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
