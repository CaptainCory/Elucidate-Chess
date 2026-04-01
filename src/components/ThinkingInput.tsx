import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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

  const charCount = thinking.trim().length;
  const MIN_CHARS = 15;
  const MAX_CHARS = 300;
  const needsMore = moveSelected && charCount > 0 && charCount < MIN_CHARS;
  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS;

  const handleSubmit = () => {
    if (isValid && moveSelected) {
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
    <motion.div
      ref={containerRef}
      className="space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="space-y-2 relative">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">
            {moveSelected ? 'Explain your thinking process' : 'Describe the Position and Justify Your Reasoning'}
          </label>
          {moveSelected && (
            <Button
              type="button"
              variant={isRecording ? 'destructive' : 'outline'}
              size="sm"
              onClick={toggleRecording}
              disabled={disabled || isLoading || isTranscribing}
              className="flex items-center gap-1.5 text-xs"
            >
              {isTranscribing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
              {isTranscribing ? 'Transcribing…' : isRecording ? 'Stop' : 'Voice'}
            </Button>
          )}
        </div>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={thinking}
            onChange={(e) => {
              const sanitized = e.target.value.replace(/[^a-zA-Z0-9 .,;:!?'"\-()+=\n]/g, '');
              if (sanitized.length <= MAX_CHARS) setThinking(sanitized);
            }}
            onKeyDown={handleKeyDown}
            placeholder={moveSelected ? '' : "👆 Drag and drop a piece on the board, then describe the position and justify your reasoning"}
            className="thinking-area"
            rows={4}
            maxLength={MAX_CHARS}
            disabled={disabled || isLoading || !moveSelected}
          />
          {moveSelected && !thinking && !isRecording && (
            <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-none">
              <span className="inline-block w-0.5 h-5 bg-primary animate-blink rounded-full" />
              <span className="text-sm font-medium text-primary">Start typing or use voice…</span>
            </div>
          )}
          {isRecording && (
            <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-none">
              <span className="inline-block w-2 h-2 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm font-medium text-destructive">Listening…</span>
            </div>
          )}
        </div>
        {/* Character status */}
        {moveSelected && charCount > 0 && (
          <div className="flex items-center justify-between">
            {needsMore ? (
              <span className="text-xs font-semibold text-accent animate-pulse">
                Needs more ELUCIDATION
              </span>
            ) : (
              <span />
            )}
            <span className={`text-xs ${charCount >= MAX_CHARS ? 'text-destructive' : 'text-muted-foreground'}`}>
              {charCount}/{MAX_CHARS}
            </span>
          </div>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isValid || !moveSelected || isLoading || disabled}
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
    </motion.div>
  );
}
