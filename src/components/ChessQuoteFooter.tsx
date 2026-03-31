import { useMemo } from 'react';
import { getRandomQuote } from '@/data/chessQuotes';

export const ChessQuoteFooter = () => {
  const quote = useMemo(() => getRandomQuote(), []);

  return (
    <footer className="mt-12 text-center text-muted-foreground space-y-3 pb-8">
      <blockquote className="max-w-xl mx-auto italic text-lg leading-relaxed">
        "{quote.text}"
      </blockquote>
      <p className="text-sm font-semibold text-primary/70">— {quote.author}</p>
      <p className="text-xs pt-2">Powered by AI • Practice Makes Progress</p>
      <a href="/admin" className="inline-block text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors mt-4">Admin</a>
    </footer>
  );
};
