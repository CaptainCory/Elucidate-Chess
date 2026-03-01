import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import type { ChessTheme } from '@/data/chessPuzzles';

interface ThinkingInputProps {
  onSubmit: (thinking: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  moveSelected?: boolean;
  themes?: ChessTheme[];
}

function formatTheme(theme: ChessTheme): string {
  return theme
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function ThinkingInput({ onSubmit, isLoading = false, disabled = false, moveSelected = false, themes = [] }: ThinkingInputProps) {
  const [thinking, setThinking] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (moveSelected && textareaRef.current) {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => textareaRef.current?.focus(), 400);
    }
  }, [moveSelected]);

  const matchedThemes = useMemo(() => {
    if (!thinking.trim()) return new Set<ChessTheme>();
    const lower = thinking.toLowerCase();
    const matched = new Set<ChessTheme>();
    for (const theme of themes) {
      // Match against the readable form (e.g. "closed center") and hyphenated form
      const readable = theme.replace(/-/g, ' ');
      if (lower.includes(readable) || lower.includes(theme)) {
        matched.add(theme);
      }
    }
    return matched;
  }, [thinking, themes]);

  const handleSubmit = () => {
    if (thinking.trim() && moveSelected) {
      onSubmit(thinking.trim());
      setThinking('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div ref={containerRef} className="space-y-4 animate-slide-up">
      <div className="space-y-2 relative">
        <label className="block text-sm font-medium text-foreground">
          {moveSelected ? 'Explain your thinking process' : 'Make your move first'}
        </label>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={thinking}
            onChange={(e) => setThinking(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={moveSelected ? '' : "👆 Drag and drop a piece on the board to make your move first"}
            className="thinking-area"
            rows={5}
            disabled={disabled || isLoading || !moveSelected}
          />
          {moveSelected && !thinking && (
            <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-none">
              <span className="inline-block w-0.5 h-5 bg-primary animate-blink rounded-full" />
              <span className="text-sm font-medium text-primary">Start typing your analysis...</span>
            </div>
          )}
        </div>
        {themes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Themes:</span>
            {themes.map((theme) => {
              const isMatched = matchedThemes.has(theme);
              return (
                <span
                  key={theme}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border transition-all duration-300 ${
                    isMatched
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                      : 'bg-primary/10 text-primary/60 border-primary/20'
                  }`}
                >
                  {formatTheme(theme)}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!thinking.trim() || !moveSelected || isLoading || disabled}
        className="w-full py-6 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Submit Analysis
          </>
        )}
      </Button>
    </div>
  );
}
