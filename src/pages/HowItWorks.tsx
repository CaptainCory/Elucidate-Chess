import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, Crown, Shield, Swords, Clock, MousePointerClick, PenLine, CheckCircle2, RotateCcw } from "lucide-react";
import { ChessQuoteFooter } from "@/components/ChessQuoteFooter";
import { PageSEO } from "@/components/PageSEO";
import { ChessBoard } from "@/components/ChessBoard";
import { TurnIndicator } from "@/components/TurnIndicator";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// Scholar's Mate setup — perfect beginner walkthrough
const WALKTHROUGH_FEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
const BEST_MOVE = 'Qxf7#';

interface WalkthroughStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  highlights: Record<string, React.CSSProperties>;
  autoAdvanceMs?: number; // if set, auto-advance after delay
  pulseSquares?: string[]; // squares that get a pulsing ring
}

const glowGold: React.CSSProperties = {
  backgroundColor: 'hsla(38, 92%, 50%, 0.45)',
  boxShadow: '0 0 18px 4px hsla(38, 92%, 50%, 0.35)',
};
const glowRed: React.CSSProperties = {
  backgroundColor: 'hsla(0, 80%, 50%, 0.35)',
  boxShadow: '0 0 14px 3px hsla(0, 80%, 50%, 0.3)',
};
const glowGreen: React.CSSProperties = {
  backgroundColor: 'hsla(120, 60%, 45%, 0.35)',
  boxShadow: '0 0 14px 3px hsla(120, 60%, 45%, 0.25)',
};
const glowBlue: React.CSSProperties = {
  backgroundColor: 'hsla(210, 70%, 50%, 0.3)',
  boxShadow: '0 0 14px 3px hsla(210, 70%, 50%, 0.25)',
};
const glowPurple: React.CSSProperties = {
  backgroundColor: 'hsla(270, 60%, 55%, 0.35)',
  boxShadow: '0 0 14px 3px hsla(270, 60%, 55%, 0.25)',
};

const steps: WalkthroughStep[] = [
  {
    id: 'intro',
    title: 'Look at the Board',
    icon: <Eye className="h-5 w-5" />,
    content: "Before anything else, take a breath and really look at the position. Don't rush to find a move — just observe. Where are the pieces? What's the overall picture?",
    highlights: {},
  },
  {
    id: 'turn',
    title: "Who's Turn Is It?",
    icon: <Crown className="h-5 w-5" />,
    content: "It's White's turn to move. This is always your first question — everything else depends on knowing who's moving.",
    highlights: {},
  },
  {
    id: 'material',
    title: 'Count the Material',
    icon: <Crown className="h-5 w-5" />,
    content: "Both sides have all their pieces — material is equal. When material is even, look for tactical advantages instead. Notice White's queen on h5 and bishop on c4 are both aimed at Black's kingside.",
    highlights: {
      h5: glowGold,
      c4: glowGold,
    },
  },
  {
    id: 'kings',
    title: 'How Safe Are the Kings?',
    icon: <Shield className="h-5 w-5" />,
    content: "White's king is safe on e1. But Black's king on e8 hasn't castled yet, and the f7 pawn is only defended by the king itself. That's a huge weakness — f7 is the softest square in Black's position.",
    highlights: {
      e1: glowGreen,
      e8: glowRed,
      f7: { ...glowRed, boxShadow: '0 0 22px 6px hsla(0, 80%, 50%, 0.45)' },
    },
    pulseSquares: ['f7'],
  },
  {
    id: 'cca',
    title: 'Checks, Captures & Attacks',
    icon: <Swords className="h-5 w-5" />,
    content: "Now ask: can I give check? Can I capture something? The queen on h5 can capture the pawn on f7 — and that square is only defended by the king. Since the bishop on c4 also covers f7, this capture would be checkmate!",
    highlights: {
      h5: glowGold,
      f7: { ...glowRed, boxShadow: '0 0 24px 8px hsla(0, 80%, 50%, 0.5)' },
      c4: glowPurple,
      e8: glowBlue,
    },
    pulseSquares: ['h5', 'f7'],
  },
  {
    id: 'phase',
    title: 'Opening, Middlegame, or Endgame?',
    icon: <Clock className="h-5 w-5" />,
    content: "This is the opening — most pieces are still on their starting squares. In the opening, king safety and piece development matter the most. Black left f7 unprotected, and that's the decisive mistake.",
    highlights: {
      f7: glowRed,
    },
    
  },
  {
    id: 'move',
    title: 'Choose Your Move',
    icon: <MousePointerClick className="h-5 w-5" />,
    content: "The best move is Qxf7# — the queen captures on f7 with checkmate. The king can't escape because the bishop on c4 covers the only flight square. Game over!",
    highlights: {
      h5: glowGold,
      f7: { backgroundColor: 'hsla(38, 92%, 50%, 0.6)', boxShadow: '0 0 28px 8px hsla(38, 92%, 50%, 0.5)' },
      c4: glowPurple,
    },
    pulseSquares: ['f7'],
  },
  {
    id: 'thinking',
    title: 'Write Down Your Thinking',
    icon: <PenLine className="h-5 w-5" />,
    content: "This is the key step that makes you a better player. Writing your reasoning forces you to be specific about what you see. Here's what a strong answer looks like:",
    highlights: {
      f7: { backgroundColor: 'hsla(38, 92%, 50%, 0.4)' },
      c4: glowPurple,
      h5: glowGold,
    },
  },
  {
    id: 'done',
    title: "That's the Method!",
    icon: <CheckCircle2 className="h-5 w-5" />,
    content: "Look → Count → Evaluate king safety → Check for checks, captures, attacks → Identify the game phase → Choose your move → Explain your reasoning. Do this every position, and your chess thinking will transform.",
    highlights: {},
  },
];

const SAMPLE_THINKING = `It's White to move. Material is equal. Black's king is stuck on e8 and hasn't castled — f7 is only defended by the king. My queen on h5 and bishop on c4 are both aimed at f7. Qxf7 is check, and the bishop covers e6, so the king has no escape. It's checkmate.`;

export default function HowItWorks() {
  const [currentStep, setCurrentStep] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Auto-advance removed — all steps are click-to-advance

  // Typing animation for the thinking step
  useEffect(() => {
    if (step.id === 'thinking' && !isTyping && typedText.length === 0) {
      setIsTyping(true);
      let i = 0;
      typeTimerRef.current = setInterval(() => {
        i++;
        setTypedText(SAMPLE_THINKING.slice(0, i));
        if (i >= SAMPLE_THINKING.length) {
          if (typeTimerRef.current) clearInterval(typeTimerRef.current);
          setIsTyping(false);
        }
      }, 22);
      return () => {
        if (typeTimerRef.current) clearInterval(typeTimerRef.current);
      };
    }
  }, [step.id]);

  // Show score after thinking is done
  useEffect(() => {
    if (step.id === 'thinking' && typedText.length === SAMPLE_THINKING.length) {
      const t = setTimeout(() => setShowScore(true), 800);
      return () => clearTimeout(t);
    }
  }, [step.id, typedText]);

  const goNext = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goBack = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (currentStep > 0) {
      // Reset typing state if going back from thinking
      if (steps[currentStep].id === 'thinking' || steps[currentStep - 1].id === 'thinking') {
        setTypedText('');
        setIsTyping(false);
        setShowScore(false);
        if (typeTimerRef.current) clearInterval(typeTimerRef.current);
      }
      setCurrentStep(prev => prev - 1);
    }
  };

  const restart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    setCurrentStep(0);
    setTypedText('');
    setIsTyping(false);
    setShowScore(false);
  };

  // Build pulse overlay styles
  const pulseOverlay: Record<string, React.CSSProperties> = {};
  (step.pulseSquares || []).forEach(sq => {
    pulseOverlay[sq] = {
      ...(step.highlights[sq] || {}),
      animation: 'pulse-glow 1.5s ease-in-out infinite',
    };
  });

  const combinedHighlights = { ...step.highlights, ...pulseOverlay };

  // For the move step, show the post-move FEN
  const boardFen = step.id === 'done'
    ? 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4'
    : WALKTHROUGH_FEN;

  return (
    <div className="min-h-screen bg-background">
      <PageSEO
        title="How It Works — Elucidate Chess Method"
        description="Walk through a real chess position step-by-step. Learn the Elucidate method: observe, count material, evaluate king safety, find tactics, and explain your thinking."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'The Elucidate Chess Method',
          description: 'A five-step method for analyzing any chess position: observe, count material, evaluate king safety, find tactics, and explain your reasoning.',
          totalTime: 'PT5M',
          step: [
            { '@type': 'HowToStep', position: 1, name: 'Observe the position', text: 'Take in the whole board before considering any moves.' },
            { '@type': 'HowToStep', position: 2, name: 'Count material', text: 'Note any material imbalance to inform candidate moves.' },
            { '@type': 'HowToStep', position: 3, name: 'Evaluate king safety', text: 'Identify weak squares around each king and any immediate threats.' },
            { '@type': 'HowToStep', position: 4, name: 'Find candidate tactics', text: 'Look for forks, pins, skewers, discovered attacks, and mating nets.' },
            { '@type': 'HowToStep', position: 5, name: 'Explain your reasoning', text: 'Write down WHY your chosen move is strong before submitting it.' },
          ],
        }}
        jsonLdId="how-it-works"
      />

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 14px 3px hsla(38, 92%, 50%, 0.3); }
          50% { box-shadow: 0 0 28px 8px hsla(38, 92%, 50%, 0.6); }
        }
      `}</style>

      {/* Nav */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <Link
            to="/play"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Board
          </Link>
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'w-6 bg-primary'
                    : i < currentStep
                    ? 'w-3 bg-primary/40'
                    : 'w-3 bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Explainer video — top & center */}
      <section className="max-w-3xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
        <div className="rounded-xl overflow-hidden border border-border/60 shadow-lg bg-card">
          <video
            src="/elucidate-chess-explainer.mp4"
            controls
            playsInline
            preload="metadata"
            className="w-full h-auto block"
            aria-label="Elucidate Chess explainer video"
          />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-3">
          A 30-second look at how Elucidate Chess helps you think more clearly.
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
          {/* Board Column */}
          <div className="flex flex-col items-center gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id + '-indicator'}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3 }}
              >
                <TurnIndicator fen={boardFen} />
              </motion.div>
            </AnimatePresence>

            <ChessBoard
              fen={boardFen}
              orientation="white"
              interactive={false}
              externalSquareStyles={combinedHighlights}
            />

            {/* Step badge under board */}
            <div className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>

          {/* Content Column */}
          <div className="flex flex-col gap-5 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1"
              >
                {/* Step header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                    {step.icon}
                  </div>
                  <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                    {step.title}
                  </h2>
                </div>

                {/* Step content */}
                <p className="text-base md:text-lg text-foreground/85 leading-relaxed mb-5">
                  {step.content}
                </p>

                {/* Thinking textarea (only on thinking step) */}
                {step.id === 'thinking' && (
                  <div className="space-y-3">
                    <div className="relative rounded-xl border-2 border-primary/30 bg-card p-4 min-h-[140px]">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
                        Your Elucidation
                      </div>
                      <p className="text-sm md:text-base text-foreground leading-relaxed font-mono">
                        {typedText}
                        {isTyping && (
                          <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" />
                        )}
                      </p>
                    </div>
                    {showScore && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30"
                      >
                        <div className="text-3xl font-bold text-green-500 font-mono">98</div>
                        <div>
                          <div className="text-sm font-semibold text-green-600">Excellent Reasoning</div>
                          <div className="text-xs text-muted-foreground">Clear observation of the f7 weakness and accurate mate calculation.</div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Final step CTA */}
                {isLastStep && (
                  <div className="space-y-3 mt-4">
                    <Link to="/play">
                      <Button size="lg" className="w-full gap-2 text-base">
                        Try It Yourself <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full gap-2"
                      onClick={restart}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Replay Walkthrough
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            {!isLastStep && (
              <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBack}
                  disabled={currentStep === 0}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </Button>
                <div className="flex-1" />
                <Button
                  onClick={goNext}
                  size="sm"
                  className="gap-1.5"
                >
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ChessQuoteFooter />
    </div>
  );
}
