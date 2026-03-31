import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { ChessQuoteFooter } from "@/components/ChessQuoteFooter";
import { PageSEO } from "@/components/PageSEO";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: 'What does "elucidate" actually mean — and why name a chess method after it?',
    answer:
      "Elucidate comes from the Latin elucidare — to bring light, to make clear. That's the whole philosophy in one word. Chess doesn't have to feel like a dark maze of memorized lines. When you truly understand what's happening on the board — the patterns, the tensions, the logic — moves stop feeling random and start feeling inevitable. We named this method after the experience we want you to have: clarity.",
  },
  {
    question: "How is this different from watching YouTube videos or using an engine?",
    answer:
      "Engines tell you what's best. Videos show you what a strong player would do. Neither teaches you how to see the board for yourself. Our method focuses on building your chess intuition from the inside out — training your pattern recognition, your evaluation skills, and your ability to ask the right questions during a game. Think of it as learning to fish, rather than being handed fish.",
  },
  {
    question: "What does a typical session look like?",
    answer:
      "You'll be presented with a carefully chosen position. Before making a move, you write down what you notice — threats, imbalances, candidate moves, and your reasoning. Then you submit your move and receive detailed feedback that compares your thinking to the strongest continuation. It's less about getting the right answer and more about sharpening how you think.",
  },
  {
    question: "Do I need to be good at chess already?",
    answer:
      "Not at all. Positions are graded by difficulty, and the method works whether you're 800 or 2200. Beginners often benefit the most because they're building good thinking habits from the start — instead of having to unlearn bad ones later. If you know how the pieces move, you're ready.",
  },
  {
    question: "What's the philosophy behind the teaching method?",
    answer:
      "Clarity over complexity. Understanding over memorization. We believe the fastest path to improvement isn't grinding thousands of puzzles on autopilot — it's slowing down, engaging deeply with fewer positions, and learning to see the why behind every move. When you understand the reason a move is strong, you can find similar moves in your own games without ever having studied that exact position.",
  },
  {
    question: "How does this help me improve faster than studying on my own?",
    answer:
      "Self-study often lacks structure and feedback. You might solve a puzzle correctly for the wrong reasons, or miss a key idea entirely without realizing it. Our AI analysis reads your written reasoning and gives you targeted feedback — not just on the move, but on your thought process. That's the difference between practicing and practicing with purpose.",
  },
  {
    question: "What if I'm a complete beginner?",
    answer:
      "Then you're in the perfect place to start. Beginners who learn to think clearly about positions from day one develop faster than those who spend years memorizing openings they don't understand. Start with the beginner-rated positions, write honestly about what you see, and let the feedback guide you. You'll be surprised how quickly the board starts making sense.",
  },
  {
    question: "How do I get started?",
    answer:
      "Just start solving. Pick any position, study the board, write down your thinking, and submit your best move. You get three free positions per day on the Basic plan — enough to build a daily habit. When you're ready for unlimited practice, you can upgrade anytime. No commitments, no pressure. Just clarity, one position at a time.",
  },
];

export default function HowItWorks() {
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer,
        },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageSEO
        title="How It Works — Elucidate Chess Method"
        description="Learn how Elucidate Chess trains your chess thinking through AI-powered reasoning analysis. Study positions, explain your moves, get personalized coaching."
      />
      {/* Nav */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            to="/play"
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
          <Lightbulb className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          Bring Light to the Board
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Chess doesn't have to feel overwhelming. Our method is simple: slow
          down, think clearly, and let understanding replace memorization — one
          position at a time.
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border/60 rounded-xl px-6 bg-card/50 backdrop-blur-sm data-[state=open]:border-primary/30 transition-colors"
            >
              <AccordionTrigger className="text-left font-display text-base md:text-lg font-semibold hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-foreground/80 leading-relaxed text-base md:text-lg pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      <ChessQuoteFooter />
    </div>
  );
}
