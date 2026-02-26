import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

export function PlanBadge() {
  const { isPremium } = useAuth();

  if (isPremium) {
    return (
      <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
        <Crown className="w-3 h-3 mr-1" />
        Premium
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-muted-foreground">
      Basic · 3 puzzles/day
    </Badge>
  );
}
