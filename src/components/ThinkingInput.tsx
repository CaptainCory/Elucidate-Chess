import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface ThinkingInputProps {
  onSubmit: (thinking: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  moveSelected?: boolean;
}

export function ThinkingInput({ onSubmit, isLoading = false, disabled = false, moveSelected = false }: ThinkingInputProps) {
  const [thinking, setThinking] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (moveSelected && textareaRef.current) {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => textareaRef.current?.focus(), 400);
    }
  }, [moveSelected]);

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
        <p className="text-xs text-muted-foreground">
          Tip: Checks, Captures, Attacks, Material Count, Loose Pieces, Evaluate King Safety, Where are Pawn Breaks?
        </p>
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
