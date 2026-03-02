import type { ChessTheme } from '@/data/chessPuzzles';
import React from 'react';

export interface ThemeEntry {
  theme: ChessTheme;
  title: string;
  description: string;
  example: string;
  fen: string;
  highlights: Record<string, React.CSSProperties>;
}

const accent = (opacity = 0.55) => ({ backgroundColor: `hsla(38, 92%, 50%, ${opacity})` });
const danger = (opacity = 0.5) => ({ backgroundColor: `hsla(0, 75%, 55%, ${opacity})` });
const info = (opacity = 0.45) => ({ backgroundColor: `hsla(200, 80%, 50%, ${opacity})` });

export const themeEntries: ThemeEntry[] = [
  {
    theme: 'fork',
    title: 'Fork',
    description:
      'A single piece attacks two or more enemy pieces at the same time, forcing the opponent to lose material because they can only save one.',
    example:
      'The white knight on c7 simultaneously attacks the king on e8 and the rook on a8. Black must move the king, losing the rook.',
    // Nc7 forks Ke8 and Ra8
    fen: 'r3k3/2N5/8/8/8/8/8/4K3 w q - 0 1',
    highlights: { c7: accent(), a8: danger(), e8: danger() },
  },
  {
    theme: 'pin',
    title: 'Pin',
    description:
      'A piece attacks an enemy piece that cannot move without exposing a more valuable piece behind it. An absolute pin involves the king — the pinned piece literally cannot move.',
    example:
      'The white bishop on b5 pins the knight on c6 to the king on e8. The knight cannot move because it would leave the king in check.',
    // Bb5 pins Nc6 to Ke8
    fen: 'r1bqkb1r/ppp2ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1',
    highlights: { b5: accent(), c6: danger(), e8: danger() },
  },
  {
    theme: 'skewer',
    title: 'Skewer',
    description:
      'The reverse of a pin — a more valuable piece is attacked and forced to move, exposing a less valuable piece behind it to capture.',
    example:
      'The white rook checks the king on a8. The king must move, and the rook captures the queen on a4.',
    // Ra1 skewers Ka8 through to Qa4
    fen: 'k7/8/8/8/q7/8/8/R5K1 w - - 0 1',
    highlights: { a1: accent(), a8: danger(), a4: danger() },
  },
  {
    theme: 'discovered-attack',
    title: 'Discovered Attack',
    description:
      'Moving one piece reveals an attack from another piece behind it. When the revealed attack is a check, it\'s called a discovered check — one of the most powerful tactical weapons.',
    example:
      'When the white knight on e6 moves (e.g. Nc5), it uncovers the rook on d1 which now attacks the undefended rook on d8.',
    // Ne6 blocks Rd1→Rd8. Moving the knight discovers the rook attack.
    fen: '3r1k2/8/4N3/8/8/8/8/3R2K1 w - - 0 1',
    highlights: { e6: accent(), d1: info(), d8: danger() },
  },
  {
    theme: 'double-check',
    title: 'Double Check',
    description:
      'A special case of discovered attack where both the moving piece and the uncovered piece give check. The only defense is to move the king — blocking or capturing won\'t work.',
    example:
      'The knight jumps from e4 to d6, giving check. This also uncovers the rook on e1 which checks along the e-file. Two checks at once — only the king can move.',
    // Ne4→Nd6+ discovers Re1-e8+ double check
    fen: '4k3/8/8/8/4N3/8/8/4RK2 w - - 0 1',
    highlights: { e4: accent(), e1: info(), e8: danger() },
  },
  {
    theme: 'deflection',
    title: 'Deflection',
    description:
      'Forcing a defending piece away from a critical square or duty. Once the defender is deflected, the position it was guarding collapses.',
    example:
      'The black rook on d8 guards against Re8#. White plays Qa8!, forcing Rxa8 — but now Re8# is unstoppable.',
    // Rd8 guards back rank, Qa8 deflects it
    fen: '3r2k1/5ppp/8/8/8/8/Q4PPP/4R1K1 w - - 0 1',
    highlights: { a2: accent(), d8: danger(), e1: info() },
  },
  {
    theme: 'decoy',
    title: 'Decoy',
    description:
      'Luring an enemy piece to a specific square where it becomes vulnerable — the opposite side of deflection. You\'re pulling a piece toward danger rather than away from its duty.',
    example:
      'White plays Bxf7+!, decoying the king to f7. After Kxf7, the queen on d7 is left undefended and falls to Qxd7.',
    // Bxf7+ decoys Kg8 to f7, exposing Qd7
    fen: 'r4rk1/pppq1ppp/8/8/2B5/8/PPP2PPP/R2Q1RK1 w - - 0 1',
    highlights: { c4: accent(), f7: danger(), d7: danger() },
  },
  {
    theme: 'overloading',
    title: 'Overloading',
    description:
      'Exploiting a piece that\'s defending too many things at once. When one defender has multiple responsibilities, you attack one of them and something else falls.',
    example:
      'The black queen on e6 must defend both the rook on d7 and guard against Re8#. White plays Qxd7! — if Qxd7, then Re8# is mate.',
    // Qe6 overloaded guarding d7 rook + back rank
    fen: '4r1k1/3r1ppp/4q3/8/8/5Q2/5PPP/4R1K1 w - - 0 1',
    highlights: { f3: accent(), e6: danger(), d7: danger(), e8: info() },
  },
  {
    theme: 'removing-the-defender',
    title: 'Removing the Defender',
    description:
      'Capturing or driving away a piece that protects something important. Once the guardian is gone, the thing it was protecting becomes vulnerable.',
    example:
      'The knight on f6 is the only piece defending h7. White plays Bxf6, removing the defender, and now Qxh7# is checkmate.',
    // Nf6 defends h7, bishop removes it
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/2b1p1B1/4P3/3P1N2/PPP2PPP/RN1QKB1R w KQ - 0 1',
    highlights: { g5: accent(), f6: danger(), h7: info() },
  },
  {
    theme: 'zwischenzug',
    title: 'Zwischenzug (In-Between Move)',
    description:
      'Instead of making the expected move (like a recapture), you insert an unexpected intermediate move — often a check or threat — that improves your position before continuing the sequence.',
    example:
      'Black just captured on c3 with the bishop. Instead of recapturing immediately, White plays Ng5! threatening Qxh7#. Black must deal with the mate threat first, and then White recaptures on c3 with a better position.',
    fen: 'rn3rk1/2qn1ppp/ppb1p3/4P3/P4B2/2b2N2/2Q1BPPP/R2R2K1 w - - 0 1',
    highlights: { f3: accent(), c3: danger(), h7: info() },
  },
  {
    theme: 'trapped-piece',
    title: 'Trapped Piece',
    description:
      'A piece has no safe squares to retreat to. Even if it\'s a powerful piece like a queen or rook, it can be captured because it has nowhere to escape.',
    example:
      'The white bishop ventured to b6 to grab a pawn, but after ...c5 and ...Qb8, all retreat squares are blocked. The bishop is trapped and will be captured.',
    // Bishop trapped on a7 after a6, b8 controlled
    fen: 'rq2kb1r/B1pp1ppp/p1n1pn2/8/4P3/5N2/PPPP1PPP/RN1QKB1R b KQkq - 0 1',
    highlights: { a7: danger() },
  },
  {
    theme: 'back-rank-checkmate',
    title: 'Back-Rank Checkmate',
    description:
      'A rook or queen delivers checkmate on the first or eighth rank because the enemy king is trapped behind its own pawns with no escape squares.',
    example:
      'The king on g8 is boxed in by its own pawns on f7, g7, h7. White slides the rook to e8 — checkmate, nowhere to run.',
    fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
    highlights: { e1: accent(), e8: info(), g8: danger() },
  },
  {
    theme: 'smothered-mate',
    title: 'Smothered Mate',
    description:
      'A knight delivers checkmate to a king that is completely surrounded by its own pieces and cannot move. One of the most elegant patterns in chess.',
    example:
      'After the queen sacrifice Qg8+! Rxg8, the knight delivers Nf7# — the king on h8 is completely hemmed in by its own rook on g8 and pawns on g7, h7.',
    // Final position of Philidor's smothered mate: Nf7# with Kh8, Rg8, pawns g7 h7
    fen: '6rk/5Npp/8/8/8/8/8/6K1 b - - 0 1',
    highlights: { f7: accent(), h8: danger(), g8: info(), g7: info(), h7: info() },
  },
  {
    theme: 'checkmate',
    title: 'Checkmate',
    description:
      'The ultimate goal — the king is in check and has no legal move to escape. Recognizing checkmate patterns helps you spot winning opportunities faster.',
    example:
      'The two rooks work together in a "ladder mate" — one rook cuts off ranks while the other delivers check, driving the king to the edge step by step.',
    // Two rooks ready for ladder mate
    fen: '6k1/8/8/8/8/8/1R6/R5K1 w - - 0 1',
    highlights: { a1: accent(), b2: accent() },
  },
  {
    theme: 'sacrifice',
    title: 'Sacrifice',
    description:
      'Deliberately giving up material (a pawn, piece, or even the queen) to gain a greater advantage — whether it\'s checkmate, a winning attack, or a decisive positional edge.',
    example:
      'White sacrifices the bishop with Bxh7+! The king\'s pawn shield is ripped open, and the remaining pieces (queen, knight) swarm in for a decisive attack.',
    // Classic Bxh7+ Greek Gift sacrifice position
    fen: 'r1bq1rk1/pppnnppp/4p3/3pP3/1b1P4/2NB1N2/PPP2PPP/R1BQ1RK1 w - - 0 1',
    highlights: { d3: accent(), h7: danger() },
  },
  {
    theme: 'hanging-piece',
    title: 'Hanging Piece',
    description:
      'An undefended piece that can be captured for free. Spotting hanging pieces — both yours and your opponent\'s — is one of the most important skills at every level.',
    example:
      'The black knight on d5 is completely undefended — no pawn, piece, or other support protects it. White simply captures it for free.',
    // Undefended knight on d5
    fen: 'r1bqkb1r/pppp1ppp/2n5/3np3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1',
    highlights: { d5: danger() },
  },
  {
    theme: 'x-ray',
    title: 'X-Ray',
    description:
      'A piece exerts influence through another piece to a square behind it. It\'s like having X-ray vision — your piece \'sees through\' an obstacle to attack or defend a distant square.',
    example:
      'White\'s rook on e1 "sees through" the black rook on e5 to defend e8. If the e5 rook moves off the file, White\'s rook controls the entire e-file.',
    // Re1 x-rays through Re5 to control e8
    fen: '4k3/8/8/4r3/8/8/8/4R1K1 w - - 0 1',
    highlights: { e1: accent(), e5: info(), e8: info() },
  },
  {
    theme: 'promotion',
    title: 'Promotion',
    description:
      'Advancing a pawn to the eighth rank to transform it into a queen (or another piece). Promotion threats often decide endgames and can create unstoppable tactical sequences.',
    example:
      'The white pawn on d7 is one step from promotion. The black king on b8 is too far to stop it — d8=Q creates a new queen and wins the game.',
    fen: '1k6/3P4/8/8/8/8/8/4K3 w - - 0 1',
    highlights: { d7: accent(), d8: info(), b8: danger() },
  },
  {
    theme: 'endgame',
    title: 'Endgame',
    description:
      'Positions with few pieces remaining where king activity, pawn structure, and precise technique become critical. Endgame knowledge separates intermediate players from strong ones.',
    example:
      'King and pawn vs. king — the most fundamental endgame. White must use "opposition" (kings facing each other with one square between) to escort the pawn to promotion.',
    // K+P vs K, classic opposition endgame
    fen: '8/8/4k3/4p3/4K3/8/8/8 w - - 0 1',
    highlights: { e4: accent(), e6: danger(), e5: info() },
  },
  {
    theme: 'battery',
    title: 'Battery',
    description:
      'Lining up two or more pieces of the same type (or queen + bishop/rook) along a file, rank, or diagonal to multiply their attacking power. The front piece attacks while the back piece supports.',
    example:
      'White\'s doubled rooks on the d-file create enormous pressure. The front rook attacks while the back rook supports it — any piece on the d-file will face double firepower.',
    // Doubled rooks on d-file aiming at Black's position
    fen: 'r2qk2r/ppp2ppp/2n1bn2/3pp3/8/8/PPP2PPP/1R1R2K1 w kq - 0 1',
    highlights: { b1: accent(), d1: accent() },
  },
  {
    theme: 'quiet-move',
    title: 'Quiet Move',
    description:
      'A subtle, non-forcing move that doesn\'t capture or give check but creates an unstoppable threat. Quiet moves are often the hardest to find because they lack the drama of tactics.',
    example:
      'Instead of a flashy sacrifice, White plays the calm Qd3 — a quiet move that simultaneously threatens Qxh7# and Qxa6, and both can\'t be stopped.',
    fen: 'r1b2rk1/pp3ppp/2p1pn2/q2p4/3P4/P1NBPN2/1PQ2PPP/R4RK1 w - - 0 1',
    highlights: { c2: accent(), h7: info() },
  },
];
