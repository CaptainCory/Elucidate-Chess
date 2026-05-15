import { THEMES } from '@/data/themes';
import { Check } from 'lucide-react';

interface ThemeMultiSelectProps {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}

export function ThemeMultiSelect({ value, onChange, max = 6 }: ThemeMultiSelectProps) {
  const selected = new Set(value);

  const toggle = (slug: string) => {
    const next = new Set(selected);
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      if (next.size >= max) return;
      next.add(slug);
    }
    onChange(Array.from(next));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {THEMES.map((t) => {
          const isOn = selected.has(t.slug);
          return (
            <button
              key={t.slug}
              type="button"
              onClick={() => toggle(t.slug)}
              title={t.summary}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isOn
                  ? 'bg-primary/15 text-primary border-primary/40'
                  : 'bg-secondary text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {isOn && <Check className="w-3 h-3" />}
              {t.title}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length}/{max} themes selected · drawn from the Vocabulary page
      </p>
    </div>
  );
}
