import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface ThinkingInputProps {
  onSubmit: (thinking: string, suggestedMove: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ThinkingInput({ onSubmit, isLoading = false, disabled = false }: ThinkingInputProps) {
  const [thinking, setThinking] = useState('');
  const [suggestedMove, setSuggestedMove] = useState('');

  const handleSubmit = () => {
    if (thinking.trim() && suggestedMove.trim()) {
      onSubmit(thinking.trim(), suggestedMove.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Your suggested move
        </label>
        <input
          type="text"
          value={suggestedMove}
          onChange={(e) => setSuggestedMove(e.target.value)}
          placeholder="e.g., Nxf7, Qxh7+, e4"
          className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-lg"
          disabled={disabled || isLoading}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Explain your thinking process
        </label>
        <textarea
          value={thinking}
          onChange={(e) => setThinking(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What do you see in this position? What are the threats? What's your plan? Why did you choose this move?"
          className="thinking-area"
          rows={5}
          disabled={disabled || isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Tip: Describe the position, identify threats, explain your calculation, and justify your choice.
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!thinking.trim() || !suggestedMove.trim() || isLoading || disabled}
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
