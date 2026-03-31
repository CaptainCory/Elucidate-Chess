import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Crown, LogOut, Trophy, Target, TrendingUp, ArrowLeft, Loader2, Mail, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ChessQuoteFooter } from '@/components/ChessQuoteFooter';
import { ProgressStats } from '@/components/ProgressStats';
import { GraduationProgress } from '@/components/GraduationProgress';
import { useQuery } from '@tanstack/react-query';

const ProfilePage = () => {
  const { user, loading, isPremium, subscriptionEnd, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate]);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isPremiumUser = isPremium || profile?.is_premium;

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User';
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(38 92% 50% / 0.15), transparent 60%)' }} />

      <div className="relative container max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Back button */}
        <Link to="/play" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to puzzles
        </Link>

        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-border">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xl">{initials}</AvatarFallback>
                </Avatar>
                {isPremium && (
                  <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
                    <Crown className="h-4 w-4 text-primary-foreground" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold font-display text-foreground truncate">{displayName}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Tier */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPremium ? (
              <div className="space-y-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 gap-1.5 px-3 py-1 text-sm">
                  <Crown className="w-4 h-4" />
                  Premium · Unlimited
                </Badge>
                {subscriptionEnd && (
                  <p className="text-xs text-muted-foreground">
                    Renews on {new Date(subscriptionEnd).toLocaleDateString()}
                  </p>
                )}
                <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/membership')}>
                  Manage Membership
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Badge variant="secondary" className="text-muted-foreground px-3 py-1">
                  Basic · 3 puzzles/day
                </Badge>
                <p className="text-sm text-muted-foreground">Upgrade to Premium for unlimited puzzles and advanced analytics.</p>
                <Button size="sm" onClick={() => navigate('/membership')}>
                  <Crown className="w-4 h-4 mr-1" />
                  Upgrade to Premium
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressStats
              puzzlesSolved={profile?.puzzles_solved ?? 0}
              averageScore={profile?.average_score ?? 0}
              streak={profile?.best_streak ?? 0}
            />
          </CardContent>
        </Card>

        {/* Graduation Progress */}
        {profile && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Skill Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GraduationProgress
                difficulty={profile.current_difficulty ?? 'beginner'}
                solved={
                  (profile.current_difficulty ?? 'beginner') === 'beginner'
                    ? (profile.beginner_solved ?? 0)
                    : (profile.current_difficulty ?? 'beginner') === 'intermediate'
                      ? (profile.intermediate_solved ?? 0)
                      : (profile.advanced_solved ?? 0)
                }
                avgScore={
                  (profile.current_difficulty ?? 'beginner') === 'beginner'
                    ? (profile.beginner_avg_score ?? 0)
                    : (profile.current_difficulty ?? 'beginner') === 'intermediate'
                      ? (profile.intermediate_avg_score ?? 0)
                      : (profile.advanced_avg_score ?? 0)
                }
                isPremium={!!isPremiumUser}
              />
            </CardContent>
          </Card>
        )}

        {/* Sign Out */}
        <Separator />
        <Button variant="outline" className="w-full" onClick={() => void signOut()}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
      <ChessQuoteFooter />
    </div>
  );
};

export default ProfilePage;
