import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get today's daily challenge
    const today = new Date().toISOString().split('T')[0];
    const { data: challenge, error: challengeError } = await supabase
      .from('daily_challenges')
      .select('puzzle_id')
      .eq('challenge_date', today)
      .maybeSingle();

    if (challengeError || !challenge) {
      return new Response(JSON.stringify({ error: 'No daily challenge found for today' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get puzzle details
    const { data: puzzle } = await supabase
      .from('puzzles')
      .select('name, difficulty, themes')
      .eq('id', challenge.puzzle_id)
      .maybeSingle();

    // Get all active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('email_subscribers')
      .select('email')
      .eq('unsubscribed', false);

    if (subError || !subscribers?.length) {
      return new Response(JSON.stringify({ message: 'No active subscribers', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const siteUrl = 'https://think-chess-wise.lovable.app';
    const puzzleName = puzzle?.name ?? 'Daily Position';
    const difficulty = puzzle?.difficulty ?? 'beginner';
    const themes = puzzle?.themes?.join(', ') ?? '';

    const htmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d1f1a;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1f1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#162b24;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 32px 16px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;color:#d4a520;font-family:Georgia,serif;">♔ Elucidate Chess</div>
          <div style="color:#7a9b8e;font-size:13px;margin-top:4px;">Your Daily Position</div>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <div style="background:#1a3329;border-radius:8px;padding:24px;text-align:center;">
            <div style="font-size:20px;color:#e8dcc8;font-weight:bold;margin-bottom:8px;">${puzzleName}</div>
            <div style="color:#7a9b8e;font-size:14px;margin-bottom:4px;">Difficulty: <span style="color:#d4a520;text-transform:capitalize;">${difficulty}</span></div>
            ${themes ? `<div style="color:#7a9b8e;font-size:13px;">Themes: ${themes}</div>` : ''}
          </div>
        </td></tr>
        <tr><td style="padding:0 32px 32px;text-align:center;">
          <a href="${siteUrl}/daily" style="display:inline-block;background:#d4a520;color:#0d1f1a;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;text-decoration:none;">
            Play Today's Position →
          </a>
        </td></tr>
        <tr><td style="padding:0 32px 24px;text-align:center;">
          <div style="color:#4a6b5e;font-size:12px;">
            Think deeply. Explain your reasoning. Get better at chess.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send emails in batches of 10 with delay
    let sent = 0;
    let errors = 0;
    const batchSize = 10;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(async (sub) => {
          const res = await fetch(`${GATEWAY_URL}/emails`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'X-Connection-Api-Key': RESEND_API_KEY,
            },
            body: JSON.stringify({
              from: 'Elucidate Chess <onboarding@resend.dev>',
              to: [sub.email],
              subject: `♟️ Today's Position: ${puzzleName}`,
              html: htmlEmail,
            }),
          });
          if (!res.ok) {
            const body = await res.text();
            throw new Error(`Resend API error [${res.status}]: ${body}`);
          }
          await res.json();
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') sent++;
        else { errors++; console.error('Send error:', r.reason); }
      }

      // Small delay between batches
      if (i + batchSize < subscribers.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    return new Response(JSON.stringify({ message: 'Daily emails sent', sent, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending daily emails:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
