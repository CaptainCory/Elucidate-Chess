import { Link } from "react-router-dom";
import { ArrowLeft, Swords } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MiniChessBoard } from "@/components/MiniChessBoard";
import { themeEntries } from "@/data/themeEntries";

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
              <AccordionContent className="text-muted-foreground leading-relaxed text-[15px] pb-5 space-y-4">
                <p>{entry.description}</p>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Mini board */}
                  <div className="shrink-0">
                    <MiniChessBoard fen={entry.fen} size={200} highlightSquares={entry.highlights} />
                  </div>

                  {/* Example */}
                  <div className="rounded-lg bg-secondary/50 border border-border/40 px-4 py-3 flex-1">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Example
                    </span>
                    <p className="mt-1 text-sm text-foreground/80">
                      {entry.example}
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
