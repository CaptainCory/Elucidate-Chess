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
  keySquares: string; // narrative hint about what to look at
}

const vocabulary: VocabEntry[] = [
  {
    slug: 'fork',
    title: 'Fork',
    summary: 'One piece attacks two or more enemy pieces simultaneously.',
    description:
      'A fork is one of the most common tactical motifs. A single piece — often a knight — attacks two or more enemy pieces at the same time, guaranteeing material gain because the opponent can only save one. Knights are especially dangerous forkers because they jump over pieces and attack squares of the opposite color to the one they stand on.',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    orientation: 'white',
    keySquares: 'The knight on f3 eyes key central squares; after Ng5, it can target f7 with the bishop.',
  },
  {
    slug: 'pin',
    title: 'Pin',
    summary: 'A piece cannot move because it would expose a more valuable piece behind it.',
    description:
      'A pin occurs when a piece is attacked along a line (file, rank, or diagonal) and cannot move without exposing a more valuable piece behind it — typically the king (absolute pin) or the queen (relative pin). Bishops and rooks are the most common pinning pieces. Pins restrict the opponent\'s mobility and often win material.',
    fen: 'r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
    orientation: 'white',
    keySquares: 'The bishop on c4 pins the pawn structure along the a2-g8 diagonal toward the king.',
  },
  {
    slug: 'skewer',
    title: 'Skewer',
    summary: 'Attack a valuable piece that must move, exposing a piece behind it to capture.',
    description:
      'A skewer is the reverse of a pin. A more valuable piece is attacked first and forced to move, revealing a less valuable piece behind it that can be captured. For example, a bishop might check a king along a diagonal; when the king moves, a rook behind it is captured. Skewers are devastating in endgames.',
    fen: '4k3/8/8/8/8/8/4R3/4K3 w - - 0 1',
    orientation: 'white',
    keySquares: 'The rook on e2 can skewer the king along the e-file if Black\'s king and a piece line up.',
  },
  {
    slug: 'discovered-attack',
    title: 'Discovered Attack',
    summary: 'Moving one piece reveals an attack from a piece behind it.',
    description:
      'A discovered attack happens when a piece moves out of the way, unmasking an attack from a long-range piece (bishop, rook, or queen) behind it. When the revealed attack is a check, it\'s called a discovered check — extremely powerful because the moving piece can go almost anywhere with impunity while the opponent must deal with the check.',
    fen: 'r1bqkbnr/pppppppp/2n5/8/4P3/3B4/PPPP1PPP/RNBQK1NR w KQkq - 2 3',
    orientation: 'white',
    keySquares: 'If a piece moves off the d-file, the bishop on d3 could be revealed along a diagonal.',
  },
  {
    slug: 'back-rank-mate',
    title: 'Back Rank Mate',
    summary: 'A rook or queen delivers checkmate on the opponent\'s first rank.',
    description:
      'The back rank mate exploits a king trapped behind its own pawns on the first (or eighth) rank. A rook or queen slides to the back rank and delivers checkmate because the king has no escape squares — its own pawns block the way. This is one of the most important tactical patterns to watch for, both offensively and defensively. Creating a "luft" (pawn move to give the king an escape) is the main preventive measure.',
    fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
    orientation: 'white',
    keySquares: 'Ra8# is checkmate — the king on g8 is trapped by its own pawns on f7, g7, h7.',
  },
  {
    slug: 'smothered-mate',
    title: 'Smothered Mate',
    summary: 'A knight delivers checkmate to a king surrounded by its own pieces.',
    description:
      'The smothered mate is an elegant checkmate pattern where a knight delivers the final blow to a king completely boxed in by its own pieces. The classic pattern often involves a queen sacrifice to force the king into a corner, then the knight lands the checkmate. It\'s rare but stunning when it appears in a game.',
    fen: '6rk/5Npp/8/8/8/8/8/4K3 w - - 0 1',
    orientation: 'white',
    keySquares: 'The knight on f7 can deliver checkmate if the king is forced to h8 and hemmed in by its rook and pawns.',
  },
  {
    slug: 'deflection',
    title: 'Deflection',
    summary: 'Force a defending piece away from its critical duty.',
    description:
      'Deflection is a tactical theme where you force a key defensive piece to abandon its post. For example, if a queen is defending a back rank mate, you might attack the queen in a way that forces it to move, allowing the back rank mate to land. Deflection often combines with other tactics and frequently involves a sacrifice.',
    fen: 'r4rk1/1b1qbppp/p3pn2/1p6/3N4/1BNQ4/PPP2PPP/R4RK1 w - - 0 1',
    orientation: 'white',
    keySquares: 'White\'s centralized pieces coordinate for potential tactical shots involving deflection of Black\'s defenders.',
  },
  {
    slug: 'decoy',
    title: 'Decoy',
    summary: 'Lure an enemy piece to a specific square where it becomes vulnerable.',
    description:
      'A decoy sacrifice lures an opponent\'s piece to a particular square — usually with a sacrifice — where it becomes vulnerable to a follow-up tactic. The key difference from deflection: deflection pulls a piece away from defense, while a decoy draws a piece to a specific square. Queen sacrifices that force the king to a dangerous square are classic decoy motifs.',
    fen: '3qk3/8/8/8/8/8/4Q3/4K3 w - - 0 1',
    orientation: 'white',
    keySquares: 'White may sacrifice the queen to lure the king to a compromised square.',
  },
  {
    slug: 'overloading',
    title: 'Overloading',
    summary: 'A piece has too many defensive responsibilities and cannot handle them all.',
    description:
      'An overloaded piece is one that is assigned multiple defensive tasks simultaneously and cannot fulfill all of them. By attacking one of the things the overloaded piece protects, you force the opponent to choose which duty to abandon. This often results in winning material or achieving checkmate. Recognizing overloaded pieces is a hallmark of strong tactical vision.',
    fen: 'r1b1k2r/ppppqppp/2n2n2/4p3/2B1P1b1/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6',
    orientation: 'white',
    keySquares: 'Multiple pieces have overlapping defensive duties creating potential overloading opportunities.',
  },
  {
    slug: 'zwischenzug',
    title: 'Zwischenzug (In-Between Move)',
    summary: 'An unexpected intermediate move inserted before the expected continuation.',
    description:
      'Zwischenzug (German for "intermediate move") is when a player inserts an unexpected move — often a check or a threat — before making the expected recapture or continuation. This in-between move changes the evaluation of the position entirely. It\'s one of the trickiest tactical ideas because it breaks the "automatic" flow of a sequence.',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2BnP3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    orientation: 'white',
    keySquares: 'Instead of recapturing immediately, look for an in-between check or threat first.',
  },
  {
    slug: 'sacrifice',
    title: 'Sacrifice',
    summary: 'Deliberately giving up material to gain a greater advantage.',
    description:
      'A sacrifice is the intentional giving up of material (a pawn, piece, exchange, or even the queen) to gain a compensating advantage — whether it\'s checkmate, a decisive attack, better piece activity, or a winning endgame. Sacrifices can be tactical (calculable to a forced win) or positional (long-term compensation). The most beautiful games in chess history often feature brilliant sacrifices.',
    fen: 'r1b1k2r/ppppqppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6',
    orientation: 'white',
    keySquares: 'A piece sacrifice on f7 or d5 could blow open the position.',
  },
  {
    slug: 'battery',
    title: 'Battery',
    summary: 'Two or more pieces line up on the same file, rank, or diagonal to amplify their power.',
    description:
      'A battery is created when two or more pieces of the same type (or compatible type) line up on the same file, rank, or diagonal. The classic battery is a queen and bishop on the same diagonal, or two rooks doubled on an open file. Batteries concentrate firepower on a single target and are especially powerful when aimed at the opponent\'s king.',
    fen: 'r4rk1/ppp2ppp/3b4/3p4/8/3B4/PPP1QPPP/R4RK1 w - - 0 1',
    orientation: 'white',
    keySquares: 'The queen on e2 and bishop on d3 can form a battery along the b1-h7 diagonal.',
  },
  {
    slug: 'ladder-mate',
    title: 'Ladder Mate (Staircase Mate)',
    summary: 'Two rooks (or rook and queen) alternate checks to push the king to the edge and deliver mate.',
    description:
      'The ladder mate — also called the staircase mate or lawnmower mate — is one of the first checkmate patterns beginners learn. Two major pieces (typically two rooks) alternate giving check, driving the enemy king rank by rank (or file by file) toward the edge of the board, where checkmate is delivered. Each check forces the king one step closer to its doom.',
    fen: '8/8/8/8/8/8/1k6/R1R1K3 w - - 0 1',
    orientation: 'white',
    keySquares: 'The two rooks will alternate checks — Ra2+, then the other rook on the next rank — walking the king to the edge.',
  },
  {
    slug: 'x-ray',
    title: 'X-Ray (X-Ray Attack)',
    summary: 'A piece exerts influence through an enemy piece to a square beyond it.',
    description:
      'An x-ray attack occurs when a long-range piece (bishop, rook, or queen) attacks or defends through an enemy piece. The attacking piece "sees through" the obstruction. This is important in both tactics (the blocking piece might move or be captured) and in endgames where rooks x-ray each other along a file. Recognizing x-ray patterns helps you evaluate positions more accurately.',
    fen: '4k3/8/8/4r3/8/8/4R3/4K3 w - - 0 1',
    orientation: 'white',
    keySquares: 'The white rook on e2 x-rays through the black rook on e5 to the king on e8.',
  },
  {
    slug: 'promotion',
    title: 'Pawn Promotion',
    summary: 'A pawn reaches the far end of the board and transforms into a more powerful piece.',
    description:
      'When a pawn reaches the eighth rank (or first rank for Black), it promotes — becoming a queen, rook, bishop, or knight of the same color. Promotion to a queen is most common, but underpromotion (choosing a knight, for example, to deliver a fork or avoid stalemate) creates some of chess\'s most beautiful tactical moments. Endgames often revolve entirely around whether a pawn can promote.',
    fen: '8/4P1k1/8/8/8/8/8/4K3 w - - 0 1',
    orientation: 'white',
    keySquares: 'The white pawn on e7 is one square away from promotion to a queen.',
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
                            <p className="text-xs text-primary/70 italic">
                              {entry.keySquares}
                            </p>
                          </div>
                          <div className="w-full max-w-[360px]">
                            <ChessBoard
                              fen={entry.fen}
                              orientation={entry.orientation}
                              interactive={false}
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
