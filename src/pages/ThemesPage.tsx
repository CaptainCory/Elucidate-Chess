import { Link } from "react-router-dom";
import { ArrowLeft, Swords } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ChessTheme } from "@/data/chessPuzzles";

interface ThemeEntry {
  theme: ChessTheme;
  title: string;
  description: string;
  example: string;
}

const themeEntries: ThemeEntry[] = [
  {
    theme: "fork",
    title: "Fork",
    description:
      "A single piece attacks two or more enemy pieces at the same time, forcing the opponent to lose material because they can only save one.",
    example:
      "A knight jumps to a square where it simultaneously attacks the king and queen. The opponent must move the king, losing the queen.",
  },
  {
    theme: "pin",
    title: "Pin",
    description:
      "A piece attacks an enemy piece that cannot move without exposing a more valuable piece behind it. An absolute pin involves the king — the pinned piece literally cannot move.",
    example:
      "A bishop pins a knight to the king along a diagonal. The knight cannot move because it would leave the king in check.",
  },
  {
    theme: "skewer",
    title: "Skewer",
    description:
      "The reverse of a pin — a more valuable piece is attacked and forced to move, exposing a less valuable piece behind it to capture.",
    example:
      "A rook checks the king along a file. The king moves, and the rook captures the unprotected queen behind it.",
  },
  {
    theme: "discovered-attack",
    title: "Discovered Attack",
    description:
      "Moving one piece reveals an attack from another piece behind it. When the revealed attack is a check, it's called a discovered check — one of the most powerful tactical weapons.",
    example:
      "A knight moves to attack the queen, simultaneously uncovering a bishop that now attacks the rook.",
  },
  {
    theme: "double-check",
    title: "Double Check",
    description:
      "A special case of discovered attack where both the moving piece and the uncovered piece give check. The only defense is to move the king — blocking or capturing won't work.",
    example:
      "A knight moves to deliver check while also uncovering a bishop check. The king must flee since you can't block two checks at once.",
  },
  {
    theme: "deflection",
    title: "Deflection",
    description:
      "Forcing a defending piece away from a critical square or duty. Once the defender is deflected, the position it was guarding collapses.",
    example:
      "A queen sacrifice forces the opponent's rook to leave the back rank, allowing checkmate with your own rook.",
  },
  {
    theme: "decoy",
    title: "Decoy",
    description:
      "Luring an enemy piece to a specific square where it becomes vulnerable — the opposite side of deflection. You're pulling a piece toward danger rather than away from its duty.",
    example:
      "Sacrificing a rook on a square forces the king to capture, walking into a knight fork that wins the queen.",
  },
  {
    theme: "overloading",
    title: "Overloading",
    description:
      "Exploiting a piece that's defending too many things at once. When one defender has multiple responsibilities, you attack one of them and something else falls.",
    example:
      "A queen defends both a rook and a back-rank mate threat. By capturing the rook, you force the queen to recapture, leaving the back rank unguarded.",
  },
  {
    theme: "removing-the-defender",
    title: "Removing the Defender",
    description:
      "Capturing or driving away a piece that protects something important. Once the guardian is gone, the thing it was protecting becomes vulnerable.",
    example:
      "A knight protects a critical pawn. You exchange your bishop for the knight, and now the pawn falls freely.",
  },
  {
    theme: "zwischenzug",
    title: "Zwischenzug (In-Between Move)",
    description:
      "Instead of making the expected move (like a recapture), you insert an unexpected intermediate move — often a check or threat — that improves your position before continuing the sequence.",
    example:
      "After a piece exchange, instead of recapturing immediately, you play a check first. Your opponent deals with the check, and then you recapture with a better position.",
  },
  {
    theme: "trapped-piece",
    title: "Trapped Piece",
    description:
      "A piece has no safe squares to retreat to. Even if it's a powerful piece like a queen or rook, it can be captured because it has nowhere to escape.",
    example:
      "A bishop ventures deep into enemy territory to grab a pawn but finds all retreat squares controlled. It's won for the opponent despite being a bishop.",
  },
  {
    theme: "back-rank-checkmate",
    title: "Back-Rank Checkmate",
    description:
      "A rook or queen delivers checkmate on the first or eighth rank because the enemy king is trapped behind its own pawns with no escape squares.",
    example:
      "The king sits on g8 with pawns on f7, g7, h7. A rook slides to e8, and it's checkmate — nowhere to run.",
  },
  {
    theme: "smothered-mate",
    title: "Smothered Mate",
    description:
      "A knight delivers checkmate to a king that is completely surrounded by its own pieces and cannot move. One of the most elegant patterns in chess.",
    example:
      "After a queen sacrifice on g8, the rook recaptures, and the knight delivers mate from f7 — the king is boxed in by its own army.",
  },
  {
    theme: "checkmate",
    title: "Checkmate",
    description:
      "The ultimate goal — the king is in check and has no legal move to escape. Recognizing checkmate patterns helps you spot winning opportunities faster.",
    example:
      "Two rooks coordinate to deliver a ladder mate, driving the king to the edge rank by rank.",
  },
  {
    theme: "sacrifice",
    title: "Sacrifice",
    description:
      "Deliberately giving up material (a pawn, piece, or even the queen) to gain a greater advantage — whether it's checkmate, a winning attack, or a decisive positional edge.",
    example:
      "Sacrificing a bishop to open up the king's pawn shield, creating an unstoppable attack with your remaining pieces.",
  },
  {
    theme: "hanging-piece",
    title: "Hanging Piece",
    description:
      "An undefended piece that can be captured for free. Spotting hanging pieces — both yours and your opponent's — is one of the most important skills at every level.",
    example:
      "After a sequence of moves, a knight is left unprotected on d4. A simple capture wins a piece with no compensation.",
  },
  {
    theme: "x-ray",
    title: "X-Ray",
    description:
      "A piece exerts influence through another piece to a square behind it. It's like having X-ray vision — your piece 'sees through' an obstacle to attack or defend a distant square.",
    example:
      "A rook on e1 defends e8 through the opponent's rook on e5. If the e5 rook moves, your rook controls the whole file.",
  },
  {
    theme: "promotion",
    title: "Promotion",
    description:
      "Advancing a pawn to the eighth rank to transform it into a queen (or another piece). Promotion threats often decide endgames and can create unstoppable tactical sequences.",
    example:
      "A passed pawn on the seventh rank forces the opponent's rook into a passive defensive position, and the pawn promotes next move.",
  },
  {
    theme: "endgame",
    title: "Endgame",
    description:
      "Positions with few pieces remaining where king activity, pawn structure, and precise technique become critical. Endgame knowledge separates intermediate players from strong ones.",
    example:
      "With king and rook vs. king and rook, understanding the Lucena and Philidor positions determines whether you win or draw.",
  },
  {
    theme: "battery",
    title: "Battery",
    description:
      "Lining up two or more pieces of the same type (or queen + bishop/rook) along a file, rank, or diagonal to multiply their attacking power. The front piece attacks while the back piece supports.",
    example:
      "Doubling rooks on an open file creates enormous pressure. The front rook attacks while the back rook provides support, making infiltration nearly unstoppable.",
  },
  {
    theme: "quiet-move",
    title: "Quiet Move",
    description:
      "A subtle, non-forcing move that doesn't capture or give check but creates an unstoppable threat. Quiet moves are often the hardest to find because they lack the drama of tactics.",
    example:
      "Instead of a flashy sacrifice, a simple bishop retreat to a diagonal creates simultaneous threats of checkmate and piece capture that can't both be stopped.",
  },
];

export default function ThemesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Board
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-14 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-6">
          <Swords className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          Chess Themes Explained
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          The building blocks of chess tactics and strategy. Understanding these
          patterns is the fastest path to seeing the board clearly.
        </p>
      </section>

      {/* Themes Accordion */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <Accordion type="single" collapsible className="space-y-3">
          {themeEntries.map((entry, i) => (
            <AccordionItem
              key={entry.theme}
              value={`theme-${i}`}
              className="border border-border/60 rounded-xl px-6 bg-card/50 backdrop-blur-sm data-[state=open]:border-primary/30 transition-colors"
            >
              <AccordionTrigger className="text-left font-display text-base md:text-lg font-semibold hover:no-underline py-5">
                {entry.title}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-[15px] pb-5 space-y-3">
                <p>{entry.description}</p>
                <div className="rounded-lg bg-secondary/50 border border-border/40 px-4 py-3">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Example</span>
                  <p className="mt-1 text-sm text-foreground/80">{entry.example}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
