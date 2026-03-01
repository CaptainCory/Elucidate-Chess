import type { ChessTheme } from '@/data/chessPuzzles';

export interface ThemeEntry {
  theme: ChessTheme;
  title: string;
  description: string;
  example: string;
  fen: string; // illustrative position
}

export const themeEntries: ThemeEntry[] = [
  {
    theme: 'fork',
    title: 'Fork',
    description:
      'A single piece attacks two or more enemy pieces at the same time, forcing the opponent to lose material because they can only save one.',
    example:
      'A knight jumps to a square where it simultaneously attacks the king and queen. The opponent must move the king, losing the queen.',
    fen: '4k3/8/8/3N4/8/8/8/4K3 w - - 0 1', // Nd5 forks king and would fork queen
  },
  {
    theme: 'pin',
    title: 'Pin',
    description:
      'A piece attacks an enemy piece that cannot move without exposing a more valuable piece behind it. An absolute pin involves the king — the pinned piece literally cannot move.',
    example:
      'A bishop pins a knight to the king along a diagonal. The knight cannot move because it would leave the king in check.',
    fen: '4k3/8/5n2/8/3B4/8/8/4K3 w - - 0 1', // Bd4 pins Nf6 to king
  },
  {
    theme: 'skewer',
    title: 'Skewer',
    description:
      'The reverse of a pin — a more valuable piece is attacked and forced to move, exposing a less valuable piece behind it to capture.',
    example:
      'A rook checks the king along a file. The king moves, and the rook captures the unprotected queen behind it.',
    fen: '4k3/4q3/8/8/8/8/8/4R1K1 w - - 0 1', // Re1 skewers king then queen
  },
  {
    theme: 'discovered-attack',
    title: 'Discovered Attack',
    description:
      'Moving one piece reveals an attack from another piece behind it. When the revealed attack is a check, it\'s called a discovered check — one of the most powerful tactical weapons.',
    example:
      'A knight moves to attack the queen, simultaneously uncovering a bishop that now attacks the rook.',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 1',
  },
  {
    theme: 'double-check',
    title: 'Double Check',
    description:
      'A special case of discovered attack where both the moving piece and the uncovered piece give check. The only defense is to move the king — blocking or capturing won\'t work.',
    example:
      'A knight moves to deliver check while also uncovering a bishop check. The king must flee since you can\'t block two checks at once.',
    fen: '4k3/8/8/1B6/3N4/8/8/4K3 w - - 0 1', // Nc6+ discovers Bb5 check
  },
  {
    theme: 'deflection',
    title: 'Deflection',
    description:
      'Forcing a defending piece away from a critical square or duty. Once the defender is deflected, the position it was guarding collapses.',
    example:
      'A queen sacrifice forces the opponent\'s rook to leave the back rank, allowing checkmate with your own rook.',
    fen: '3r1rk1/pp3ppp/8/8/8/8/PP3PPP/3RR1K1 w - - 0 1',
  },
  {
    theme: 'decoy',
    title: 'Decoy',
    description:
      'Luring an enemy piece to a specific square where it becomes vulnerable — the opposite side of deflection. You\'re pulling a piece toward danger rather than away from its duty.',
    example:
      'Sacrificing a rook on a square forces the king to capture, walking into a knight fork that wins the queen.',
    fen: 'r1b1k2r/ppppqppp/2n5/4N3/2B5/8/PPPP1PPP/R1BQK2R w KQkq - 0 1',
  },
  {
    theme: 'overloading',
    title: 'Overloading',
    description:
      'Exploiting a piece that\'s defending too many things at once. When one defender has multiple responsibilities, you attack one of them and something else falls.',
    example:
      'A queen defends both a rook and a back-rank mate threat. By capturing the rook, you force the queen to recapture, leaving the back rank unguarded.',
    fen: '3r2k1/5ppp/8/8/8/2q5/5PPP/3RR1K1 w - - 0 1',
  },
  {
    theme: 'removing-the-defender',
    title: 'Removing the Defender',
    description:
      'Capturing or driving away a piece that protects something important. Once the guardian is gone, the thing it was protecting becomes vulnerable.',
    example:
      'A knight protects a critical pawn. You exchange your bishop for the knight, and now the pawn falls freely.',
    fen: 'r1bqkb1r/ppp2ppp/2np1n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',
  },
  {
    theme: 'zwischenzug',
    title: 'Zwischenzug (In-Between Move)',
    description:
      'Instead of making the expected move (like a recapture), you insert an unexpected intermediate move — often a check or threat — that improves your position before continuing the sequence.',
    example:
      'After a piece exchange, instead of recapturing immediately, you play a check first. Your opponent deals with the check, and then you recapture with a better position.',
    fen: 'rn3rk1/2qn1ppp/ppb1p3/4P3/P4B2/2b2N2/2Q1BPPP/R2R2K1 w - - 0 1',
  },
  {
    theme: 'trapped-piece',
    title: 'Trapped Piece',
    description:
      'A piece has no safe squares to retreat to. Even if it\'s a powerful piece like a queen or rook, it can be captured because it has nowhere to escape.',
    example:
      'A bishop ventures deep into enemy territory to grab a pawn but finds all retreat squares controlled. It\'s won for the opponent despite being a bishop.',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1pB2/4P3/3P4/PPP2PPP/RN1QK1NR b KQkq - 0 1',
  },
  {
    theme: 'back-rank-checkmate',
    title: 'Back-Rank Checkmate',
    description:
      'A rook or queen delivers checkmate on the first or eighth rank because the enemy king is trapped behind its own pawns with no escape squares.',
    example:
      'The king sits on g8 with pawns on f7, g7, h7. A rook slides to e8, and it\'s checkmate — nowhere to run.',
    fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
  },
  {
    theme: 'smothered-mate',
    title: 'Smothered Mate',
    description:
      'A knight delivers checkmate to a king that is completely surrounded by its own pieces and cannot move. One of the most elegant patterns in chess.',
    example:
      'After a queen sacrifice on g8, the rook recaptures, and the knight delivers mate from f7 — the king is boxed in by its own army.',
    fen: '6rk/6pp/8/8/8/8/5N2/6K1 w - - 0 1', // Nf2-g4-f6-...-f7#
  },
  {
    theme: 'checkmate',
    title: 'Checkmate',
    description:
      'The ultimate goal — the king is in check and has no legal move to escape. Recognizing checkmate patterns helps you spot winning opportunities faster.',
    example:
      'Two rooks coordinate to deliver a ladder mate, driving the king to the edge rank by rank.',
    fen: '6k1/8/8/8/8/8/8/R3R1K1 w - - 0 1', // two rooks ready for ladder mate
  },
  {
    theme: 'sacrifice',
    title: 'Sacrifice',
    description:
      'Deliberately giving up material (a pawn, piece, or even the queen) to gain a greater advantage — whether it\'s checkmate, a winning attack, or a decisive positional edge.',
    example:
      'Sacrificing a bishop to open up the king\'s pawn shield, creating an unstoppable attack with your remaining pieces.',
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 0 1',
  },
  {
    theme: 'hanging-piece',
    title: 'Hanging Piece',
    description:
      'An undefended piece that can be captured for free. Spotting hanging pieces — both yours and your opponent\'s — is one of the most important skills at every level.',
    example:
      'After a sequence of moves, a knight is left unprotected on d4. A simple capture wins a piece with no compensation.',
    fen: '4k3/8/8/8/3n4/8/8/4K2R w - - 0 1',
  },
  {
    theme: 'x-ray',
    title: 'X-Ray',
    description:
      'A piece exerts influence through another piece to a square behind it. It\'s like having X-ray vision — your piece \'sees through\' an obstacle to attack or defend a distant square.',
    example:
      'A rook on e1 defends e8 through the opponent\'s rook on e5. If the e5 rook moves, your rook controls the whole file.',
    fen: '4k3/8/8/4r3/8/8/8/4R1K1 w - - 0 1',
  },
  {
    theme: 'promotion',
    title: 'Promotion',
    description:
      'Advancing a pawn to the eighth rank to transform it into a queen (or another piece). Promotion threats often decide endgames and can create unstoppable tactical sequences.',
    example:
      'A passed pawn on the seventh rank forces the opponent\'s rook into a passive defensive position, and the pawn promotes next move.',
    fen: '4k3/3P4/8/8/8/8/8/4K3 w - - 0 1',
  },
  {
    theme: 'endgame',
    title: 'Endgame',
    description:
      'Positions with few pieces remaining where king activity, pawn structure, and precise technique become critical. Endgame knowledge separates intermediate players from strong ones.',
    example:
      'With king and rook vs. king and rook, understanding the Lucena and Philidor positions determines whether you win or draw.',
    fen: '8/5k2/8/8/8/8/3KR3/8 w - - 0 1',
  },
  {
    theme: 'battery',
    title: 'Battery',
    description:
      'Lining up two or more pieces of the same type (or queen + bishop/rook) along a file, rank, or diagonal to multiply their attacking power. The front piece attacks while the back piece supports.',
    example:
      'Doubling rooks on an open file creates enormous pressure. The front rook attacks while the back rook provides support, making infiltration nearly unstoppable.',
    fen: '3rk3/8/8/8/8/8/8/3RR1K1 w - - 0 1', // doubled rooks
  },
  {
    theme: 'quiet-move',
    title: 'Quiet Move',
    description:
      'A subtle, non-forcing move that doesn\'t capture or give check but creates an unstoppable threat. Quiet moves are often the hardest to find because they lack the drama of tactics.',
    example:
      'Instead of a flashy sacrifice, a simple bishop retreat to a diagonal creates simultaneous threats of checkmate and piece capture that can\'t both be stopped.',
    fen: 'r1bq1rk1/pp2bppp/2n1pn2/2pp4/3P4/2PBPN2/PP1N1PPP/R1BQ1RK1 w - - 0 1',
  },
];
