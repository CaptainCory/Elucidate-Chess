import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { AuthModal } from '@/components/AuthModal';
import { PageSEO } from '@/components/PageSEO';
import { ChessQuoteFooter } from '@/components/ChessQuoteFooter';
import { Brain, Target, MessageSquare, BarChart3, Crown, ArrowRight, Sparkles, Trophy, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: MessageSquare,
    title: 'Explain Your Moves',
    description: 'Write down what you see — threats, patterns, candidate moves. Our AI chess coach reads your reasoning, not just your answer.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Feedback',
    description: 'Get detailed analysis of HOW you think, not just WHAT you played. Like chess thinking training with a grandmaster-level coach.',
  },
  {
    icon: Target,
    title: 'Reasoning Scores',
    description: 'Every attempt is scored on the quality of your explanation. Track your chess improvement over time with meaningful metrics.',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'See your growth across difficulty levels. From beginner to master, your chess puzzle trainer adapts to your level.',
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <PageSEO title="Elucidate Chess — AI Chess Trainer That Coaches Your Thinking" />

      {/* Nav */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold font-display text-foreground">Elucidate Chess</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              How It Works
            </Link>
            <Link to="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Leaderboard
            </Link>
            {user ? (
              <Link to="/">
                <Button size="sm" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Start Training
                </Button>
              </Link>
            ) : (
              <Button size="sm" className="gap-2" onClick={() => setShowAuth(true)}>
                Get Started Free
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, hsl(42 75% 50% / 0.2), transparent 60%)',
          }}
        />
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 text-center relative">
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
            Train Your Chess Thinking,{' '}
            <span className="text-primary">Not Just Your Moves</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            The AI-powered chess trainer that scores your reasoning — like having a coach who cares{' '}
            <em>HOW</em> you think, not just what you play.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/">
              <Button size="lg" className="gap-2 text-base px-8 py-6">
                <ArrowRight className="w-5 h-5" />
                Try a Puzzle Free
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="outline" size="lg" className="gap-2 text-base px-8 py-6">
                <Lightbulb className="w-5 h-5" />
                Learn the Method
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 border-t border-border/30">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-14">
            Three steps to sharper chess thinking. No memorization required.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Study the Position', desc: 'Examine a carefully chosen chess puzzle. Identify threats, imbalances, and candidate moves.' },
              { step: '2', title: 'Explain Your Thinking', desc: 'Write down your reasoning before making a move. What do you see? Why is your move best?' },
              { step: '3', title: 'Get AI Coaching', desc: 'Receive detailed feedback comparing your thinking to the strongest continuation. Learn WHY, not just what.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-display text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Elucidate */}
      <section className="py-16 md:py-24 border-t border-border/30">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            Why Elucidate
          </h2>
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-14">
            Most chess puzzle trainers only check if you found the right move. We analyze how you think.
          </p>
          <div className="grid sm:grid-cols-2 gap-8">
            {features.map((f) => (
              <div key={f.title} className="chess-card p-6 rounded-xl">
                <f.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-24 border-t border-border/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pricing
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-10">
            Start free. Upgrade when you're ready for unlimited chess improvement.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="chess-card p-6 rounded-xl text-left">
              <h3 className="font-display text-xl font-semibold text-foreground mb-1">Basic</h3>
              <p className="text-primary font-display text-2xl font-bold mb-3">Free</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 3 puzzles per day</li>
                <li>✓ AI reasoning feedback</li>
                <li>✓ Progress tracking</li>
              </ul>
            </div>
            <div className="chess-card p-6 rounded-xl text-left border-primary/30">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-xl font-semibold text-foreground">Premium</h3>
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <p className="text-primary font-display text-2xl font-bold mb-3">$9/mo</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Unlimited puzzles</li>
                <li>✓ All difficulty levels</li>
                <li>✓ Advanced AI analysis</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 border-t border-border/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Think Clearly?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join chess players who are improving by understanding, not memorizing.
          </p>
          <Link to="/">
            <Button size="lg" className="gap-2 text-base px-8 py-6">
              <ArrowRight className="w-5 h-5" />
              Start Your First Puzzle
            </Button>
          </Link>
        </div>
      </section>

      <ChessQuoteFooter />
      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
}
