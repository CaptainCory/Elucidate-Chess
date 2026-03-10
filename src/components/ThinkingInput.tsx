import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Swords } from 'lucide-react';
import type { ChessTheme } from '@/data/chessPuzzles';

const ALL_THEMES: ChessTheme[] = [
  'fork', 'pin', 'skewer', 'discovered-attack', 'double-check',
  'deflection', 'decoy', 'overloading', 'removing-the-defender',
  'zwischenzug', 'trapped-piece', 'back-rank', 'smothered-mate',
  'checkmate', 'sacrifice', 'hanging-piece', 'x-ray', 'promotion',
  'endgame', 'battery', 'quiet-move', 'check', 'captures', 'attacks', 'double-attack',
];

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

/** Pick random decoy themes that aren't in the correct set */
function pickDecoys(correct: ChessTheme[], count = 3): ChessTheme[] {
  const pool = ALL_THEMES.filter((t) => !correct.includes(t));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function ThinkingInput({ onSubmit, isLoading = false, disabled = false, moveSelected = false, themes = [] }: ThinkingInputProps) {
  const [thinking, setThinking] = useState('');
  const [selectedThemes, setSelectedThemes] = useState<Set<ChessTheme>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build a stable set of 5 choices: 2 correct + 3 decoys, shuffled
  const themeChoices = useMemo(() => {
    if (themes.length === 0) return [];
    const correct = themes.slice(0, 2);
    const decoys = pickDecoys(themes, 3);
    return [...correct, ...decoys].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themes.join(',')]);

  useEffect(() => {
    if (moveSelected && textareaRef.current) {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => textareaRef.current?.focus(), 400);
    }
  }, [moveSelected]);

  const toggleTheme = (theme: ChessTheme) => {
    setSelectedThemes((prev) => {
      const next = new Set(prev);
      if (next.has(theme)) {
        next.delete(theme);
        const readable = formatTheme(theme);
        setThinking((t) => t.replace(new RegExp(`\\s*\\[${readable}\\]`, 'g'), '').trim());
      } else {
        next.add(theme);
        const readable = formatTheme(theme);
        setThinking((t) => (t ? `${t} [${readable}]` : `[${readable}]`));
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (thinking.trim() && moveSelected) {
      onSubmit(thinking.trim());
      setThinking('');
      setSelectedThemes(new Set());
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
          {moveSelected ? 'Explain your thinking process' : 'Describe the Position and Justify Your Reasoning'}
        </label>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={thinking}
            onChange={(e) => setThinking(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={moveSelected ? '' : "👆 Drag and drop a piece on the board, then describe the position and justify your reasoning"}
            className="thinking-area"
            rows={5}
            disabled={disabled || isLoading || !moveSelected}
          />
          {moveSelected && !thinking && selectedThemes.size === 0 && (
            <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-none">
              <span className="inline-block w-0.5 h-5 bg-primary animate-blink rounded-full" />
              <span className="text-sm font-medium text-primary">Start typing your analysis...</span>
            </div>
          )}
        </div>
        {themeChoices.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Identify the themes:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {themeChoices.map((theme) => {
                const isSelected = selectedThemes.has(theme);
                return (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => toggleTheme(theme)}
                    disabled={disabled || isLoading || !moveSelected}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                        : 'bg-secondary text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {formatTheme(theme)}
                  </button>
                );
              })}
            </div>
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
