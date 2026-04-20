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
      <div className="flex items-center gap-4 mt-4">
        <a 
          href="/quotes" 
          className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
        >
          Quotes
        </a>
        <span className="text-muted-foreground/20">•</span>
        <a href="/admin" className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">Admin</a>
      </div>
    </footer>
  );
};
