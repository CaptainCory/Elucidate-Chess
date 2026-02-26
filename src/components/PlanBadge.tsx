import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

export function PlanBadge() {
  const { isPremium } = useAuth();

  if (isPremium) {
    return (
      <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 gap-1.5 px-3 py-1 text-sm">
        <Crown className="w-4 h-4" />
        Premium
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-muted-foreground px-3 py-1">
      Basic · 3 puzzles/day
    </Badge>
  );
}
