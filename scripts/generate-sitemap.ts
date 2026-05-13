// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Pulls every public puzzle id from Supabase so each /position/:id is indexable.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://elucidatechess.com";
const SUPABASE_URL = "https://drwjkekivcxoiidxutit.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd2prZWtpdmN4b2lpZHh1dGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NjU2NzQsImV4cCI6MjA4NTU0MTY3NH0.wuOcV6EOqD9UYl-IoY--wTBCPr3vcXEnjInCjGpViIY";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/play", changefreq: "daily", priority: "0.9" },
  { path: "/how-it-works", changefreq: "monthly", priority: "0.8" },
  { path: "/vocabulary", changefreq: "monthly", priority: "0.8" },
  { path: "/quotes", changefreq: "monthly", priority: "0.6" },
  { path: "/daily", changefreq: "daily", priority: "0.8" },
  { path: "/leaderboard", changefreq: "daily", priority: "0.7" },
  { path: "/membership", changefreq: "monthly", priority: "0.7" },
];

async function fetchPuzzleEntries(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/puzzles?select=id&limit=5000`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      },
    );
    if (!res.ok) {
      console.warn(`sitemap: skipping puzzles (status ${res.status})`);
      return [];
    }
    const rows = (await res.json()) as Array<{ id: string }>;
    return rows.map((r) => ({
      path: `/position/${r.id}`,
      changefreq: "monthly" as const,
      priority: "0.6",
    }));
  } catch (err) {
    console.warn("sitemap: failed to fetch puzzles —", (err as Error).message);
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const puzzleEntries = await fetchPuzzleEntries();
  const entries = [...staticEntries, ...puzzleEntries];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
  console.log(`sitemap.xml written (${entries.length} entries: ${staticEntries.length} static + ${puzzleEntries.length} positions)`);
})();
