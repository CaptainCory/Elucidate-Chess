import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_LIMIT = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      // Anonymous user — use client-side tracking (they can't bypass payment anyway since analyze-chess also checks)
      return new Response(JSON.stringify({ allowed: true, remaining: DAILY_LIMIT, isPremium: false, anonymous: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ allowed: true, remaining: DAILY_LIMIT, isPremium: false, anonymous: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;

    // Check premium status from DB (tamper-proof)
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("user_id", user.id)
      .maybeSingle();

    const isPremium = profile?.is_premium === true;

    if (isPremium) {
      return new Response(JSON.stringify({ allowed: true, remaining: -1, isPremium: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count today's attempts
    const { data: countResult } = await supabase.rpc("get_daily_attempt_count", { p_user_id: user.id });
    const dailyCount = countResult ?? 0;
    const remaining = Math.max(0, DAILY_LIMIT - dailyCount);

    return new Response(JSON.stringify({
      allowed: remaining > 0,
      remaining,
      dailyCount,
      isPremium: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[VALIDATE-PUZZLE-ACCESS] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
