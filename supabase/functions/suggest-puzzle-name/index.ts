import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { explanation, bestMove, difficulty } = await req.json();

    if (!explanation || typeof explanation !== 'string' || explanation.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Explanation too short' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are naming a chess puzzle. Based on the explanation below, suggest ONE short, evocative title (2-5 words, Title Case). Focus on the tactical theme or key idea. Avoid generic words like "Puzzle" or "Position". Do not use quotes. Return ONLY the title, nothing else.

Best move: ${String(bestMove || '').slice(0, 20)}
Difficulty: ${String(difficulty || '').slice(0, 20)}
Explanation: ${String(explanation).slice(0, 500)}`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ error: 'AI request failed', detail: text }), {
        status: resp.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    let name = data?.choices?.[0]?.message?.content?.trim() || '';
    name = name.replace(/^["'`]+|["'`]+$/g, '').replace(/[\r\n].*$/s, '').trim().slice(0, 60);

    return new Response(JSON.stringify({ name }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
