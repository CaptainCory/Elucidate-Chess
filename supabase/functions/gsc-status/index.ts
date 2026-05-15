// Fetches Google Search Console performance + indexing data via the Lovable connector gateway.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY = 'https://connector-gateway.lovable.dev/google_search_console';
const SITE = 'https://elucidatechess.com/';
const SITE_ENC = encodeURIComponent(SITE);

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function gscFetch(path: string, init: RequestInit = {}) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const GSC_KEY = Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');
  if (!GSC_KEY) throw new Error('GOOGLE_SEARCH_CONSOLE_API_KEY is not configured');

  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': GSC_KEY,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    throw new Error(`GSC ${path} [${res.status}]: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const startDate = isoDaysAgo(28);
    const endDate = isoDaysAgo(1);

    const [totals, byDate, topQueries, topPages, sitemaps] = await Promise.all([
      gscFetch(`/webmasters/v3/sites/${SITE_ENC}/searchAnalytics/query`, {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate, dimensions: [], rowLimit: 1 }),
      }),
      gscFetch(`/webmasters/v3/sites/${SITE_ENC}/searchAnalytics/query`, {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate, dimensions: ['date'], rowLimit: 100 }),
      }),
      gscFetch(`/webmasters/v3/sites/${SITE_ENC}/searchAnalytics/query`, {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate, dimensions: ['query'], rowLimit: 25 }),
      }),
      gscFetch(`/webmasters/v3/sites/${SITE_ENC}/searchAnalytics/query`, {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate, dimensions: ['page'], rowLimit: 25 }),
      }),
      gscFetch(`/webmasters/v3/sites/${SITE_ENC}/sitemaps`),
    ]);

    return new Response(
      JSON.stringify({
        site: SITE,
        range: { startDate, endDate },
        totals: totals?.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 },
        byDate: byDate?.rows ?? [],
        topQueries: topQueries?.rows ?? [],
        topPages: topPages?.rows ?? [],
        sitemaps: sitemaps?.sitemap ?? [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('gsc-status error:', message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
