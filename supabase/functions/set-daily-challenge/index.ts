import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const today = new Date().toISOString().split('T')[0];

    // Check if today already has a challenge
    const { data: existing } = await supabase
      .from('daily_challenges')
      .select('id')
      .eq('challenge_date', today)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ message: 'Challenge already set for today', date: today }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pick a random puzzle
    const { data: puzzles, error: puzzleError } = await supabase
      .from('puzzles')
      .select('id')
      .order('id');

    if (puzzleError || !puzzles?.length) {
      throw new Error('No puzzles available');
    }

    const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];

    const { error: insertError } = await supabase
      .from('daily_challenges')
      .insert({ puzzle_id: randomPuzzle.id, challenge_date: today });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: 'Daily challenge set', date: today, puzzle_id: randomPuzzle.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error setting daily challenge:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
