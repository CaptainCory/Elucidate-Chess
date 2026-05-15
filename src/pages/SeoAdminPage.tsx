import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock, RefreshCw, AlertTriangle, CheckCircle2, ExternalLink, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PageSEO } from '@/components/PageSEO';

interface GscResponse {
  site: string;
  range: { startDate: string; endDate: string };
  totals: { clicks?: number; impressions?: number; ctr?: number; position?: number };
  byDate: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
  topQueries: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
  topPages: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
  sitemaps: Array<{
    path: string;
    lastSubmitted?: string;
    lastDownloaded?: string;
    isPending?: boolean;
    isSitemapsIndex?: boolean;
    errors?: string;
    warnings?: string;
    contents?: { type: string; submitted: string; indexed: string }[];
  }>;
  error?: string;
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
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Lock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <CardTitle className="text-lg">Admin Access</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={error ? 'border-destructive' : ''}
              autoFocus
            />
            <Button type="submit" className="w-full">Unlock</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

const fmtPct = (n?: number) => `${((n ?? 0) * 100).toFixed(1)}%`;
const fmtNum = (n?: number) => (n ?? 0).toLocaleString();
const fmtPos = (n?: number) => (n ?? 0).toFixed(1);

export default function SeoAdminPage() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('admin_unlocked') === 'true');
  const [data, setData] = useState<GscResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('gsc-status');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setData(data as GscResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (unlocked) load(); }, [unlocked, load]);

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  const chartData = (data?.byDate ?? []).map((r) => ({
    date: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
  }));

  const sitemapIssues = (data?.sitemaps ?? []).filter((s) => s.errors && s.errors !== '0');
  const sitemapWarnings = (data?.sitemaps ?? []).filter((s) => s.warnings && s.warnings !== '0');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <PageSEO title="SEO Admin · Elucidate Chess" description="Search Console performance and indexing status." />
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-serif">SEO Admin</h1>
            <p className="text-sm text-muted-foreground">
              Search Console — last 28 days {data?.range && `(${data.range.startDate} → ${data.range.endDate})`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">← Dashboard</Link>
            </Button>
            <Button onClick={load} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Couldn't reach Search Console</p>
                <p className="text-muted-foreground mt-1 break-words">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && !data && <p className="text-muted-foreground">Loading…</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Clicks" value={fmtNum(data.totals.clicks)} />
              <StatCard label="Impressions" value={fmtNum(data.totals.impressions)} />
              <StatCard label="CTR" value={fmtPct(data.totals.ctr)} />
              <StatCard label="Avg. position" value={fmtPos(data.totals.position)} />
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Clicks &amp; impressions over time</CardTitle></CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No traffic data yet — Google needs a few days after verification to populate.</p>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Sitemaps &amp; indexing
                  {sitemapIssues.length === 0 && sitemapWarnings.length === 0 && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.sitemaps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sitemaps submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {data.sitemaps.map((s) => {
                      const submitted = s.contents?.[0]?.submitted ?? '0';
                      const indexed = s.contents?.[0]?.indexed ?? '0';
                      const hasErr = s.errors && s.errors !== '0';
                      const hasWarn = s.warnings && s.warnings !== '0';
                      return (
                        <div key={s.path} className="border rounded-md p-3 text-sm">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <a href={s.path} target="_blank" rel="noopener noreferrer" className="font-mono text-xs hover:underline inline-flex items-center gap-1">
                              {s.path} <ExternalLink className="h-3 w-3" />
                            </a>
                            {hasErr ? (
                              <span className="text-destructive text-xs font-medium">{s.errors} errors</span>
                            ) : hasWarn ? (
                              <span className="text-amber-600 text-xs font-medium">{s.warnings} warnings</span>
                            ) : (
                              <span className="text-emerald-600 text-xs font-medium">Healthy</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-muted-foreground">
                            <div>Submitted URLs: <span className="text-foreground">{submitted}</span></div>
                            <div>Indexed URLs: <span className="text-foreground">{indexed}</span></div>
                            <div>Last submitted: <span className="text-foreground">{s.lastSubmitted?.slice(0, 10) ?? '—'}</span></div>
                            <div>Last downloaded: <span className="text-foreground">{s.lastDownloaded?.slice(0, 10) ?? '—'}</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Top queries</CardTitle></CardHeader>
                <CardContent>
                  <RowsTable rows={data.topQueries} keyLabel="Query" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Top pages</CardTitle></CardHeader>
                <CardContent>
                  <RowsTable rows={data.topPages} keyLabel="Page" isUrl />
                </CardContent>
              </Card>
            </div>

            <TargetKeywordsCard topQueries={data.topQueries} />
          </>
        )}
      </div>
    </div>
  );
}

// Target keywords — picked via Semrush (US database) for a new, low-authority site
// where the product is "AI coach that scores your reasoning on chess puzzles".
// Picks favor low difficulty + on-brand intent over raw volume.
const TARGET_KEYWORDS: { term: string; volume: number; kdi: number; why: string; tier: 'quick win' | 'core' | 'stretch' }[] = [
  { term: 'chess coach ai', volume: 20, kdi: 0, tier: 'quick win', why: 'Exact product match. Trivial to rank.' },
  { term: 'chess thinking process', volume: 20, kdi: 0, tier: 'quick win', why: 'On-brand — we score reasoning.' },
  { term: 'chess reasoning', volume: 20, kdi: 0, tier: 'quick win', why: 'Core differentiator term.' },
  { term: 'chess calculation training', volume: 20, kdi: 0, tier: 'quick win', why: 'Matches our drill loop.' },
  { term: 'chess tactics trainer', volume: 70, kdi: 19, tier: 'quick win', why: 'Easy KDI, real intent.' },
  { term: 'chess pattern recognition', volume: 40, kdi: 24, tier: 'core', why: 'Vocabulary page is a fit.' },
  { term: 'chess improvement', volume: 70, kdi: 33, tier: 'core', why: 'Broad — anchor LandingPage copy.' },
  { term: 'chess puzzle solver', volume: 720, kdi: 46, tier: 'stretch', why: '/play page — biggest realistic prize.' },
  { term: 'chess puzzle of the day', volume: 480, kdi: 50, tier: 'stretch', why: 'We have /daily — schema + linking can win this.' },
];

function TargetKeywordsCard({ topQueries }: { topQueries: GscResponse['topQueries'] }) {
  const ranked = new Set((topQueries ?? []).map((r) => r.keys[0]?.toLowerCase()));
  const tierColor = (t: string) =>
    t === 'quick win' ? 'text-emerald-600' : t === 'core' ? 'text-amber-600' : 'text-muted-foreground';
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" /> Target keywords
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Picked via Semrush (US). Quick wins first — KDI under 25 with on-brand intent. Volumes are monthly Google searches.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead className="text-right">Vol/mo</TableHead>
                <TableHead className="text-right">KDI</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Why</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TARGET_KEYWORDS.map((k) => {
                const live = ranked.has(k.term.toLowerCase());
                return (
                  <TableRow key={k.term}>
                    <TableCell className="text-sm font-medium">{k.term}</TableCell>
                    <TableCell className="text-right text-sm">{fmtNum(k.volume)}</TableCell>
                    <TableCell className="text-right text-sm">{k.kdi}</TableCell>
                    <TableCell className={`text-xs font-medium ${tierColor(k.tier)}`}>{k.tier}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[260px]">{k.why}</TableCell>
                    <TableCell className="text-right text-xs">
                      {live ? (
                        <span className="text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> ranking
                        </span>
                      ) : (
                        <span className="text-muted-foreground">not yet</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-serif mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function RowsTable({
  rows,
  keyLabel,
  isUrl,
}: {
  rows: GscResponse['topQueries'];
  keyLabel: string;
  isUrl?: boolean;
}) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>;
  }
  return (
    <div className="max-h-80 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{keyLabel}</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead className="text-right">Impr.</TableHead>
            <TableHead className="text-right">Pos.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => {
            const k = r.keys[0];
            return (
              <TableRow key={i}>
                <TableCell className="max-w-[260px] truncate">
                  {isUrl ? (
                    <a href={k} target="_blank" rel="noopener noreferrer" className="hover:underline text-xs">
                      {k.replace(/^https?:\/\/[^/]+/, '') || '/'}
                    </a>
                  ) : (
                    <span className="text-sm">{k}</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm">{fmtNum(r.clicks)}</TableCell>
                <TableCell className="text-right text-sm">{fmtNum(r.impressions)}</TableCell>
                <TableCell className="text-right text-sm">{fmtPos(r.position)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
