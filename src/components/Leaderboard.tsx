import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Target, Flame } from 'lucide-react';

interface LeaderboardEntry {
  display_name: string | null;
  avatar_url: string | null;
  puzzles_solved: number;
  average_score: number;
  best_streak: number;
  is_premium: boolean;
}

type Tab = 'solved' | 'score' | 'streak';

const TAB_CONFIG: { key: Tab; label: string; icon: typeof Trophy; field: keyof LeaderboardEntry }[] = [
  { key: 'solved', label: 'Most Solved', icon: Trophy, field: 'puzzles_solved' },
  { key: 'score', label: 'Highest Avg', icon: Target, field: 'average_score' },
  { key: 'streak', label: 'Longest Streak', icon: Flame, field: 'best_streak' },
];

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [tab, setTab] = useState<Tab>('solved');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const config = TAB_CONFIG.find(t => t.key === tab)!;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, puzzles_solved, average_score, best_streak, is_premium')
        .eq('is_premium', true)
        .gt(config.field as string, 0)
        .order(config.field as string, { ascending: false })
        .limit(10);

      setEntries((data as LeaderboardEntry[]) || []);
      setLoading(false);
    };

    fetchLeaderboard();
  }, [tab]);

  return (
    <div className="chess-card p-6">
      <h3 className="text-lg font-semibold font-display text-foreground mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        Global Leaderboard
      </h3>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-secondary/50 rounded-lg p-1">
        {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-md transition-all ${
              tab === key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">No entries yet. Be the first!</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const config = TAB_CONFIG.find(t => t.key === tab)!;
            const value = entry[config.field];
            const name = entry.display_name || 'Anonymous';
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  i === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/30'
                }`}
              >
                {/* Rank */}
                <span className={`w-6 text-center text-sm font-bold ${
                  i === 0 ? 'text-primary' : i === 1 ? 'text-muted-foreground' : 'text-muted-foreground/60'
                }`}>
                  {i + 1}
                </span>

                {/* Avatar */}
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">{initials}</span>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate block">{name}</span>
                </div>

                {/* Value */}
                <span className={`text-sm font-bold ${i === 0 ? 'text-primary' : 'text-foreground'}`}>
                  {tab === 'score' ? `${value}%` : value}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
