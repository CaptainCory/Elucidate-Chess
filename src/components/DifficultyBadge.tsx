import { ChessPuzzle } from '@/data/chessPuzzles';

interface DifficultyBadgeProps {
  difficulty: ChessPuzzle['difficulty'];
}

const difficultyConfig = {
  beginner: {
    label: 'Beginner',
    className: 'bg-success/20 text-success border-success/30',
  },
  intermediate: {
    label: 'Intermediate',
    className: 'bg-primary/20 text-primary border-primary/30',
  },
  advanced: {
    label: 'Advanced',
    className: 'bg-accent/20 text-accent border-accent/30',
  },
  master: {
    label: 'Master',
    className: 'bg-destructive/20 text-destructive border-destructive/30',
  },
};

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const config = difficultyConfig[difficulty];

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
      {config.label}
    </span>
  );
}
