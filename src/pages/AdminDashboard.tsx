import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Crown, Puzzle, TrendingUp, Activity, RefreshCw, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardStats {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  totalPuzzlesSolved: number;
  totalAttempts: number;
  avgScore: number;
  recentAttempts: { puzzle_id: string; attempted_at: string; user_id: string }[];
  topUsers: { display_name: string | null; puzzles_solved: number; average_score: number; is_premium: boolean }[];
  difficultyBreakdown: { beginner: number; intermediate: number; advanced: number };
}

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'lasker') {
      sessionStorage.setItem('admin_unlocked', 'true');
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <CardTitle className="text-lg">Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={error ? 'border-destructive' : ''}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">Incorrect password</p>}
              <Button type="submit" className="w-full">Unlock</Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('display_name, puzzles_solved, average_score, is_premium, beginner_solved, intermediate_solved, advanced_solved');

      // Fetch recent attempts
      const { data: attempts } = await supabase
        .from('puzzle_attempts')
        .select('puzzle_id, attempted_at, user_id')
        .order('attempted_at', { ascending: false })
        .limit(20);

      // Fetch total attempt count
      const { count: totalAttempts } = await supabase
        .from('puzzle_attempts')
        .select('*', { count: 'exact', head: true });

      const allProfiles = profiles || [];
      const totalUsers = allProfiles.length;
      const premiumUsers = allProfiles.filter(p => p.is_premium).length;
      const freeUsers = totalUsers - premiumUsers;
      const totalPuzzlesSolved = allProfiles.reduce((sum, p) => sum + p.puzzles_solved, 0);
      const avgScore = totalUsers > 0
        ? Math.round(allProfiles.reduce((sum, p) => sum + p.average_score, 0) / totalUsers)
        : 0;

      const topUsers = [...allProfiles]
        .sort((a, b) => b.puzzles_solved - a.puzzles_solved)
        .slice(0, 10);

      const difficultyBreakdown = {
        beginner: allProfiles.reduce((s, p) => s + p.beginner_solved, 0),
        intermediate: allProfiles.reduce((s, p) => s + p.intermediate_solved, 0),
        advanced: allProfiles.reduce((s, p) => s + p.advanced_solved, 0),
      };

      setStats({
        totalUsers,
        freeUsers,
        premiumUsers,
        totalPuzzlesSolved,
        totalAttempts: totalAttempts || 0,
        avgScore,
        recentAttempts: attempts || [],
        topUsers,
        difficultyBreakdown,
      });
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Failed to fetch admin stats:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Last refreshed: {lastRefresh.toLocaleTimeString()} · Auto-refreshes every 30s
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="bg-primary/10 text-primary" />
          <StatCard title="Free Users" value={stats.freeUsers} icon={Users} color="bg-secondary text-secondary-foreground" />
          <StatCard title="Premium Users" value={stats.premiumUsers} icon={Crown} color="bg-accent text-accent-foreground" />
          <StatCard title="Puzzles Solved" value={stats.totalPuzzlesSolved.toLocaleString()} icon={Puzzle} color="bg-primary/10 text-primary" />
          <StatCard title="Avg Score" value={`${stats.avgScore}%`} icon={TrendingUp} color="bg-accent text-accent-foreground" />
        </div>

        {/* Difficulty breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Puzzles Solved by Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(['beginner', 'intermediate', 'advanced'] as const).map((diff) => (
                <div key={diff} className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{stats.difficultyBreakdown[diff].toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground capitalize">{diff}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top users */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Top Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Solved</TableHead>
                    <TableHead className="text-right">Avg</TableHead>
                    <TableHead className="text-right">Plan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topUsers.map((u, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium truncate max-w-[120px]">
                        {u.display_name || 'Anonymous'}
                      </TableCell>
                      <TableCell className="text-right">{u.puzzles_solved}</TableCell>
                      <TableCell className="text-right">{u.average_score}%</TableCell>
                      <TableCell className="text-right">
                        {u.is_premium ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                            <Crown className="h-3 w-3" /> Pro
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Free</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {stats.recentAttempts.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">Puzzle {a.puzzle_id}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[140px]">{a.user_id.slice(0, 8)}…</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.attempted_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                {stats.recentAttempts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Total attempts */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Puzzle Attempts (all time)</p>
              <p className="text-2xl font-bold">{stats.totalAttempts.toLocaleString()}</p>
            </div>
            <Activity className="h-8 w-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('admin_unlocked') === 'true');

  return (
    <AnimatePresence mode="wait">
      {unlocked ? (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Dashboard />
        </motion.div>
      ) : (
        <PasswordGate key="gate" onUnlock={() => setUnlocked(true)} />
      )}
    </AnimatePresence>
  );
}
