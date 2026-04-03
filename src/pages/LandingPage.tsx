import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, lazy, Suspense } from 'react';
import { AuthModal } from '@/components/AuthModal';
import { PageSEO } from '@/components/PageSEO';
import { ChessQuoteFooter } from '@/components/ChessQuoteFooter';
const LazyChessBoard = lazy(() => import('@/components/ChessBoard').then(m => ({ default: m.ChessBoard })));
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    number: '01',
    title: 'Study the Position',
    description: 'Examine a carefully chosen chess position. Identify threats, imbalances, and candidate moves.',
  },
  {
    number: '02',
    title: 'Explain Your Thinking',
    description: 'Write down your reasoning before making a move. What do you see? Why is your move best?',
  },
  {
    number: '03',
    title: 'Get AI Coaching',
    description: 'Receive detailed feedback comparing your thinking to the strongest continuation.',
  },
];

const DEMO_FEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';

export default function LandingPage() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <PageSEO title="Elucidate Chess — AI Chess Trainer That Coaches Your Thinking" />

      {/* Nav */}
      <header className="border-b border-border/40 bg-background sticky top-0 z-50">
        <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-semibold font-display text-foreground tracking-tight">Elucidate</span>
          <div className="flex items-center gap-6">
            <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Method
            </Link>
            <Link to="/vocabulary" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Vocabulary
            </Link>
            <Link to="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Leaderboard
            </Link>
            {user ? (
              <Link to="/play">
                <Button size="sm">Start Training</Button>
              </Link>
            ) : (
              <Button size="sm" onClick={() => setShowAuth(true)}>
                Sign Up Free
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 md:pt-28 md:pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="lg:text-left text-center">
            <p className="text-sm font-mono text-primary mb-4 tracking-wide uppercase">Chess Reasoning Trainer</p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-foreground mb-6 leading-[1.08]">
              Train your thinking,<br />not just your moves
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto lg:mx-0 leading-relaxed mb-8">
              The AI coach that scores <em className="text-foreground not-italic font-medium">how</em> you think about chess positions — not just whether you found the right move.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Link to="/play">
                <Button size="lg" className="gap-2 px-8">
                  Try a Position
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="ghost" size="lg" className="text-muted-foreground">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <Suspense fallback={<div className="aspect-square bg-muted/20 rounded-xl" />}>
              <LazyChessBoard fen={DEMO_FEN} orientation="white" interactive={false} />
            </Suspense>
            <p className="mt-3 text-center text-sm text-muted-foreground font-mono">
              White to move. What's the winning idea?
            </p>
          </div>
        </div>
      </section>

      {/* Method */}
      <section className="border-t border-border/30 py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-12 text-center">
            The Method
          </h2>
          <div className="space-y-10">
            {features.map((f) => (
              <div key={f.number} className="flex gap-6 items-start">
                <span className="text-sm font-mono text-primary/60 pt-1 shrink-0">{f.number}</span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="border-t border-border/30 py-20 md:py-28 bg-card/30">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">
            Why Elucidate
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            Most puzzle trainers only check if you found the right move. We analyze how you think.
          </p>
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8">
            {[
              { title: 'Reasoning Feedback', desc: 'Get scored on the quality of your explanation, not just the move.' },
              { title: 'AI Coaching', desc: 'Detailed analysis of how you think, like working with a titled coach.' },
              { title: 'Adaptive Difficulty', desc: 'Progress from beginner to advanced as your thinking improves.' },
              { title: 'Track Growth', desc: 'See your reasoning scores improve over time with real metrics.' },
            ].map((f) => (
              <div key={f.title}>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-border/30 py-20 md:py-28">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-12 text-center">
            Pricing
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">Free</h3>
              <p className="text-primary font-display text-3xl font-bold mb-5">$0</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {['Unlimited beginner positions', 'AI reasoning feedback', 'Progress tracking'].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-xl border border-primary/30 bg-card relative">
              <span className="absolute top-3 right-3 text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                Popular
              </span>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">Premium</h3>
              <p className="text-primary font-display text-3xl font-bold mb-5">
                $9<span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {['All difficulty levels', 'Advanced AI analysis', 'Unlimited positions', '7-day free trial'].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/30 py-20 md:py-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            Start thinking clearly
          </h2>
          <p className="text-muted-foreground mb-8">
            Join chess players who improve by understanding, not memorizing.
          </p>
          <Link to="/play">
            <Button size="lg" className="gap-2 px-8">
              Try a Position
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <ChessQuoteFooter />
      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
}
