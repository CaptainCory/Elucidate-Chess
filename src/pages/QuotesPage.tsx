import { useState } from 'react';
import { chessQuotes } from '@/data/chessQuotes';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { MobileNav } from '@/components/MobileNav';
import { NavLink } from '@/components/NavLink';
import { UserMenu } from '@/components/UserMenu';
import { PageSEO } from '@/components/PageSEO';
import { AuthModal } from '@/components/AuthModal';

export default function QuotesPage() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className='min-h-screen bg-background'>
      <PageSEO
        title='Chess Wisdom Collection'
        description='Browse our curated collection of 101 chess quotes from grandmasters, world champions, and chess legends throughout history.'
      />

      {/* Navigation */}
      <nav className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 h-16 flex items-center justify-between'>
          <NavLink to='/' className='text-xl font-bold font-display'>
            Elucidate
          </NavLink>

          <div className='hidden md:flex items-center gap-6'>
            <NavLink to='/play'>Play</NavLink>
            <NavLink to='/how-it-works'>How It Works</NavLink>
            <NavLink to='/vocabulary'>Vocabulary</NavLink>
<NavLink to='/quotes'>Quotes</NavLink>
            <NavLink to='/leaderboard'>Leaderboard</NavLink>
            <UserMenu />
          </div>

          <MobileNav user={user} onSignIn={() => setShowAuthModal(true)} />
        </div>
      </nav>

      {/* Main Content */}
      <main className='max-w-4xl mx-auto px-4 py-12'>
        <div className='text-center mb-12 space-y-3'>
          <h1 className='text-3xl md:text-4xl font-bold font-display text-foreground'>
            Chess Wisdom Collection
          </h1>
          <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
            {chessQuotes.length} timeless insights from grandmasters, world
            champions, and chess legends throughout history
          </p>
        </div>

        <div className='grid gap-4'>
          {chessQuotes.map((quote, index) => (
            <Card
              key={index}
              className='bg-card/50 hover:bg-card transition-colors'
            >
              <CardContent className='p-6'>
                <div className='flex items-start gap-4'>
                  <span className='text-2xl font-bold text-primary/30 font-display select-none'>
                    {index + 1}
                  </span>
                  <div className='flex-1 space-y-2'>
                    <blockquote className='text-lg leading-relaxed text-foreground italic'>
                      "{quote.text}"
                    </blockquote>
                    <p className='text-sm font-semibold text-primary/70'>
                      — {quote.author}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className='text-center text-muted-foreground/60 text-sm mt-12 pb-8'>
          Powered by AI • Practice Makes Progress
        </p>
      </main>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}
