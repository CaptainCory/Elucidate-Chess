import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

export function PlanBadge() {
  const { user, isPremium } = useAuth();

  const badge = isPremium ? (
    <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 gap-1.5 px-3 py-1 text-sm cursor-pointer">
      <Crown className="w-4 h-4" />
      Premium · All Levels
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-muted-foreground px-3 py-1 cursor-pointer">
      Free · Beginner
    </Badge>
  );

  if (user) {
    return <Link to="/profile">{badge}</Link>;
  }

  return badge;
}
