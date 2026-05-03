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
      <PageSEO title="Chess Vocabulary — Tactical Themes & Patterns | Elucidate Chess" />

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
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.15 }}
                  variants={fadeUp}
                  custom={0}
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
