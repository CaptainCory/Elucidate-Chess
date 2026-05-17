import { LiveVisitorsBadge } from '@/components/LiveVisitorsBadge';
import { Link } from 'react-router-dom';
import { PageSEO } from '@/components/PageSEO';
import { ChessQuoteFooter } from '@/components/ChessQuoteFooter';
import { ChessBoard } from '@/components/ChessBoard';
import { Crown, ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface VocabEntry {
  slug: string;
  title: string;
  summary: string;
  description: string;
  fen: string;
  orientation: 'white' | 'black';
  keySquares: string;
  highlights: Record<string, React.CSSProperties>;
}

const hl = {
  attacker: { backgroundColor: 'hsla(38, 92%, 50%, 0.55)', boxShadow: 'inset 0 0 0 3px hsla(38, 92%, 50%, 0.8)' },
  target: { backgroundColor: 'hsla(0, 72%, 55%, 0.4)', boxShadow: 'inset 0 0 0 3px hsla(0, 72%, 55%, 0.7)' },
  move: { backgroundColor: 'hsla(142, 60%, 45%, 0.4)', boxShadow: 'inset 0 0 0 3px hsla(142, 60%, 45%, 0.7)' },
  line: { backgroundColor: 'hsla(210, 70%, 55%, 0.3)', boxShadow: 'inset 0 0 0 2px hsla(210, 70%, 55%, 0.5)' },
};

const vocabulary: VocabEntry[] = [
  {
    slug: 'fork',
    title: 'Fork',
    summary: 'One piece attacks two or more enemy pieces simultaneously.',
    description:
      'A fork happens when one of your pieces attacks two (or more) enemy pieces at the same time. Your opponent can only save one, so you win the other. Knights are the best at this because they can jump over pieces.',
    fen: 'r3k3/2N5/8/8/8/8/8/4K3 b - - 0 1',
    orientation: 'white',
    keySquares: 'The knight on c7 attacks the king and the rook at the same time. Black must move the king, so White captures the rook for free.',
    highlights: { c7: hl.attacker, e8: hl.target, a8: hl.target },
  },
  {
    slug: 'pin',
    title: 'Pin',
    summary: 'A piece cannot move because it would expose a more valuable piece behind it.',
    description:
      'A pin traps a piece in place. If the pinned piece moves, it would reveal a more valuable piece behind it (like the king or queen) to attack. A piece pinned to the king literally cannot move — it\'s against the rules.',
    fen: 'r1bqkb1r/ppp2ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1',
    orientation: 'white',
    keySquares: 'The bishop on b5 pins the knight on c6 to the king. The knight is stuck — moving it would put the king in check.',
    highlights: { b5: hl.attacker, c6: hl.target, e8: hl.line },
  },
  {
    slug: 'skewer',
    title: 'Skewer',
    summary: 'Attack a valuable piece that must move, exposing a piece behind it to capture.',
    description:
      'A skewer is like a pin in reverse. You attack a valuable piece (often the king) that is forced to move, and then you capture the less valuable piece hiding behind it.',
    fen: '3q4/8/8/3k4/8/8/8/4R1K1 w - - 0 1',
    orientation: 'white',
    keySquares: 'Rd1+ checks the king on d5. The king must move, and then the rook captures the queen on d8.',
    highlights: { e1: hl.attacker, d1: hl.move, d5: hl.target, d8: hl.target },
  },
  {
    slug: 'discovered-attack',
    title: 'Discovered Attack',
    summary: 'Moving one piece reveals an attack from a piece behind it.',
    description:
      'A discovered attack happens when you move a piece out of the way, revealing an attack from a piece behind it. If the revealed attack is a check, it\'s called a "discovered check" — and the piece you moved can go almost anywhere because your opponent must deal with the check first.',
    fen: '3qk3/8/8/4B3/4R3/8/8/6K1 w - - 0 1',
    orientation: 'white',
    keySquares: 'When the bishop moves off e5, it uncovers the rook\'s attack on the king along the e-file. The bishop can grab the queen while the king deals with the check.',
    highlights: { e5: hl.attacker, e4: hl.line, e8: hl.target, d8: hl.target },
  },
  {
    slug: 'back-rank-mate',
    title: 'Back Rank Mate',
    summary: 'A rook or queen delivers checkmate on the opponent\'s first rank.',
    description:
      'This happens when a king is trapped on the back rank by its own pawns. A rook or queen slides to the back rank and it\'s checkmate — the king has nowhere to go. To prevent this, you can push a pawn to give your king an escape square (called a "luft").',
    fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
    orientation: 'white',
    keySquares: 'Ra8# is checkmate. The king on g8 is boxed in by its own pawns on f7, g7, and h7 with no escape.',
    highlights: { a1: hl.attacker, a8: hl.move, g8: hl.target, f7: hl.line, g7: hl.line, h7: hl.line },
  },
  {
    slug: 'smothered-mate',
    title: 'Smothered Mate',
    summary: 'A knight delivers checkmate to a king surrounded by its own pieces.',
    description:
      'A smothered mate happens when a king is completely surrounded by its own pieces and a knight delivers checkmate. The king has no escape because its own army is in the way. It\'s rare but one of the most beautiful patterns in chess.',
    fen: '6rk/5Npp/8/8/8/8/8/6K1 b - - 0 1',
    orientation: 'white',
    keySquares: 'The knight on f7 is giving checkmate. The king on h8 can\'t escape — it\'s blocked by its own rook on g8 and pawns on g7 and h7.',
    highlights: { f7: hl.attacker, h8: hl.target, g8: hl.line, g7: hl.line, h7: hl.line },
  },
  {
    slug: 'deflection',
    title: 'Deflection',
    summary: 'Force a defending piece away from its critical duty.',
    description:
      'Deflection means forcing an important defending piece to leave its post. Once the defender moves away, the thing it was protecting becomes vulnerable. It often involves offering a sacrifice your opponent can\'t refuse.',
    fen: '1r4k1/5ppp/8/8/8/8/Q4PPP/4R1K1 w - - 0 1',
    orientation: 'white',
    keySquares: 'Qa8! attacks the rook, which is the only piece guarding the back rank. If the rook captures (Rxa8), White plays Re8# checkmate.',
    highlights: { a2: hl.attacker, a8: hl.move, b8: hl.target, e1: hl.line },
  },
  {
    slug: 'decoy',
    title: 'Decoy',
    summary: 'Lure an enemy piece to a specific square where it becomes vulnerable.',
    description:
      'A decoy lures an opponent\'s piece to a bad square, usually with a sacrifice. The difference from deflection: deflection pulls a piece away from its job, while a decoy draws a piece to a specific square where it gets into trouble.',
    fen: '4r1k1/5ppp/8/8/8/8/1Q3PPP/4R1K1 w - - 0 1',
    orientation: 'white',
    keySquares: 'Qb8! lures the rook to b8 (Rxb8). Now the e-file is wide open and Re8# is checkmate.',
    highlights: { b2: hl.attacker, b8: hl.move, e8: hl.target, e1: hl.line },
  },
  {
    slug: 'overloading',
    title: 'Overloading',
    summary: 'A piece has too many defensive responsibilities and cannot handle them all.',
    description:
      'An overloaded piece is trying to do two jobs at once. By attacking one of the things it\'s protecting, you force your opponent to choose which one to save — and they lose the other.',
    fen: '3r2k1/4qppp/8/4N3/8/8/5PPP/3R2K1 w - - 0 1',
    orientation: 'white',
    keySquares: 'Nxf7! The queen must protect both f7 and the d8 rook. If she takes the knight (Qxf7), Rxd8# is checkmate. If the king takes, Rxd8 wins the rook.',
    highlights: { e5: hl.attacker, f7: hl.move, e7: hl.target, d8: hl.line, d1: hl.line },
  },
  {
    slug: 'removing-the-defender',
    title: 'Removing the Defender',
    summary: 'Capture or deflect the piece guarding a key square or target.',
    description:
      'Removing the defender means getting rid of a piece that is protecting something important. Once the defender is gone — whether captured, traded off, or deflected away — the target it was guarding becomes exposed. This is one of the most reliable ways to turn a defended position into a winning one.',
    fen: '3r2k1/4qppp/8/4N3/8/8/5PPP/3R2K1 w - - 0 1',
    orientation: 'white',
    keySquares: 'Nxf7+! removes the queen, which defends the rook on d8. Once the queen is gone, Rxd8+ wins the rook and the game.',
    highlights: { e5: hl.attacker, f7: hl.move, e7: hl.target, d8: hl.line },
  },
  {
    slug: 'zwischenzug',
    title: 'Zwischenzug (In-Between Move)',
    summary: 'An unexpected intermediate move inserted before the expected continuation.',
    description:
      'A zwischenzug (German for "in-between move") is a surprise move you sneak in before doing what your opponent expects. Instead of recapturing right away, you throw in a check or threat first, then come back to recapture with an extra advantage.',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/8/2BpP3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',
    orientation: 'white',
    keySquares: 'Black just took on d4 and expects White to recapture. Instead, Bxf7+! is a sneaky in-between check — White wins an extra pawn before taking back on d4.',
    highlights: { c4: hl.attacker, f7: hl.move, d4: hl.line, e8: hl.target },
  },
  {
    slug: 'sacrifice',
    title: 'Sacrifice',
    summary: 'Deliberately giving up material to gain a greater advantage.',
    description:
      'A sacrifice is when you intentionally give up a piece to get something bigger in return — like a checkmate attack, a winning position, or a decisive advantage. The best sacrifices look crazy at first but lead to forced wins.',
    fen: 'r1bq1rk1/ppp2ppp/2n1pn2/3p4/3P4/3BPN2/PPP2PPP/R1BQK2R w KQ - 0 1',
    orientation: 'white',
    keySquares: 'Bxh7+! sacrifices the bishop to tear open Black\'s king. After Kxh7, Ng5+ and Qh5 create an unstoppable attack.',
    highlights: { d3: hl.attacker, h7: hl.move, f3: hl.line, g8: hl.target },
  },
  {
    slug: 'battery',
    title: 'Battery',
    summary: 'Two or more pieces line up on the same file, rank, or diagonal to amplify their power.',
    description:
      'A battery is when you line up two or more pieces on the same file, rank, or diagonal so they combine their power. A classic example is a queen and bishop aiming down the same diagonal toward the enemy king.',
    fen: 'r4rk1/ppp2ppp/3b4/3p4/8/3B4/PPP1QPPP/R4RK1 w - - 0 1',
    orientation: 'white',
    keySquares: 'The queen on e2 and bishop on d3 are lined up along the b1-h7 diagonal, pointing straight at Black\'s king.',
    highlights: { e2: hl.attacker, d3: hl.attacker, h7: hl.target, g8: hl.line },
  },
  {
    slug: 'ladder-mate',
    title: 'Ladder Mate (Staircase Mate)',
    summary: 'Two rooks (or rook and queen) alternate checks to push the king to the edge and deliver mate.',
    description:
      'The ladder mate is one of the first checkmates you should learn. Two rooks take turns giving check, pushing the enemy king one row at a time toward the edge of the board, where it gets checkmated.',
    fen: '8/8/8/8/8/8/1k6/R1R1K3 w - - 0 1',
    orientation: 'white',
    keySquares: 'The two rooks take turns checking — Ra2+, then Rc3+ — walking the king to the edge step by step until it\'s checkmate.',
    highlights: { a1: hl.attacker, c1: hl.attacker, a2: hl.move, b2: hl.target },
  },
  {
    slug: 'x-ray',
    title: 'X-Ray (X-Ray Attack)',
    summary: 'A piece exerts influence through an enemy piece to a square beyond it.',
    description:
      'An x-ray happens when a long-range piece (bishop, rook, or queen) "sees through" an enemy piece to a square behind it. If the blocking piece moves or gets captured, the x-ray piece springs into action.',
    fen: '4k3/8/8/4r3/8/8/4R3/4K3 w - - 0 1',
    orientation: 'white',
    keySquares: 'The white rook on e2 x-rays through the black rook on e5. If the black rook moves off the e-file, Re8+ checks the king.',
    highlights: { e2: hl.attacker, e5: hl.line, e8: hl.target },
  },
  {
    slug: 'promotion',
    title: 'Pawn Promotion',
    summary: 'A pawn reaches the far end of the board and transforms into a more powerful piece.',
    description:
      'When a pawn reaches the other side of the board, it promotes — you can turn it into a queen, rook, bishop, or knight. Most of the time you pick a queen. Many endgames are all about getting a pawn to the finish line.',
    fen: '8/4P1k1/8/8/8/8/8/4K3 w - - 0 1',
    orientation: 'white',
    keySquares: 'The white pawn on e7 is one step away from becoming a queen with e8=Q.',
    highlights: { e7: hl.attacker, e8: hl.move },
  },
  {
    slug: 'attraction',
    title: 'Attraction',
    summary: 'Force an enemy piece to a square where it can be attacked or leads to a winning tactic.',
    description:
      'Attraction is when you force an opponent\'s piece — usually the king — to move to a specific square where it becomes vulnerable. This is often done with a check or a sacrifice that the opponent must accept, pulling them into danger.',
    fen: '4k3/4p3/8/8/8/8/4Q3/4K2R w K - 0 1',
    orientation: 'white',
    keySquares: 'Qe6! forces the king toward the corner. After Kf8 or Kd8, Qe8# or Rh8# delivers checkmate — the king was attracted to a fatal square.',
    highlights: { e2: hl.attacker, e6: hl.move, e8: hl.target, h1: hl.line },
  },
  {
    slug: 'double-check',
    title: 'Double Check',
    summary: 'Two pieces give check at the same time — the king must move.',
    description:
      'A double check happens when a single move gives check from two pieces at once. Because you can\'t block or capture two attackers in one move, the king is forced to move. Double checks are devastating and often lead to forced mates.',
    fen: 'r3k3/ppp5/1NR5/8/B7/8/8/4K3 w q - 0 1',
    orientation: 'white',
    keySquares: 'Nd7 would be a discovered check from the bishop on a4 AND a check from the knight itself. The king on e8 has nowhere to hide — it must move.',
    highlights: { b6: hl.attacker, a4: hl.attacker, e8: hl.target, d7: hl.move },
  },
  {
    slug: 'windmill',
    title: 'Windmill',
    summary: 'Repeating discovered checks that scoop up material every cycle.',
    description:
      'A windmill is a tactical sequence of repeated discovered checks. One piece shuffles back and forth, revealing a check each time and grabbing material on every move. Your opponent is forced to keep responding to checks while you clean up the board.',
    fen: '6k1/5ppp/8/8/8/8/4RPPP/6K1 w - - 0 1',
    orientation: 'white',
    keySquares: 'A rook on the 7th rank paired with a bishop can swing in and out — each swing checks the king and grabs another pawn or piece.',
    highlights: { e2: hl.attacker, g7: hl.target, g8: hl.target },
  },
  {
    slug: 'trapped-piece',
    title: 'Trapped Piece',
    summary: 'A piece has no safe squares and will be lost.',
    description:
      'A trapped piece is one that has run out of safe places to go. Even if it isn\'t attacked yet, you can corner it with a slow squeeze — taking away escape squares one by one until it falls.',
    fen: '4k3/8/8/8/b7/8/1P6/N3K3 w - - 0 1',
    orientation: 'white',
    keySquares: 'The bishop on a4 looks active, but b3 traps it — every retreat square is covered. Next move it\'s gone.',
    highlights: { a4: hl.target, b2: hl.attacker },
  },
  {
    slug: 'mating-net',
    title: 'Mating Net',
    summary: 'A web of threats from which the enemy king cannot escape.',
    description:
      'A mating net is a slower kind of checkmate. Instead of a single forcing combination, you weave multiple pieces around the enemy king, cutting off escape squares one at a time until mate is unavoidable.',
    fen: '6k1/5ppp/8/8/8/5N2/5PPP/3Q2K1 w - - 0 1',
    orientation: 'white',
    keySquares: 'The knight on f3 and queen on d1 coordinate to cover every escape — Qd8+ followed by Ng5 closes the net around the g8 king.',
    highlights: { d1: hl.attacker, f3: hl.attacker, g8: hl.target, d8: hl.move },
  },
  {
    slug: 'perpetual-check',
    title: 'Perpetual Check',
    summary: 'A repeating sequence of checks that forces a draw.',
    description:
      'Perpetual check is a rescue tool. When you\'re losing, finding a series of checks the opponent can\'t escape forces a draw by repetition. The opposing king is safe but stuck dancing between the same squares forever.',
    fen: '6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1',
    orientation: 'white',
    keySquares: 'Qd8+ Kh7, Qd3+ Kg8, Qd8+ — the king shuttles between g8 and h7 forever. It\'s a draw.',
    highlights: { d1: hl.attacker, g8: hl.target, d8: hl.move },
  },
  {
    slug: 'check',
    title: 'Check',
    summary: 'A direct attack on the enemy king that must be answered immediately.',
    description:
      'A check is any move that attacks the opposing king. The defender must respond right away — block the check, capture the checking piece, or move the king. Checks are forcing moves, which makes them powerful building blocks for tactics and attacks.',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 2 3',
    orientation: 'white',
    keySquares: 'Qxf7+ delivers check directly on the f7 pawn next to the black king — Black must respond on the very next move.',
    highlights: { f3: hl.attacker, c4: hl.attacker, f7: hl.move, e8: hl.target },
  },
  {
    slug: 'double-attack',
    title: 'Double Attack',
    summary: 'A single move that creates two threats at once.',
    description:
      'A double attack is the umbrella idea behind forks and discovered attacks: one move generates two simultaneous threats. The defender can usually only address one, so the other lands. Spotting double attacks is a core tactical skill.',
    fen: 'r3k2r/ppp2ppp/2n5/3qp3/3P4/2N5/PPP2PPP/R2QKB1R w KQkq - 0 1',
    orientation: 'white',
    keySquares: 'd4xe5 attacks the d5 queen and frees up the d-file pressure at the same time — two threats from one quiet pawn move.',
    highlights: { d4: hl.move, e5: hl.target, d5: hl.target },
  },
  {
    slug: 'back-rank',
    title: 'Back Rank',
    summary: 'A weak back rank where the king is hemmed in by its own pawns.',
    description:
      'A "back rank" theme covers any tactic or threat that exploits a king stuck on its starting rank behind its own pawns. It includes back-rank mate ideas, but also threats like luring defenders away, deflections, and quiet moves that prepare a future invasion on the 1st or 8th rank.',
    fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
    orientation: 'white',
    keySquares: 'The rook eyes d8 with nothing in the way — Black\'s f7/g7/h7 pawns lock the king on the 8th rank, so any quiet rook lift to the back rank is decisive.',
    highlights: { d1: hl.attacker, g8: hl.target, d8: hl.move },
  },
  {
    slug: 'fortress',
    title: 'Fortress',
    summary: 'A defensive setup that the opponent cannot break through, securing a draw.',
    description:
      'A fortress is a position where the weaker side creates an impenetrable defensive shell. Even with less material, the defender arranges their pieces so the stronger side has no way to break in. Common fortresses involve a king tucked safely in the corner with a minor piece, or a rook that keeps giving checks from behind.',
    fen: '8/8/8/8/8/5k2/6b1/7K w - - 0 1',
    orientation: 'white',
    keySquares: 'The white king is safe on h1 because the black bishop on g2 is a light-squared bishop and cannot attack the dark-squared h1 corner. The king has built an impregnable fortress.',
    highlights: { h1: hl.target, g2: hl.attacker, f3: hl.attacker },
  },
  {
    slug: 'umbrella-pawn',
    title: 'Umbrella Pawn',
    summary: 'A pawn shelter that protects the king from checks and attacks, common in endgames.',
    description:
      'An umbrella pawn is a defensive formation where pawns on the 2nd rank (for White) or 7th rank (for Black) create a protective canopy over the king. This structure is especially valuable in rook endgames, where the pawns shield the king from frontal checks and allow the defender to hold a draw.',
    fen: '6k1/8/8/8/8/8/5PPP/6K1 w - - 0 1',
    orientation: 'white',
    keySquares: 'The pawns on f2, g2, and h2 form an umbrella shelter over the white king on g1, protecting it from checks along the g-file and h-file.',
    highlights: { g1: hl.target, f2: hl.attacker, g2: hl.attacker, h2: hl.attacker },
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

export default function VocabularyPage() {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <PageSEO
        title="Chess Vocabulary — Tactical Themes"
        description="Master the building blocks of chess tactics. Browse pins, forks, skewers, discovered attacks, and other patterns with illustrated board diagrams."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Chess Vocabulary — Tactical Themes & Patterns',
          description: 'Curated collection of chess tactical themes and patterns with illustrated board diagrams.',
          url: 'https://elucidatechess.com/vocabulary',
          isPartOf: { '@type': 'WebSite', name: 'Elucidate Chess', url: 'https://elucidatechess.com' },
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: vocabulary.map((v, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: v.title,
              description: v.summary,
            })),
          },
        }}
        jsonLdId="vocabulary"
      />

      {/* Nav */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold font-display text-foreground">Elucidate Chess</span>
            <LiveVisitorsBadge />
          </div>
          <div className="flex items-center gap-3">
            <Link to="/landing">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <Link to="/play">
              <Button size="sm">Start Training</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="py-12 md:py-20 border-b border-border/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <BookOpen className="w-4 h-4" />
              Chess Vocabulary
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4 leading-[1.1]"
            >
              Tactical Themes & Patterns
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Master the building blocks of chess tactics. Each concept includes a board diagram so you can see the pattern in action.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Vocabulary Grid */}
      <section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid gap-6">
            {vocabulary.map((entry, i) => {
              const isExpanded = expandedSlug === entry.slug;
              return (
                <motion.div
                  key={entry.slug}
                  id={entry.slug}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.15 }}
                  variants={fadeUp}
                  custom={0}
                  className="scroll-mt-24"
                >
                  <div
                    onClick={() => setExpandedSlug(isExpanded ? null : entry.slug)}
                    className="cursor-pointer w-full text-left chess-card rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedSlug(isExpanded ? null : entry.slug); } }}
                  >
                    <div className="p-5 md:p-6 flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-display text-lg md:text-xl font-semibold text-foreground mb-1">
                          {entry.title}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">{entry.summary}</p>
                      </div>
                      <div
                        className={`flex-shrink-0 w-6 h-6 flex items-center justify-center text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="border-t border-border/50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-5 md:p-8 flex flex-col gap-6 items-center">
                          <div className="w-full">
                            <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-4">
                              {entry.description}
                            </p>
                            <p className="text-sm md:text-base text-primary font-medium leading-relaxed">
                              {entry.keySquares}
                            </p>
                          </div>
                          <div className="w-full max-w-[480px]">
                            <ChessBoard
                              fen={entry.fen}
                              orientation={entry.orientation}
                              interactive={false}
                              externalSquareStyles={entry.highlights}
                            />
                          </div>
                          <Link
                            to={`/positions/theme/${entry.slug}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium transition-colors"
                          >
                            Practice {entry.title} positions →
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <ChessQuoteFooter />
    </div>
  );
}
