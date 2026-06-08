import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const ADMIN_PASSWORD = 'lasker';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    if (body?.password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const [profilesRes, attemptsRes, countRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, puzzles_solved, average_score, is_premium, beginner_solved, intermediate_solved, advanced_solved'),
      supabase
        .from('puzzle_attempts')
        .select('puzzle_id, attempted_at, user_id')
        .order('attempted_at', { ascending: false })
        .limit(20),
      supabase
        .from('puzzle_attempts')
        .select('*', { count: 'exact', head: true }),
    ]);

    const profiles = profilesRes.data ?? [];
    const attempts = attemptsRes.data ?? [];
    const totalAttempts = countRes.count ?? 0;

    const totalUsers = profiles.length;
    const premiumUsers = profiles.filter((p: any) => p.is_premium).length;
    const freeUsers = totalUsers - premiumUsers;
    const totalPuzzlesSolved = profiles.reduce((s: number, p: any) => s + (p.puzzles_solved || 0), 0);
    const avgScore = totalUsers > 0
      ? Math.round(profiles.reduce((s: number, p: any) => s + (p.average_score || 0), 0) / totalUsers)
      : 0;

    const topUsers = [...profiles]
      .sort((a: any, b: any) => b.puzzles_solved - a.puzzles_solved)
      .slice(0, 10);

    const difficultyBreakdown = {
      beginner: profiles.reduce((s: number, p: any) => s + (p.beginner_solved || 0), 0),
      intermediate: profiles.reduce((s: number, p: any) => s + (p.intermediate_solved || 0), 0),
      advanced: profiles.reduce((s: number, p: any) => s + (p.advanced_solved || 0), 0),
    };

    return new Response(
      JSON.stringify({
        totalUsers,
        freeUsers,
        premiumUsers,
        totalPuzzlesSolved,
        totalAttempts,
        avgScore,
        recentAttempts: attempts,
        topUsers,
        difficultyBreakdown,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
