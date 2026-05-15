import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { THEME_BY_SLUG, THEMES } from '@/data/themes';
import { Crown, ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveVisitorsBadge } from '@/components/LiveVisitorsBadge';
import { PageSEO } from '@/components/PageSEO';
import { SiteFooter } from '@/components/SiteFooter';
import { ChessQuoteFooter } from '@/components/ChessQuoteFooter';

interface PuzzleRow {
  id: string;
  name: string;
  difficulty: string;
  themes: string[];
  explanation: string;
}

const difficultyColor = (d: string) => {
  if (d === 'beginner') return 'text-green-500';
  if (d === 'intermediate') return 'text-yellow-500';
  if (d === 'advanced') return 'text-orange-500';
  return 'text-red-500';
};

export default function PositionsByThemePage() {
  const { slug } = useParams<{ slug: string }>();
  const [rows, setRows] = useState<PuzzleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const theme = slug ? THEME_BY_SLUG[slug] : undefined;

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from('puzzles')
      .select('id, name, difficulty, themes, explanation')
      .contains('themes', [slug])
      .order('difficulty')
      .order('id')
      .then(({ data }) => {
        setRows((data || []) as PuzzleRow[]);
        setLoading(false);
      });
  }, [slug]);

  if (!slug || !theme) return <Navigate to="/vocabulary" replace />;

  const title = `${theme.title} Chess Positions — Practice ${theme.title} Tactics`;
  const description = `Practice ${rows.length || 'curated'} chess positions featuring the ${theme.title.toLowerCase()} pattern. ${theme.summary}`;

  const grouped = {
    beginner: rows.filter((r) => r.difficulty === 'beginner'),
    intermediate: rows.filter((r) => r.difficulty === 'intermediate'),
    advanced: rows.filter((r) => r.difficulty === 'advanced'),
    master: rows.filter((r) => r.difficulty === 'master'),
  };

  return (
    <div className="min-h-screen bg-background">
      <PageSEO
        title={title}
        description={description}
        canonical={`https://elucidatechess.com/positions/theme/${slug}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description,
          url: `https://elucidatechess.com/positions/theme/${slug}`,
          isPartOf: { '@type': 'WebSite', name: 'Elucidate Chess', url: 'https://elucidatechess.com' },
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: rows.slice(0, 50).map((r, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: r.name,
              url: `https://elucidatechess.com/position/${r.id}`,
            })),
          },
        }}
        jsonLdId={`theme-${slug}`}
      />

      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" />
            <Link to="/" className="text-lg font-bold font-display text-foreground hover:text-primary">
              Elucidate Chess
            </Link>
            <LiveVisitorsBadge />
          </div>
          <div className="flex items-center gap-3">
            <Link to="/vocabulary"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" /> Vocabulary</Button></Link>
            <Link to="/play"><Button size="sm">Start Training</Button></Link>
          </div>
        </nav>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/vocabulary" className="hover:text-primary">Vocabulary</Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">{theme.title}</span>
        </nav>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
            <BookOpen className="w-3.5 h-3.5" />
            Tactical Theme
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {theme.title} Positions
          </h1>
          <p className="text-muted-foreground max-w-2xl">{theme.summary}</p>
          <Link to={`/vocabulary#${slug}`} className="inline-block text-sm text-primary hover:underline">
            Learn the {theme.title.toLowerCase()} pattern →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-muted-foreground">No positions tagged with {theme.title} yet.</p>
            <Link to="/play"><Button>Browse all positions</Button></Link>
          </div>
        ) : (
          <div className="space-y-8">
            {(['beginner', 'intermediate', 'advanced', 'master'] as const).map((diff) => {
              const list = grouped[diff];
              if (list.length === 0) return null;
              return (
                <div key={diff} className="space-y-3">
                  <h2 className={`text-xs font-bold uppercase tracking-wider ${difficultyColor(diff)}`}>
                    {diff} <span className="text-muted-foreground font-normal">({list.length})</span>
                  </h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {list.map((p) => (
                      <Link
                        key={p.id}
                        to={`/position/${p.id}`}
                        className="chess-card p-4 rounded-xl flex items-start gap-3 hover:border-primary/40 transition-colors border border-border/50"
                      >
                        <span className="font-mono font-bold text-primary text-xs flex-shrink-0 mt-0.5">#{p.id}</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">{p.name}</div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.explanation}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Related themes */}
        <section className="border-t border-border/50 pt-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Explore other themes</h3>
          <div className="flex flex-wrap gap-2">
            {THEMES.filter((t) => t.slug !== slug).map((t) => (
              <Link
                key={t.slug}
                to={`/positions/theme/${t.slug}`}
                className="px-3 py-1 rounded-full text-xs bg-secondary text-muted-foreground hover:text-primary hover:border-primary/40 border border-border transition-colors"
              >
                {t.title}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />
      <ChessQuoteFooter />
    </div>
  );
}
