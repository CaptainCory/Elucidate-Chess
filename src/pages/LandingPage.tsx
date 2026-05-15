import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, lazy, Suspense } from 'react';
import { AuthModal } from '@/components/AuthModal';
import { PageSEO } from '@/components/PageSEO';
import { ChessQuoteFooter } from '@/components/ChessQuoteFooter';
const LazyChessBoard = lazy(() => import('@/components/ChessBoard').then(m => ({ default: m.ChessBoard })));
import { Brain, Target, MessageSquare, BarChart3, Crown, ArrowRight, Sparkles, Trophy, Lightbulb, CheckCircle2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { LiveVisitorsBadge } from '@/components/LiveVisitorsBadge';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

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

// A classic knight-fork puzzle FEN for the demo
const DEMO_FEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <PageSEO
        title="Elucidate Chess — AI Chess Trainer for Your Reasoning"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What is Elucidate Chess?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Elucidate Chess is an AI-powered chess puzzle trainer that scores your reasoning, not just your moves. You write what you see in a position and an AI coach evaluates your thinking.',
                },
              },
              {
                '@type': 'Question',
                name: 'How is this different from other chess puzzle apps?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Most chess puzzle trainers only check whether you found the right move. Elucidate analyzes the explanation you write and grades the quality of your chess thinking, helping you build real intuition instead of memorizing patterns.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is Elucidate Chess free?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes — the Basic plan is free and includes 3 chess positions per day with full AI coaching feedback. Premium unlocks unlimited positions across all difficulty levels.',
                },
              },
              {
                '@type': 'Question',
                name: 'What chess skill levels does Elucidate support?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Beginner, intermediate, advanced, and master. The trainer adapts to your level based on your reasoning scores and proficiency over time.',
                },
              },
              {
                '@type': 'Question',
                name: 'Do I need an account to try it?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'No account is needed to try chess positions as a guest. Creating a free account lets you track progress, streaks, and achievements.',
                },
              },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: 'Chess Reasoning Training',
            description: 'Practice-based chess training that scores your written reasoning on tactical positions across beginner to master difficulty.',
            provider: { '@type': 'Organization', name: 'Elucidate Chess', url: 'https://elucidatechess.com' },
          },
        ]}
        jsonLdId="landing"
      />

      {/* Nav */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold font-display text-foreground">Elucidate Chess</span>
            <LiveVisitorsBadge className="ml-1" />
          </div>
          <div className="flex items-center gap-4">
            <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              How It Works
            </Link>
            <Link to="/daily" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Daily
            </Link>
            <Link to="/vocabulary" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Vocabulary
            </Link>
            <Link to="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Leaderboard
            </Link>
            {user ? (
              <Link to="/play">
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
        {/* Ambient glow layers */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, hsl(42 75% 50% / 0.12), transparent 55%), radial-gradient(ellipse at 70% 80%, hsl(348 55% 42% / 0.06), transparent 55%)',
          }}
        />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'var(--gradient-glow)', filter: 'blur(80px)', opacity: 0.4 }} />

        <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center lg:text-left"
            >
              <motion.h1
                variants={fadeUp}
                custom={0}
                className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]"
              >
                A Method to{' '}
                <span className="text-primary relative">
                  Actually Improve
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-[3px] bg-primary/40 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ originX: 0 }}
                  />
                </span>{' '}
                at Chess
              </motion.h1>
              <motion.p
                variants={fadeUp}
                custom={1}
                className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8"
              >
                The AI-powered chess trainer that scores your reasoning — like having a coach who cares{' '}
                <em className="text-foreground font-medium">HOW</em> you think, not just what you play.
              </motion.p>
              <motion.div
                variants={fadeUp}
                custom={2}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <Link to="/play">
                  <Button size="lg" className="gap-2 text-lg px-10 py-7 shadow-lg hover:shadow-xl transition-shadow">
                    <ArrowRight className="w-5 h-5" />
                    Try It For Free
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button variant="outline" size="lg" className="gap-2 text-base px-8 py-6">
                    <Lightbulb className="w-5 h-5" />
                    Learn the Method
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: Interactive Demo Board */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, rotate: -1 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Glow behind board */}
              <div className="absolute -inset-6 rounded-2xl pointer-events-none" style={{ background: 'var(--gradient-glow)', filter: 'blur(40px)', opacity: 0.5 }} />
              <div className="relative">
                <Suspense fallback={<div className="aspect-square bg-muted/30 rounded-xl animate-pulse" />}>
                  <LazyChessBoard fen={DEMO_FEN} orientation="white" interactive={false} />
                </Suspense>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="mt-4 text-center"
                >
                  <p className="text-sm text-muted-foreground font-display italic">
                    White to move — can you spot the winning idea?
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 border-t border-border/30 relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent, hsl(160 20% 8% / 0.5), transparent)' }} />
        <div className="max-w-4xl mx-auto px-6 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground max-w-xl mx-auto">
              Three steps to sharper chess thinking. No memorization required.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { step: '1', title: 'Study the Position', desc: 'Examine a carefully chosen chess position. Identify threats, imbalances, and candidate moves.' },
              { step: '2', title: 'Explain Your Thinking', desc: 'Write down your reasoning before making a move. What do you see? Why is your move best?' },
              { step: '3', title: 'Get AI Coaching', desc: 'Receive detailed feedback comparing your thinking to the strongest continuation. Learn WHY, not just what.' },
            ].map((item) => (
              <motion.div key={item.step} variants={fadeUp} className="text-center group">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/20 text-primary font-display text-xl font-bold mb-4 group-hover:bg-primary/20 transition-colors">
                  {item.step}
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Elucidate */}
      <section className="py-16 md:py-24 border-t border-border/30">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="text-center mb-14"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Elucidate
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground max-w-xl mx-auto">
              Most chess puzzle trainers only check if you found the right move. We analyze how you think.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 gap-6"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="chess-card p-6 rounded-xl border border-border/50 hover:border-primary/30 transition-colors group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-24 border-t border-border/30 relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent, hsl(160 20% 8% / 0.5), transparent)' }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pricing
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground max-w-xl mx-auto mb-10">
              Start free. Upgrade when you're ready for unlimited chess improvement.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto"
          >
            <motion.div variants={fadeUp} className="chess-card p-6 rounded-xl text-left border border-border/50">
              <h3 className="font-display text-xl font-semibold text-foreground mb-1">Free</h3>
              <p className="text-primary font-display text-3xl font-bold mb-4">$0</p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {['Unlimited beginner positions', 'AI reasoning feedback', 'Progress tracking'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary/70 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div variants={fadeUp} className="chess-card p-6 rounded-xl text-left border border-primary/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                Popular
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-xl font-semibold text-foreground">Premium</h3>
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <p className="text-primary font-display text-3xl font-bold mb-4">$9<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {['Unlimited positions', 'Intermediate & Advanced levels', 'Advanced AI analysis', 'Priority support'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 border-t border-border/30">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-3xl mx-auto px-6 text-center"
        >
          <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Think Clearly?
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8">
            Join chess players who are improving by understanding, not memorizing.
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <Link to="/play">
              <Button size="lg" className="gap-2 text-lg px-10 py-7 shadow-lg hover:shadow-xl transition-shadow">
                <ArrowRight className="w-5 h-5" />
                Try It For Free
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <ChessQuoteFooter />
      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
}
